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

export function getHeightMeters(feature, fallbackFeet = 35) {
  const props = feature?.properties || {};
  const floorCount = Number(props.floor_count ?? props.floors ?? props.no_of_floors ?? props.storeys);
  const heightValue = Number(props.height_m ?? props.height_meter ?? props.height ?? props.building_height);
  const heightFeet = Number(props.height_ft ?? props.height_feet);

  if (Number.isFinite(heightValue) && heightValue > 0) return heightValue;
  if (Number.isFinite(heightFeet) && heightFeet > 0) return heightFeet * 0.3048;
  if (Number.isFinite(floorCount) && floorCount > 0) return floorCount * 3.2;

  return Number(fallbackFeet || 35) * 0.3048;
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
  const coords = flattenCoordinates(geojson?.features?.map((feature) => feature.geometry?.coordinates) || []);

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
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(options.pitch ?? -45),
      roll: 0,
    },
  });
}

function color(cssColor, alpha = 1) {
  return Cesium.Color.fromCssColorString(cssColor).withAlpha(alpha);
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
    if (Number.isFinite(lon) && Number.isFinite(lat)) values.push(lon, lat, height);
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

function createPolygonEntity(viewer, feature, coordinates, options, fallbackIndex) {
  const featureId = getFeatureId(feature, `${options.key}-${fallbackIndex}`);
  const override = options.extrusionOverrides?.[featureId];
  const fillColor = override?.color || options.fillColor;
  const material = color(fillColor, options.opacity);
  const outlineColor = color(options.outlineColor || "#111827", 1);
  const shouldExtrude = Boolean(options.extrude);
  const extrudedHeight = shouldExtrude
    ? Number(override?.heightMeters || getHeightMeters(feature, options.defaultHeightFeet))
    : undefined;

  const entity = viewer.entities.add({
    name: options.name,
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
    },
  });

  entity.featureData = feature;
  entity.featureId = featureId;
  entity.layerKey = options.key;
  entity.originalMaterial = material;
  entity.originalOutlineColor = outlineColor;

  return entity;
}

function createLineEntity(viewer, feature, coordinates, options, fallbackIndex) {
  const entity = viewer.entities.add({
    name: options.name,
    polyline: {
      positions: linePositions(coordinates),
      width: options.width || 2,
      material: color(options.lineColor || options.outlineColor || "#0f172a", options.opacity),
      clampToGround: options.clampToGround ?? true,
    },
  });

  entity.featureData = feature;
  entity.featureId = getFeatureId(feature, `${options.key}-${fallbackIndex}`);
  entity.layerKey = options.key;
  return entity;
}

function createPointEntity(viewer, feature, coordinates, options, fallbackIndex) {
  const position = pointPosition(coordinates);
  if (!position) return null;

  const props = feature?.properties || {};
  const labelText = props.level ?? props.spot_level ?? props.elevation ?? props.z ?? "";

  const entity = viewer.entities.add({
    name: options.name,
    position,
    point: {
      pixelSize: options.pixelSize || 7,
      color: color(options.pointColor || options.fillColor || "#ef4444", options.opacity),
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
  return entity;
}

export function addGeoJSONLayer(viewer, geojson, options = {}) {
  if (!viewer || !geojson?.features?.length) return [];

  const entities = [];

  geojson.features.forEach((feature, featureIndex) => {
    const geometry = feature?.geometry;
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      const entity = createPolygonEntity(viewer, feature, geometry.coordinates, options, featureIndex);
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
      const entity = createLineEntity(viewer, feature, geometry.coordinates, options, featureIndex);
      if (entity) entities.push(entity);
      return;
    }

    if (geometry.type === "MultiLineString") {
      geometry.coordinates.forEach((lineCoords, lineIndex) => {
        const entity = createLineEntity(viewer, feature, lineCoords, options, `${featureIndex}-${lineIndex}`);
        if (entity) entities.push(entity);
      });
      return;
    }

    if (geometry.type === "Point") {
      const entity = createPointEntity(viewer, feature, geometry.coordinates, options, featureIndex);
      if (entity) entities.push(entity);
      return;
    }

    if (geometry.type === "MultiPoint") {
      geometry.coordinates.forEach((pointCoords, pointIndex) => {
        const entity = createPointEntity(viewer, feature, pointCoords, options, `${featureIndex}-${pointIndex}`);
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
    entity.polyline.width = highlighted ? 4 : 2;
  }

  if (entity.point) {
    entity.point.pixelSize = highlighted ? 12 : 7;
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

  viewer.imageryLayers.addImageryProvider(providers[basemap] || providers.Satellite);
}
