import * as Cesium from "cesium";

const numberFromEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function getChaharBaghBimConfig() {
  const assetId = Number(import.meta.env.VITE_CHAHAR_BAGH_BIM_ION_ASSET_ID);

  return {
    assetId: Number.isInteger(assetId) && assetId > 0 ? assetId : null,
    placementMode:
      import.meta.env.VITE_CHAHAR_BAGH_BIM_PLACEMENT_MODE ||
      "translate-to-target",
    longitude: numberFromEnv(import.meta.env.VITE_CHAHAR_BAGH_BIM_LON, 74.4311166314),
    latitude: numberFromEnv(import.meta.env.VITE_CHAHAR_BAGH_BIM_LAT, 31.608370848),
    height: numberFromEnv(import.meta.env.VITE_CHAHAR_BAGH_BIM_HEIGHT, 0),
    heading: numberFromEnv(import.meta.env.VITE_CHAHAR_BAGH_BIM_HEADING, 0),
    pitch: numberFromEnv(import.meta.env.VITE_CHAHAR_BAGH_BIM_PITCH, 0),
    roll: numberFromEnv(import.meta.env.VITE_CHAHAR_BAGH_BIM_ROLL, 0),
    scale: Math.max(numberFromEnv(import.meta.env.VITE_CHAHAR_BAGH_BIM_SCALE, 1), 0.0001),
  };
}

function createLocalRotationScale(config) {
  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(config.heading),
    Cesium.Math.toRadians(config.pitch),
    Cesium.Math.toRadians(config.roll),
  );

  const rotation = Cesium.Matrix3.fromHeadingPitchRoll(hpr);
  const matrix = Cesium.Matrix4.fromRotationTranslation(
    rotation,
    Cesium.Cartesian3.ZERO,
    new Cesium.Matrix4(),
  );

  return Cesium.Matrix4.multiplyByUniformScale(
    matrix,
    config.scale,
    matrix,
  );
}

/**
 * Places a 3D Tiles tileset by moving its actual bounding-sphere center to the
 * requested WGS84 target. This avoids the common BIM shift caused by placing
 * the Revit/internal origin at the target instead of the visible model.
 */
export function buildTilesetPlacementMatrix(tileset, config) {
  if (!tileset?.boundingSphere?.center) {
    return Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);
  }

  const mode = String(config.placementMode || "").toLowerCase();
  if (["ion", "ion-georeferenced", "keep-ion-position", "none"].includes(mode)) {
    return Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);
  }

  const sourceCenter = Cesium.Cartesian3.clone(tileset.boundingSphere.center);
  const targetCenter = Cesium.Cartesian3.fromDegrees(
    config.longitude,
    config.latitude,
    config.height,
  );

  const targetFrame = Cesium.Transforms.eastNorthUpToFixedFrame(targetCenter);
  const localRotationScale = createLocalRotationScale(config);

  // A georeferenced source center is already in ECEF. Preserve its local ENU
  // orientation while moving it to the new target. A local/unreferenced source
  // is handled as model coordinates centered around its bounding sphere.
  const sourceMagnitude = Cesium.Cartesian3.magnitude(sourceCenter);
  let sourceToLocal;

  if (sourceMagnitude > 1_000_000) {
    const sourceFrame = Cesium.Transforms.eastNorthUpToFixedFrame(sourceCenter);
    sourceToLocal = Cesium.Matrix4.inverseTransformation(
      sourceFrame,
      new Cesium.Matrix4(),
    );
  } else {
    sourceToLocal = Cesium.Matrix4.fromTranslation(
      Cesium.Cartesian3.negate(sourceCenter, new Cesium.Cartesian3()),
    );
  }

  const targetWithAdjustment = Cesium.Matrix4.multiply(
    targetFrame,
    localRotationScale,
    new Cesium.Matrix4(),
  );

  return Cesium.Matrix4.multiply(
    targetWithAdjustment,
    sourceToLocal,
    new Cesium.Matrix4(),
  );
}

export async function loadIonBimTileset(viewer, config) {
  if (!viewer) throw new Error("Cesium viewer is not ready.");
  if (!config.assetId) {
    throw new Error("VITE_CHAHAR_BAGH_BIM_ION_ASSET_ID is missing or invalid.");
  }

  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(config.assetId, {
    maximumScreenSpaceError: 8,
    dynamicScreenSpaceError: true,
  });

  viewer.scene.primitives.add(tileset);

  // Wait until the root content and bounding volume are available before
  // calculating the center-based placement transform.
  tileset.modelMatrix = buildTilesetPlacementMatrix(tileset, config);
  tileset.show = true;

  return tileset;
}
