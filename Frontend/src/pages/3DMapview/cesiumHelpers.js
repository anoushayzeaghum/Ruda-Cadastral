import * as Cesium from "cesium";

export const DEFAULT_VIEW = {
  lon: 74.2484,
  lat: 31.6176,
  height: 45000,
};

export function emptyFeatureCollection() {
  return { type: "FeatureCollection", features: [] };
}

export function getFeatureId(feature, fallback = "feature") {
  const props = feature?.properties || {};
  return String(
    feature?.id ??
      props.id ??
      props.gid ??
      props.objectid ??
      props.plot_id ??
      props.plot_no ??
      props.parcel_id ??
      props.parcelid ??
      props.khasra_id ??
      props.kh ??
      props.k ??
      fallback,
  );
}

function getPossibleIds(feature) {
  const props = feature?.properties || {};
  return [
    feature?.id,
    props.id,
    props.gid,
    props.objectid,
    props.plot_id,
    props.plot_no,
    props.parcel_id,
    props.parcelid,
    props.khasra_id,
    props.kh,
    props.k,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map((value) => String(value));
}

/*
  IMPORTANT:
  This is the easiest place to control special features manually.

  Example:
  - gid 253 is your green/open-space polygon, so it is kept flat and green.
  - Add more gid/objectid values here when you identify roads, parks, plazas, etc.
*/
const FEATURE_STYLE_OVERRIDES = {
  253: {
    category: "greenSpace",
    label: "Green Space",
    fillColor: "#26c961",
    outlineColor: "#14532d",
    opacity: 0.9,
    extrude: false,
    heightMeters: 0,
  },

  // Add your own IDs like this:
  // "254": { category: "road", fillColor: "#22c55e", extrude: false, heightMeters: 0 },
  // "300": { category: "commercial", fillColor: "#facc15", heightMeters: 55 },
  // "301": { category: "civic", fillColor: "#ef4444", heightMeters: 45 },
};

const CATEGORY_PALETTES = {
  residential: ["#7dd3fc", "#60a5fa", "#93c5fd", "#bae6fd", "#67e8f9"],
  commercial: ["#facc15", "#eab308", "#f59e0b", "#fb923c"],
  civic: ["#ef4444", "#dc2626", "#94a3b8", "#64748b"],
  mixedUse: ["#c084fc", "#d8b4fe", "#a855f7", "#e879f9"],
  greenSpace: ["#16a34a"],
  road: ["#22c55e"],
  water: ["#38bdf8"],
};

function hashString(value = "") {
  let hash = 0;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickFromPalette(category, seed) {
  const palette = CATEGORY_PALETTES[category] || CATEGORY_PALETTES.residential;
  return palette[hashString(seed) % palette.length];
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

function normalizeLandUseValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ");
}

function getLandUseValue(feature) {
  const props = feature?.properties || {};

  return normalizeLandUseValue(
    props.land_use ??
      props.landuse ??
      props.landUse ??
      props.LAND_USE ??
      props.LANDUSE ??
      props.Land_Use ??
      props.Landuse ??
      props.land_use_type ??
      props.use ??
      props.type ??
      "",
  );
}

function getStyleFromLandUse(feature) {
  const landUse = getLandUseValue(feature);

  if (!landUse) return null;

  if (landUse === "residential plot" || /\bresidential\b/.test(landUse)) {
    return {
      category: "residential",
      label: "Residential Plot",
      fillColor: "#0d6efd",
      outlineColor: "#002a6a",
      opacity: 1,
      extrude: true,
    };
  }

  if (landUse === "commercial plot" || /\bcommercial\b/.test(landUse)) {
    return {
      category: "commercial",
      label: "Commercial Plot",
      fillColor: "#efb400",
      outlineColor: "#c49300",
      opacity: 1,
      extrude: true,
    };
  }

  if (landUse === "green belt" || /green\s*belt/.test(landUse)) {
    return {
      category: "greenBelt",
      label: "Green Belt",
      fillColor: "#24ba74",
      outlineColor: "#14532d",
      opacity: 1,
      extrude: false,
      heightMeters: 0,
    };
  }

  if (landUse === "barren land" || /barren/.test(landUse)) {
    return {
      category: "barrenLand",
      label: "Barren Land",
      fillColor: "#92400e",
      outlineColor: "#451a03",
      opacity: 1,
      extrude: false,
      heightMeters: 0,
    };
  }

  if (
    landUse === "road" ||
    /\broad\b|street|avenue|boulevard|drive|walkway|right of way|row/.test(
      landUse,
    )
  ) {
    return {
      category: "road",
      label: "Road",
      fillColor: "#ef4444",
      outlineColor: "#7f1d1d",
      opacity: 1,
      extrude: false,
      heightMeters: 0,
    };
  }

  if (landUse === "park" || /\bpark\b|garden|playground/.test(landUse)) {
    return {
      category: "park",
      label: "Park",
      fillColor: "#14532d",
      outlineColor: "#052e16",
      opacity: 1,
      extrude: false,
      heightMeters: 0,
    };
  }

  return null;
}

function getSearchableProperties(feature) {
  const props = feature?.properties || {};
  return [
    props.landuse,
    props.land_use,
    props.use,
    props.type,
    props.category,
    props.class,
    props.name,
    props.label,
    props.description,
    props.remarks,
    props.zone,
    props.block,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
}

function firstMatchingOverride(feature) {
  const ids = getPossibleIds(feature);
  return ids.map((id) => FEATURE_STYLE_OVERRIDES[id]).find(Boolean) || null;
}

function ringAreaSqMeters(ring = []) {
  if (!Array.isArray(ring) || ring.length < 3) return 0;

  const valid = ring
    .map((coord) => [Number(coord?.[0]), Number(coord?.[1])])
    .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));

  if (valid.length < 3) return 0;

  const earthRadius = 6378137;
  const avgLat = valid.reduce((sum, coord) => sum + coord[1], 0) / valid.length;
  const lat0 = Cesium.Math.toRadians(avgLat);

  const projected = valid.map(([lon, lat]) => {
    const x = earthRadius * Cesium.Math.toRadians(lon) * Math.cos(lat0);
    const y = earthRadius * Cesium.Math.toRadians(lat);
    return [x, y];
  });

  let area = 0;
  for (let i = 0; i < projected.length; i += 1) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[(i + 1) % projected.length];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2);
}

