const textEncoder = new TextEncoder();

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const meaningfulValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

const safeFilePart = (value, fallback = "parcel") => {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");

  return cleaned || fallback;
};

const normalizeFeature = (parcel) => {
  if (!parcel) return null;

  if (parcel.type === "Feature") {
    return {
      ...parcel,
      properties: { ...(parcel.properties || {}) },
    };
  }

  if (parcel.geometry) {
    return {
      type: "Feature",
      id: parcel.id ?? parcel.gid,
      geometry: parcel.geometry,
      properties: { ...(parcel.properties || {}) },
    };
  }

  return null;
};

const ensureClosedRing = (ring = []) => {
  if (!Array.isArray(ring) || ring.length === 0) return [];

  const output = ring.map((coordinate) => [...coordinate]);
  const first = output[0];
  const last = output[output.length - 1];

  if (
    !last ||
    Number(first?.[0]) !== Number(last?.[0]) ||
    Number(first?.[1]) !== Number(last?.[1])
  ) {
    output.push([...first]);
  }

  return output;
};

const coordinateTuple = (coordinate = []) => {
  const longitude = Number(coordinate[0]);
  const latitude = Number(coordinate[1]);
  const altitude =
    coordinate.length > 2 && Number.isFinite(Number(coordinate[2]))
      ? Number(coordinate[2])
      : 0;

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error("The selected parcel contains invalid coordinates.");
  }

  return `${longitude},${latitude},${altitude}`;
};

const ringToKml = (ring = []) =>
  ensureClosedRing(ring).map(coordinateTuple).join(" ");

const polygonToKml = (coordinates = []) => {
  if (!Array.isArray(coordinates) || !coordinates.length) {
    throw new Error("The selected parcel has no polygon coordinates.");
  }

  const [outerRing, ...innerRings] = coordinates;

  return `
    <Polygon>
      <tessellate>1</tessellate>
      <altitudeMode>clampToGround</altitudeMode>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>${ringToKml(outerRing)}</coordinates>
        </LinearRing>
      </outerBoundaryIs>
      ${innerRings
        .map(
          (ring) => `
      <innerBoundaryIs>
        <LinearRing>
          <coordinates>${ringToKml(ring)}</coordinates>
        </LinearRing>
      </innerBoundaryIs>`,
        )
        .join("")}
    </Polygon>`;
};

const geometryToKml = (geometry) => {
  if (!geometry) {
    throw new Error("The selected parcel does not contain geometry.");
  }

  if (geometry.type === "Polygon") {
    return polygonToKml(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return `
    <MultiGeometry>
      ${(geometry.coordinates || []).map(polygonToKml).join("")}
    </MultiGeometry>`;
  }

  throw new Error(
    `KMZ export supports parcel Polygon and MultiPolygon geometry, not ${geometry.type || "unknown geometry"}.`,
  );
};

const propertyValueToString = (value) => {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const buildExtendedData = (properties) =>
  Object.entries(properties)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) => `
      <Data name="${escapeXml(key)}">
        <displayName>${escapeXml(key)}</displayName>
        <value>${escapeXml(propertyValueToString(value))}</value>
      </Data>`,
    )
    .join("");

const buildDescription = (properties) => {
  const rows = Object.entries(properties)
    .filter(
      ([, value]) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    )
    .map(
      ([key, value]) =>
        `<tr><th style="text-align:left;padding:4px 8px;border-bottom:1px solid #ddd;">${escapeXml(
          key,
        )}</th><td style="padding:4px 8px;border-bottom:1px solid #ddd;">${escapeXml(
          propertyValueToString(value),
        )}</td></tr>`,
    )
    .join("");

  return `<![CDATA[
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
      ${rows}
    </table>
  ]]>`;
};

