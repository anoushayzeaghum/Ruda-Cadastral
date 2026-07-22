import { useEffect, useMemo, useRef } from "react";
import * as Cesium from "cesium";
import { getBoundsFromGeoJSON } from "./cesiumHelpers";

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasLonLat(model = {}) {
  return (
    Number.isFinite(toNumber(model.longitude)) &&
    Number.isFinite(toNumber(model.latitude))
  );
}

function getTargetFromGeoJSON(targetGeoJSON) {
  const bounds = getBoundsFromGeoJSON(targetGeoJSON);
  if (!bounds) return null;

  return {
    longitude: (bounds.west + bounds.east) / 2,
    latitude: (bounds.south + bounds.north) / 2,
  };
}

function getPlacementTarget(model = {}, targetGeoJSON) {
  if (hasLonLat(model)) {
    return {
      longitude: toNumber(model.longitude),
      latitude: toNumber(model.latitude),
    };
  }

  return getTargetFromGeoJSON(targetGeoJSON);
}

function getHpr(model = {}) {
  return new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(toNumber(model.heading, 0)),
    Cesium.Math.toRadians(toNumber(model.pitch, 0)),
    Cesium.Math.toRadians(toNumber(model.roll, 0)),
  );
}

function applyOriginAtTargetPlacement(tileset, targetPosition, model = {}) {
  const hpr = getHpr(model);
  const matrix = Cesium.Transforms.headingPitchRollToFixedFrame(
    targetPosition,
    hpr,
  );

  const scale = toNumber(model.scale, 1);
  if (Number.isFinite(scale) && scale > 0 && scale !== 1) {
    Cesium.Matrix4.multiplyByUniformScale(matrix, scale, matrix);
  }

  tileset.modelMatrix = matrix;
}

function applyTranslateToTargetPlacement(tileset, targetPosition, model = {}) {
  const sourceCenter = tileset.boundingSphere?.center;

  if (!sourceCenter) {
    applyOriginAtTargetPlacement(tileset, targetPosition, model);
    return;
  }

  const heading = toNumber(model.heading, 0);
  const pitch = toNumber(model.pitch, 0);
  const roll = toNumber(model.roll, 0);
  const scale = toNumber(model.scale, 1);

  const targetFrame = Cesium.Transforms.eastNorthUpToFixedFrame(targetPosition);

  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(heading),
    Cesium.Math.toRadians(pitch),
    Cesium.Math.toRadians(roll),
  );

  const rotatedTargetFrame = Cesium.Transforms.headingPitchRollToFixedFrame(
    targetPosition,
    hpr,
  );

  const sourceFrame = Cesium.Transforms.eastNorthUpToFixedFrame(sourceCenter);

  const inverseSourceFrame = Cesium.Matrix4.inverse(
    sourceFrame,
    new Cesium.Matrix4(),
  );

  let finalMatrix = Cesium.Matrix4.multiply(
    rotatedTargetFrame,
    inverseSourceFrame,
    new Cesium.Matrix4(),
  );

  if (Number.isFinite(scale) && scale > 0 && scale !== 1) {
    Cesium.Matrix4.multiplyByUniformScale(finalMatrix, scale, finalMatrix);
  }

  tileset.modelMatrix = finalMatrix;
}

function applyManualPlacement(tileset, model = {}, targetGeoJSON) {
  const target = getPlacementTarget(model, targetGeoJSON);
  if (!target) {
    return {
      ok: false,
      message:
        "BIM loaded, but no placement target was found. Select a project or set VITE_CHAHAR_BAGH_BIM_LON/LAT.",
    };
  }

  const targetPosition = Cesium.Cartesian3.fromDegrees(
    target.longitude,
    target.latitude,
    toNumber(model.height, 0),
  );

  const placementMode = String(
    model.placementMode || "translate-to-target",
  ).toLowerCase();

  if (placementMode === "origin-at-target") {
    applyOriginAtTargetPlacement(tileset, targetPosition, model);
  } else {
    applyTranslateToTargetPlacement(tileset, targetPosition, model);
  }

  return {
    ok: true,
    message: `BIM placed at ${target.longitude.toFixed(6)}, ${target.latitude.toFixed(6)}.`,
  };
}

async function loadTileset(model = {}) {
  if (model.ionAssetId) {
    return Cesium.Cesium3DTileset.fromIonAssetId(Number(model.ionAssetId));
  }

  if (model.tilesetUrl) {
    return Cesium.Cesium3DTileset.fromUrl(model.tilesetUrl);
  }

  throw new Error(
    "Missing BIM source. Add VITE_CHAHAR_BAGH_BIM_ION_ASSET_ID or VITE_CHAHAR_BAGH_BIM_TILESET_URL.",
  );
}

export default function CesiumBIMModel({
  viewer,
  isReady = false,
  visible = false,
  model = {},
  targetGeoJSON,
  onStatusChange,
}) {
  const tilesetRef = useRef(null);

  const sourceKey = useMemo(
    () =>
      [
        model?.ionAssetId || "",
        model?.tilesetUrl || "",
        model?.longitude || "",
        model?.latitude || "",
        model?.height || "",
        model?.heading || "",
        model?.pitch || "",
        model?.roll || "",
        model?.scale || "",
        model?.placementMode || "",
      ].join("|"),
    [model],
  );

  useEffect(() => {
    if (!viewer || !isReady) return undefined;

    let cancelled = false;

    const removeTileset = () => {
      const tileset = tilesetRef.current;
      if (!tileset || !viewer || viewer.isDestroyed?.()) return;

      try {
        if (viewer.scene?.primitives?.contains?.(tileset)) {
          viewer.scene.primitives.remove(tileset);
        } else {
          viewer.scene.primitives.remove(tileset);
        }
      } catch (error) {
        console.warn("Could not remove BIM tileset", error);
      } finally {
        tilesetRef.current = null;
      }
    };

    const run = async () => {
      removeTileset();

      if (!visible) {
        onStatusChange?.({ status: "idle", message: "" });
        return;
      }

      try {
        onStatusChange?.({
          status: "loading",
          message: `Loading ${model.name || "BIM model"}...`,
        });

        const tileset = await loadTileset(model);
        if (cancelled) return;

        viewer.scene.primitives.add(tileset);
        tilesetRef.current = tileset;

        if (tileset.readyPromise) {
          await tileset.readyPromise.catch(() => undefined);
          if (cancelled) return;
        }

        const placement = applyManualPlacement(tileset, model, targetGeoJSON);

        if (model.flyTo !== false) {
          await viewer
            .flyTo(tileset, {
              duration: 1.4,
              offset: new Cesium.HeadingPitchRange(
                Cesium.Math.toRadians(toNumber(model.cameraHeading, 0)),
                Cesium.Math.toRadians(toNumber(model.cameraPitch, -35)),
                toNumber(model.cameraRange, 900),
              ),
            })
            .catch(() => undefined);
        }

        onStatusChange?.({
          status: placement.ok ? "loaded" : "warning",
          message: placement.ok
            ? `${model.name || "BIM model"} loaded. ${placement.message}`
            : placement.message,
        });
      } catch (error) {
        console.error("BIM model load error", error);
        removeTileset();

        if (!cancelled) {
          onStatusChange?.({
            status: "error",
            message:
              error?.message ||
              "Failed to load BIM model. Check Cesium token, asset id, access permission, and placement values.",
          });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      removeTileset();
    };
  }, [viewer, isReady, visible, sourceKey, targetGeoJSON, onStatusChange]);

  return null;
}