function ringPerimeterMeters(ring = []) {
  if (!Array.isArray(ring) || ring.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    const lon1 = Number(current?.[0]);
    const lat1 = Number(current?.[1]);
    const lon2 = Number(next?.[0]);
    const lat2 = Number(next?.[1]);

    if (
      !Number.isFinite(lon1) ||
      !Number.isFinite(lat1) ||
      !Number.isFinite(lon2) ||
      !Number.isFinite(lat2)
    ) {
      continue;
    }

    const c1 = Cesium.Cartographic.fromDegrees(lon1, lat1);
    const c2 = Cesium.Cartographic.fromDegrees(lon2, lat2);
    const geodesic = new Cesium.EllipsoidGeodesic(c1, c2);
    total += geodesic.surfaceDistance;
  }

  return total;
}

function getPolygonAreaSqMeters(coordinates = []) {
  if (!Array.isArray(coordinates) || !coordinates.length) return 0;
  const outer = ringAreaSqMeters(coordinates[0]);
  const holes = coordinates
    .slice(1)
    .reduce((sum, ring) => sum + ringAreaSqMeters(ring), 0);
  return Math.max(outer - holes, 0);
}

function getPolygonPerimeterMeters(coordinates = []) {
  if (!Array.isArray(coordinates) || !coordinates.length) return 0;
  return ringPerimeterMeters(coordinates[0]);
}