const buildKml = (feature, { verified }) => {
  const sourceProperties = { ...(feature.properties || {}) };
  const exportProperties = {
    ...sourceProperties,
    parcel_id: meaningfulValue(
      sourceProperties.parcel_id,
      sourceProperties.gid,
      sourceProperties.id,
      feature.id,
    ),
    khasra_number: meaningfulValue(
      sourceProperties.kh,
      sourceProperties.KH,
      sourceProperties.k,
      sourceProperties.K,
      sourceProperties.khasra,
      sourceProperties.khasra_no,
      sourceProperties.khasra_id,
      sourceProperties.join_shp,
    ),
    mauza: meaningfulValue(
      sourceProperties.mauza,
      sourceProperties.mauza_name,
      sourceProperties.Mauza,
      sourceProperties.moza,
    ),
    tehsil: meaningfulValue(
      sourceProperties.tehsil,
      sourceProperties.tehsil_name,
      sourceProperties.Tehsil,
    ),
    district: meaningfulValue(
      sourceProperties.district,
      sourceProperties.district_name,
      sourceProperties.District,
    ),
    verified_status: verified ? "Yes" : "No",
  };

  const name = meaningfulValue(
    exportProperties.khasra_number,
    exportProperties.parcel_id,
    "Selected Parcel",
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(name)}</name>
    <Style id="selectedParcelStyle">
      <LineStyle>
        <color>ff006400</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>6600a000</color>
        <fill>1</fill>
        <outline>1</outline>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>${escapeXml(name)}</name>
      <styleUrl>#selectedParcelStyle</styleUrl>
      <description>${buildDescription(exportProperties)}</description>
      <ExtendedData>${buildExtendedData(exportProperties)}
      </ExtendedData>
      ${geometryToKml(feature.geometry)}
    </Placemark>
  </Document>
</kml>`;
};

const crcTable = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

const crc32 = (bytes) => {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (view, offset, value) =>
  view.setUint16(offset, value, true);

const writeUint32 = (view, offset, value) =>
  view.setUint32(offset, value >>> 0, true);

const createStoredZip = (filename, content) => {
  const filenameBytes = textEncoder.encode(filename);
  const contentBytes = textEncoder.encode(content);
  const checksum = crc32(contentBytes);

  const localHeaderLength = 30 + filenameBytes.length;
  const centralHeaderLength = 46 + filenameBytes.length;
  const endRecordLength = 22;
  const totalLength =
    localHeaderLength +
    contentBytes.length +
    centralHeaderLength +
    endRecordLength;

  const output = new Uint8Array(totalLength);
  const view = new DataView(output.buffer);
  let offset = 0;

  writeUint32(view, offset, 0x04034b50);
  writeUint16(view, offset + 4, 20);
  writeUint16(view, offset + 6, 0x0800);
  writeUint16(view, offset + 8, 0);
  writeUint16(view, offset + 10, 0);
  writeUint16(view, offset + 12, 0);
  writeUint32(view, offset + 14, checksum);
  writeUint32(view, offset + 18, contentBytes.length);
  writeUint32(view, offset + 22, contentBytes.length);
  writeUint16(view, offset + 26, filenameBytes.length);
  writeUint16(view, offset + 28, 0);
  output.set(filenameBytes, offset + 30);
  output.set(contentBytes, offset + localHeaderLength);

  const centralOffset = localHeaderLength + contentBytes.length;
  offset = centralOffset;

  writeUint32(view, offset, 0x02014b50);
  writeUint16(view, offset + 4, 20);
  writeUint16(view, offset + 6, 20);
  writeUint16(view, offset + 8, 0x0800);
  writeUint16(view, offset + 10, 0);
  writeUint16(view, offset + 12, 0);
  writeUint16(view, offset + 14, 0);
  writeUint32(view, offset + 16, checksum);
  writeUint32(view, offset + 20, contentBytes.length);
  writeUint32(view, offset + 24, contentBytes.length);
  writeUint16(view, offset + 28, filenameBytes.length);
  writeUint16(view, offset + 30, 0);
  writeUint16(view, offset + 32, 0);
  writeUint16(view, offset + 34, 0);
  writeUint16(view, offset + 36, 0);
  writeUint32(view, offset + 38, 0);
  writeUint32(view, offset + 42, 0);
  output.set(filenameBytes, offset + 46);

  offset = centralOffset + centralHeaderLength;

  writeUint32(view, offset, 0x06054b50);
  writeUint16(view, offset + 4, 0);
  writeUint16(view, offset + 6, 0);
  writeUint16(view, offset + 8, 1);
  writeUint16(view, offset + 10, 1);
  writeUint32(view, offset + 12, centralHeaderLength);
  writeUint32(view, offset + 16, centralOffset);
  writeUint16(view, offset + 20, 0);

  return output;
};

const triggerDownload = (bytes, filename) => {
  const blob = new Blob([bytes], {
    type: "application/vnd.google-earth.kmz",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportSelectedParcelKMZ = (
  parcel,
  { verified = false, filenamePrefix = "parcel", displayName = null } = {},
) => {
  const feature = normalizeFeature(parcel);

  if (!feature?.geometry) {
    console.error(
      "KMZ export failed: selected parcel geometry is unavailable.",
    );
    return;
  }

  try {
    const exportFeature = displayName
      ? { ...feature, properties: { ...(feature.properties || {}), name: displayName } }
      : feature;
    const kml = buildKml(exportFeature, { verified });
    const properties = feature.properties || {};
    const identifier = meaningfulValue(
      properties.kh,
      properties.KH,
      properties.khasra,
      properties.khasra_no,
      properties.gid,
      feature.id,
      "selected_parcel",
    );
    const kmzBytes = createStoredZip("doc.kml", kml);

    triggerDownload(
      kmzBytes,
      `${safeFilePart(`${filenamePrefix}_${identifier}`)}.kmz`,
    );
  } catch (error) {
    console.error("KMZ export failed:", error);
  }
};

const buildMultiPlacemark = (feature, { verified }, index) => {
  const sourceProperties = { ...(feature.properties || {}) };
  const exportProperties = {
    ...sourceProperties,
    parcel_id: meaningfulValue(
      sourceProperties.parcel_id,
      sourceProperties.gid,
      sourceProperties.id,
      feature.id,
    ),
    khasra_number: meaningfulValue(
      sourceProperties.kh,
      sourceProperties.KH,
      sourceProperties.k,
      sourceProperties.K,
      sourceProperties.khasra,
      sourceProperties.khasra_no,
      sourceProperties.khasra_id,
      sourceProperties.join_shp,
    ),
    mauza: meaningfulValue(
      sourceProperties.mauza,
      sourceProperties.mauza_name,
      sourceProperties.Mauza,
      sourceProperties.moza,
    ),
    tehsil: meaningfulValue(
      sourceProperties.tehsil,
      sourceProperties.tehsil_name,
      sourceProperties.Tehsil,
    ),
    district: meaningfulValue(
      sourceProperties.district,
      sourceProperties.district_name,
      sourceProperties.District,
    ),
    verified_status: verified ? "Yes" : "No",
  };

  const name = meaningfulValue(
    exportProperties.khasra_number,
    exportProperties.parcel_id,
    `Selected Parcel ${index + 1}`,
  );

  return `
    <Placemark>
      <name>${escapeXml(name)}</name>
      <styleUrl>#selectedParcelStyle</styleUrl>
      <description>${buildDescription(exportProperties)}</description>
      <ExtendedData>${buildExtendedData(exportProperties)}
      </ExtendedData>
      ${geometryToKml(feature.geometry)}
    </Placemark>`;
};

const buildMultiKml = (
  features,
  { verified },
) => `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Selected Parcels</name>
    <Style id="selectedParcelStyle">
      <LineStyle>
        <color>ff00ffff</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>6600ffff</color>
        <fill>1</fill>
        <outline>1</outline>
      </PolyStyle>
    </Style>
    ${features
      .map((feature, index) =>
        buildMultiPlacemark(feature, { verified }, index),
      )
      .join("")}
  </Document>
</kml>`;

export const exportSelectedParcelsKMZ = (
  parcels = [],
  { verified = false } = {},
) => {
  const features = (Array.isArray(parcels) ? parcels : [])
    .map(normalizeFeature)
    .filter((feature) => feature?.geometry);

  if (!features.length) {
    console.error(
      "KMZ export failed: no selected parcel geometry is available.",
    );
    return;
  }

  try {
    const kml = buildMultiKml(features, { verified });
    const kmzBytes = createStoredZip("doc.kml", kml);
    triggerDownload(
      kmzBytes,
      `${safeFilePart(`selected_parcels_${features.length}`)}.kmz`,
    );
  } catch (error) {
    console.error("Multiple parcel KMZ export failed:", error);
  }
};

export default exportSelectedParcelKMZ;
