import * as Cesium from "cesium";

export const DEFAULT_VIEW = {
  lon: 74.2484,
  lat: 31.5204,
  height: 45000,
  bounds: {
    west: 60.8729,
    south: 23.6345,
    east: 77.8375,
    north: 37.0841,
  },
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
      fallback,
  );
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

function expandBounds(bounds, paddingRatio = 0.18) {
  if (!bounds) return null;
  const minSpan = 0.002;
  const lonSpan = Math.max(bounds.east - bounds.west, minSpan);
  const latSpan = Math.max(bounds.north - bounds.south, minSpan);
  return {
    west: Math.max(bounds.west - lonSpan * paddingRatio, -180),
    south: Math.max(bounds.south - latSpan * paddingRatio, -90),
    east: Math.min(bounds.east + lonSpan * paddingRatio, 180),
    north: Math.min(bounds.north + latSpan * paddingRatio, 90),
  };
}

export function flyToBounds(viewer, bounds, options = {}) {
  if (!viewer || !bounds) return;
  const padded = expandBounds(bounds, options.padding ?? 0.18);
  if (!padded) return;

  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(
      padded.west,
      padded.south,
      padded.east,
      padded.north,
    ),
    duration: options.duration ?? 1.2,
    orientation: {
      heading: Cesium.Math.toRadians(options.heading ?? 0),
      pitch: Cesium.Math.toRadians(options.pitch ?? -45),
      roll: 0,
    },
  });
}

export function flyToGeoJSON(viewer, geojson, options = {}) {
  flyToBounds(viewer, getBoundsFromGeoJSON(geojson), options);
}

function color(cssColor, alpha = 1) {
  return Cesium.Color.fromCssColorString(cssColor || "#ffffff").withAlpha(alpha);
}

function ringToCartesian(ring = []) {
  const values = [];
  ring.forEach((coord) => {
    const lon = Number(coord?.[0]);
    const lat = Number(coord?.[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) values.push(lon, lat);
  });
  return Cesium.Cartesian3.fromDegreesArray(values);
}

function polygonHierarchy(coordinates = []) {
  const outer = ringToCartesian(coordinates[0] || []);
  const holes = coordinates
    .slice(1)
    .map((ring) => new Cesium.PolygonHierarchy(ringToCartesian(ring)))
    .filter((item) => item.positions?.length);
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

function addPolygon(viewer, feature, coordinates, options, index) {
  const material = color(options.fillColor || "#38bdf8", options.opacity ?? 0.4);
  const outlineColor = color(options.outlineColor || "#0f172a", 1);
  const entity = viewer.entities.add({
    name: options.name,
    polygon: {
      hierarchy: polygonHierarchy(coordinates),
      material,
      outline: true,
      outlineColor,
      height: 0,
      clampToGround: options.clampToGround ?? true,
    },
  });
  entity.featureData = feature;
  entity.featureId = getFeatureId(feature, `${options.key}-${index}`);
  entity.layerKey = options.key;
  entity.originalMaterial = material;
  entity.originalOutlineColor = outlineColor;
  return entity;
}

function addLine(viewer, feature, coordinates, options, index) {
  const entity = viewer.entities.add({
    name: options.name,
    polyline: {
      positions: linePositions(coordinates),
      width: options.width || 2,
      material: color(options.lineColor || options.outlineColor || "#0f172a", options.opacity ?? 1),
      clampToGround: options.clampToGround ?? true,
    },
  });
  entity.featureData = feature;
  entity.featureId = getFeatureId(feature, `${options.key}-${index}`);
  entity.layerKey = options.key;
  entity.originalWidth = options.width || 2;
  return entity;
}

function addPoint(viewer, feature, coordinates, options, index) {
  const lon = Number(coordinates?.[0]);
  const lat = Number(coordinates?.[1]);
  const height = Number(coordinates?.[2] || 0);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

  const entity = viewer.entities.add({
    name: options.name,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
    point: {
      pixelSize: options.pixelSize || 7,
      color: color(options.pointColor || options.fillColor || "#ef4444", options.opacity ?? 1),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
  entity.featureData = feature;
  entity.featureId = getFeatureId(feature, `${options.key}-${index}`);
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
      entities.push(addPolygon(viewer, feature, geometry.coordinates, options, featureIndex));
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((coords, polygonIndex) =>
        entities.push(addPolygon(viewer, feature, coords, options, `${featureIndex}-${polygonIndex}`)),
      );
    } else if (geometry.type === "LineString") {
      entities.push(addLine(viewer, feature, geometry.coordinates, options, featureIndex));
    } else if (geometry.type === "MultiLineString") {
      geometry.coordinates.forEach((coords, lineIndex) =>
        entities.push(addLine(viewer, feature, coords, options, `${featureIndex}-${lineIndex}`)),
      );
    } else if (geometry.type === "Point") {
      const entity = addPoint(viewer, feature, geometry.coordinates, options, featureIndex);
      if (entity) entities.push(entity);
    } else if (geometry.type === "MultiPoint") {
      geometry.coordinates.forEach((coords, pointIndex) => {
        const entity = addPoint(viewer, feature, coords, options, `${featureIndex}-${pointIndex}`);
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
      ? Cesium.Color.YELLOW.withAlpha(0.75)
      : entity.originalMaterial;
    entity.polygon.outlineColor = highlighted
      ? Cesium.Color.BLACK
      : entity.originalOutlineColor;
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

  viewer.imageryLayers.addImageryProvider(providers[basemap] || providers.Streets);
}