function getFeatureAreaSqMeters(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return 0;

  if (geometry.type === "Polygon")
    return getPolygonAreaSqMeters(geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (sum, polygon) => sum + getPolygonAreaSqMeters(polygon),
      0,
    );
  }

  return 0;
}

function getFeaturePerimeterMeters(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return 0;

  if (geometry.type === "Polygon")
    return getPolygonPerimeterMeters(geometry.coordinates);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (sum, polygon) => sum + getPolygonPerimeterMeters(polygon),
      0,
    );
  }

  return 0;
}

function classifyFeature(feature, options = {}) {
  const override = firstMatchingOverride(feature);
  if (override?.category) return override.category;

  const text = getSearchableProperties(feature);
  const area = getFeatureAreaSqMeters(feature);
  const perimeter = getFeaturePerimeterMeters(feature);
  const thinness = perimeter > 0 ? area / perimeter : Number.POSITIVE_INFINITY;

  if (
    /green|park|open|garden|landscape|recreation|playground|lawn|grass|tree/.test(
      text,
    )
  )
    return "greenSpace";
  if (/water|lake|pond|canal|drain|stream/.test(text)) return "water";
  if (
    /road|street|avenue|boulevard|drive|path|walk|walkway|row|right.?of.?way|transport|parking/.test(
      text,
    )
  ) {
    return "road";
  }
  if (/commercial|market|shop|business|mall|office|retail/.test(text))
    return "commercial";
  if (/mixed|mixed.?use/.test(text)) return "mixedUse";
  if (
    /public|civic|facility|amenity|mosque|school|hospital|clinic|community|plaza|graveyard|utility/.test(
      text,
    )
  ) {
    return "civic";
  }
  if (/residential|plot|parcel|house|housing|block/.test(text))
    return "residential";

  // Geometry-based fallback for data with no landuse/height/category fields.
  // Long, thin polygons normally represent road corridors in a master plan.
  if (
    (options.key === "plots3d" || options.key === "buildings3d") &&
    area > 700 &&
    thinness < 8
  ) {
    return "road";
  }

  // Very large polygons in a society master plan are usually parks, plazas, facilities, or circulation areas.
  // Keep them lower instead of making one giant tower.
  if (
    (options.key === "plots3d" || options.key === "buildings3d") &&
    area > 18000
  ) {
    return "civic";
  }

  return options.key === "buildings3d" ? "commercial" : "residential";
}

export function getHeightMeters(feature, fallbackFeet = 35) {
  const props = feature?.properties || {};
  const floorCount = Number(
    props.floor_count ?? props.floors ?? props.no_of_floors ?? props.storeys,
  );
  const heightValue = Number(
    props.height_m ??
      props.height_meter ??
      props.height ??
      props.building_height,
  );
  const heightFeet = Number(props.height_ft ?? props.height_feet);

  if (Number.isFinite(heightValue) && heightValue > 0) return heightValue;
  if (Number.isFinite(heightFeet) && heightFeet > 0) return heightFeet * 0.3048;
  if (Number.isFinite(floorCount) && floorCount > 0) return floorCount * 3.2;

  return Number(fallbackFeet ?? 35) * 0.3048;
}

function getAutoHeightMeters(feature, category, options = {}) {
  const explicitHeight = getHeightMeters(feature, 0);
  if (explicitHeight > 0) return explicitHeight;

  if (
    ["greenSpace", "greenBelt", "road", "water", "park", "barrenLand"].includes(
      category,
    )
  )
    return 0;

  const featureId = getFeatureId(feature);
  const area = getFeatureAreaSqMeters(feature);
  const hash = hashString(`${options.key || "layer"}-${featureId}`);

  let min = 10;
  let max = 30;

  if (category === "commercial") {
    min = 28;
    max = 95;
  } else if (category === "civic") {
    min = 14;
    max = 55;
  } else if (category === "mixedUse") {
    min = 24;
    max = 75;
  } else if (options.key === "buildings3d") {
    min = 22;
    max = 80;
  }

  const randomPart = min + (hash % Math.max(max - min, 1));
  const areaBonus = Math.min(18, Math.sqrt(Math.max(area, 0)) / 14);

  return Math.round(randomPart + areaBonus);
}

function getSmartFeatureStyle(feature, options = {}) {
  const override = firstMatchingOverride(feature);
  const landUseStyle = getStyleFromLandUse(feature);

  const category =
    override?.category ||
    landUseStyle?.category ||
    classifyFeature(feature, options);
  const featureId = getFeatureId(feature);
  const autoFill = pickFromPalette(category, featureId);

  const flatCategories = [
    "greenSpace",
    "greenBelt",
    "road",
    "water",
    "park",
    "barrenLand",
  ];

  const baseStyle = {
    category,
    label: landUseStyle?.label || category,
    fillColor: landUseStyle?.fillColor || autoFill,
    outlineColor:
      landUseStyle?.outlineColor ||
      (flatCategories.includes(category) ? "#064e3b" : "#172554"),
    opacity: landUseStyle?.opacity ?? options.opacity,
    extrude: landUseStyle?.extrude ?? !flatCategories.includes(category),
    heightMeters:
      landUseStyle?.heightMeters ??
      getAutoHeightMeters(feature, category, options),
  };

  if (!landUseStyle && category === "greenSpace") {
    baseStyle.fillColor = "#16a34a";
    baseStyle.outlineColor = "#14532d";
    baseStyle.opacity = 1;
  }

  if (!landUseStyle && category === "road") {
    baseStyle.fillColor = "#ef4444";
    baseStyle.outlineColor = "#7f1d1d";
    baseStyle.opacity = 1;
  }

  if (!landUseStyle && category === "water") {
    baseStyle.fillColor = "#38bdf8";
    baseStyle.outlineColor = "#0369a1";
    baseStyle.opacity = 0.85;
  }

  return {
    ...baseStyle,
    ...(override || {}),
  };
}

export function flattenCoordinates(coordinates, output = []) {
  if (!Array.isArray(coordinates)) return output;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    output.push(coordinates);
    return output;
  }

  coordinates.forEach((child) => flattenCoordinates(child, output));
  return output;
}

export function getBoundsFromGeoJSON(geojson) {
  const coords = flattenCoordinates(
    geojson?.features?.map((feature) => feature.geometry?.coordinates) || [],
  );

  if (!coords.length) return null;

  const xs = coords.map((coord) => Number(coord[0])).filter(Number.isFinite);
  const ys = coords.map((coord) => Number(coord[1])).filter(Number.isFinite);

  if (!xs.length || !ys.length) return null;

  return {
    west: Math.min(...xs),
    south: Math.min(...ys),
    east: Math.max(...xs),
    north: Math.max(...ys),
  };
}

export function flyToGeoJSON(viewer, geojson, options = {}) {
  const bounds = getBoundsFromGeoJSON(geojson);
  if (!viewer || !bounds) return;

  const rectangle = Cesium.Rectangle.fromDegrees(
    bounds.west,
    bounds.south,
    bounds.east,
    bounds.north,
  );

  viewer.camera.flyTo({
    destination: rectangle,
    duration: options.duration ?? 1.2,
    orientation: {
      heading: Cesium.Math.toRadians(options.heading ?? 0),
      pitch: Cesium.Math.toRadians(options.pitch ?? -45),
      roll: 0,
    },
  });
}

function color(cssColor, alpha = 1) {
  return Cesium.Color.fromCssColorString(cssColor || "#ffffff").withAlpha(
    alpha ?? 1,
  );
}

function ringToCartesian(ring = []) {
  const values = [];
  ring.forEach((coord) => {
    const lon = Number(coord?.[0]);
    const lat = Number(coord?.[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      values.push(lon, lat);
    }
  });
  return Cesium.Cartesian3.fromDegreesArray(values);
}

function polygonHierarchyFromCoordinates(coordinates = []) {
  const outer = ringToCartesian(coordinates[0] || []);
  const holes = coordinates
    .slice(1)
    .map((ring) => new Cesium.PolygonHierarchy(ringToCartesian(ring)))
    .filter((hierarchy) => hierarchy.positions?.length);

  return new Cesium.PolygonHierarchy(outer, holes);
}

function linePositions(coordinates = []) {
  const values = [];
  coordinates.forEach((coord) => {
    const lon = Number(coord?.[0]);
    const lat = Number(coord?.[1]);
    const height = Number(coord?.[2] || 0);
    if (Number.isFinite(lon) && Number.isFinite(lat))
      values.push(lon, lat, height);
  });
  return Cesium.Cartesian3.fromDegreesArrayHeights(values);
}

function pointPosition(coordinates = []) {
  const lon = Number(coordinates?.[0]);
  const lat = Number(coordinates?.[1]);
  const height = Number(coordinates?.[2] || 0);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
}

function createPolygonEntity(
  viewer,
  feature,
  coordinates,
  options,
  fallbackIndex,
) {
  const featureId = getFeatureId(feature, `${options.key}-${fallbackIndex}`);
  const override = options.extrusionOverrides?.[featureId];
  const smartStyle = options.smartStyle
    ? getSmartFeatureStyle(feature, options)
    : null;

  const fillColor =
    override?.color || smartStyle?.fillColor || options.fillColor || "#38bdf8";
  const finalOpacity = Number.isFinite(Number(smartStyle?.opacity))
    ? smartStyle.opacity
    : options.opacity;
  const material = color(fillColor, finalOpacity);
  const outlineColor = color(
    smartStyle?.outlineColor || options.outlineColor || "#111827",
    1,
  );

  const shouldExtrude =
    Boolean(options.extrude) && smartStyle?.extrude !== false;
  const extrudedHeight = shouldExtrude
    ? Number(
        override?.heightMeters ??
          smartStyle?.heightMeters ??
          getHeightMeters(feature, options.defaultHeightFeet),
      )
    : undefined;

  const entity = viewer.entities.add({
    name: smartStyle?.label || options.name,
    polygon: {
      hierarchy: polygonHierarchyFromCoordinates(coordinates),
      material,
      outline: true,
      outlineColor,
      outlineWidth: options.outlineWidth || 1,
      height: 0,
      extrudedHeight,
      closeTop: true,
      closeBottom: true,
      shadows: Cesium.ShadowMode.DISABLED,
    },
  });

  entity.featureData = {
    ...feature,
    properties: {
      ...(feature.properties || {}),
      _visualCategory: smartStyle?.category,
      _visualHeightMeters: extrudedHeight ?? 0,
    },
  };
  entity.featureId = featureId;
  entity.layerKey = options.key;
  entity.originalMaterial = material;
  entity.originalOutlineColor = outlineColor;

  return entity;
}

function createLineEntity(
  viewer,
  feature,
  coordinates,
  options,
  fallbackIndex,
) {
  const entity = viewer.entities.add({
    name: options.name,
    polyline: {
      positions: linePositions(coordinates),
      width: options.width || 2,
      material: color(
        options.lineColor || options.outlineColor || "#0f172a",
        options.opacity,
      ),
      clampToGround: options.clampToGround ?? true,
    },
  });

  entity.featureData = feature;
  entity.featureId = getFeatureId(feature, `${options.key}-${fallbackIndex}`);
  entity.layerKey = options.key;
  entity.originalWidth = options.width || 2;
  return entity;
}

function createPointEntity(
  viewer,
  feature,
  coordinates,
  options,
  fallbackIndex,
) {
  const position = pointPosition(coordinates);
  if (!position) return null;

  const props = feature?.properties || {};
  const labelText =
    props.level ?? props.spot_level ?? props.elevation ?? props.z ?? "";

  const entity = viewer.entities.add({
    name: options.name,
    position,
    point: {
      pixelSize: options.pixelSize || 7,
      color: color(
        options.pointColor || options.fillColor || "#ef4444",
        options.opacity,
      ),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: labelText
      ? {
          text: String(labelText),
          font: "11px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.45),
        }
      : undefined,
  });

  entity.featureData = feature;
  entity.featureId = getFeatureId(feature, `${options.key}-${fallbackIndex}`);
  entity.layerKey = options.key;
  entity.originalPixelSize = options.pixelSize || 7;
  return entity;
}

export function addGeoJSONLayer(viewer, geojson, options = {}) {
  if (!viewer || !geojson?.features?.length) return [];

  const entities = [];

  geojson.features.forEach((feature, featureIndex) => {
    const geometry = feature?.geometry;
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      const entity = createPolygonEntity(
        viewer,
        feature,
        geometry.coordinates,
        options,
        featureIndex,
      );
      if (entity) entities.push(entity);
      return;
    }

    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygonCoords, polygonIndex) => {
        const entity = createPolygonEntity(
          viewer,
          feature,
          polygonCoords,
          options,
          `${featureIndex}-${polygonIndex}`,
        );
        if (entity) entities.push(entity);
      });
      return;
    }

    if (geometry.type === "LineString") {
      const entity = createLineEntity(
        viewer,
        feature,
        geometry.coordinates,
        options,
        featureIndex,
      );
      if (entity) entities.push(entity);
      return;
    }

    if (geometry.type === "MultiLineString") {
      geometry.coordinates.forEach((lineCoords, lineIndex) => {
        const entity = createLineEntity(
          viewer,
          feature,
          lineCoords,
          options,
          `${featureIndex}-${lineIndex}`,
        );
        if (entity) entities.push(entity);
      });
      return;
    }

    if (geometry.type === "Point") {
      const entity = createPointEntity(
        viewer,
        feature,
        geometry.coordinates,
        options,
        featureIndex,
      );
      if (entity) entities.push(entity);
      return;
    }

    if (geometry.type === "MultiPoint") {
      geometry.coordinates.forEach((pointCoords, pointIndex) => {
        const entity = createPointEntity(
          viewer,
          feature,
          pointCoords,
          options,
          `${featureIndex}-${pointIndex}`,
        );
        if (entity) entities.push(entity);
      });
    }
  });

  return entities;
}

export function setEntityHighlighted(entity, highlighted) {
  if (!entity) return;

  if (entity.polygon) {
    entity.polygon.material = highlighted
      ? Cesium.Color.YELLOW.withAlpha(0.88)
      : entity.originalMaterial || Cesium.Color.WHITE.withAlpha(0.4);
    entity.polygon.outlineColor = highlighted
      ? Cesium.Color.BLACK
      : entity.originalOutlineColor || Cesium.Color.BLACK;
  }

  if (entity.polyline) {
    entity.polyline.width = highlighted
      ? Math.max(Number(entity.originalWidth || 2) + 2, 4)
      : entity.originalWidth || 2;
  }

  if (entity.point) {
    entity.point.pixelSize = highlighted ? 12 : entity.originalPixelSize || 7;
  }
}

export function applyBasemap(viewer, basemap) {
  if (!viewer) return;

  viewer.imageryLayers.removeAll();

  if (basemap === "None") return;

  const providers = {
    Satellite: new Cesium.UrlTemplateImageryProvider({
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      credit: "Esri World Imagery",
    }),
    Streets: new Cesium.UrlTemplateImageryProvider({
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      credit: "© OpenStreetMap contributors",
    }),
    Light: new Cesium.UrlTemplateImageryProvider({
      url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      credit: "© OpenStreetMap contributors © CARTO",
    }),
  };

  viewer.imageryLayers.addImageryProvider(
    providers[basemap] || providers.Satellite,
  );
}
