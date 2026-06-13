import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  Hand,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react";

const formatCoordinate = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toFixed(4);
};

const formatLngLat = (lng, lat) => {
  return `${formatCoordinate(lng)}, ${formatCoordinate(lat)}`;
};

export default function MapControls({
  map,
  fullscreenTargetRef,
  onLocationClick,
}) {
  const markerRef = useRef(null);
  const [coords, setCoords] = useState("");
  const [zoom, setZoom] = useState("");
  const [activeTool, setActiveTool] = useState("pan");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!map) return undefined;

    const updateZoom = () => {
      const currentZoom = map.getZoom?.();
      setZoom(Number.isFinite(currentZoom) ? String(Math.round(currentZoom)) : "--");
    };

    const updateCoordsFromCenter = () => {
      const center = map.getCenter?.();
      if (center) setCoords(formatLngLat(center.lng, center.lat));
      updateZoom();
    };

    const updateCoordsFromMouse = (event) => {
      if (!event?.lngLat) return;
      setCoords(formatLngLat(event.lngLat.lng, event.lngLat.lat));
    };

    updateCoordsFromCenter();

    map.on("mousemove", updateCoordsFromMouse);
    map.on("move", updateZoom);
    map.on("zoom", updateZoom);

    return () => {
      map.off("mousemove", updateCoordsFromMouse);
      map.off("move", updateZoom);
      map.off("zoom", updateZoom);
    };
  }, [map]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const target = fullscreenTargetRef?.current;
      setIsFullscreen(!!target && document.fullscreenElement === target);

      window.setTimeout(() => {
        try {
          map?.resize?.();
        } catch (error) {
          console.warn("Map resize after fullscreen failed", error);
        }
      }, 150);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [fullscreenTargetRef, map]);

  const resizeMapSoon = useCallback(() => {
    window.setTimeout(() => {
      try {
        map?.resize?.();
      } catch (error) {
        console.warn("Map resize failed", error);
      }
    }, 150);
  }, [map]);

  const toggleFullscreen = useCallback(async () => {
    if (!map) return;

    const target =
      fullscreenTargetRef?.current ||
      map.getContainer?.()?.parentElement ||
      map.getContainer?.();

    if (!target) return;

    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      console.warn("Fullscreen toggle failed", error);
    } finally {
      resizeMapSoon();
    }
  }, [fullscreenTargetRef, map, resizeMapSoon]);

  const activatePan = useCallback(() => {
    if (!map) return;

    try {
      map.dragPan?.enable?.();
      map.scrollZoom?.enable?.();
      map.doubleClickZoom?.enable?.();
      map.touchZoomRotate?.enable?.();
      map.keyboard?.enable?.();
      map.getCanvas().style.cursor = "grab";
      window.setTimeout(() => {
        if (map?.getCanvas?.()) map.getCanvas().style.cursor = "";
      }, 700);
    } catch (error) {
      console.warn("Could not activate pan tool", error);
    }

    setActiveTool("pan");
  }, [map]);

  const addOrMoveMarker = useCallback(
    ({ lng, lat, label = "Map marker" }) => {
      if (!map || !Number.isFinite(lng) || !Number.isFinite(lat)) return;

      const lngLat = [lng, lat];
      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
        `<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.45; color: #1f2937; min-width: 150px;">
          <div style="font-weight: 700; color: #0f3d2e; margin-bottom: 4px;">${label}</div>
          <div><b>Lng:</b> ${formatCoordinate(lng)}</div>
          <div><b>Lat:</b> ${formatCoordinate(lat)}</div>
        </div>`,
      );

      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({
          color: "#0f3d2e",
          draggable: true,
        })
          .setLngLat(lngLat)
          .setPopup(popup)
          .addTo(map);
      } else {
        markerRef.current.setLngLat(lngLat);
        markerRef.current.setPopup(popup);
      }

      setCoords(formatLngLat(lng, lat));
      setActiveTool("marker");

      map.flyTo({
        center: lngLat,
        zoom: Math.max(map.getZoom?.() || 14, 16),
        duration: 700,
        essential: true,
      });
    },
    [map],
  );

  const fallbackMarkerAtCenter = useCallback(
    (label = "Map marker") => {
      const center = map?.getCenter?.();
      if (!center) return;
      addOrMoveMarker({ lng: center.lng, lat: center.lat, label });
    },
    [addOrMoveMarker, map],
  );

  const handleLocation = useCallback(() => {
    if (!map || isLocating) return;

    if (typeof onLocationClick === "function") {
      const handled = onLocationClick({
        map,
        addOrMoveMarker,
        fallbackMarkerAtCenter,
      });
      if (handled) return;
    }

    setIsLocating(true);
    setActiveTool("marker");

    if (!navigator.geolocation) {
      fallbackMarkerAtCenter("Map marker");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        addOrMoveMarker({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          label: "Current location",
        });
        setIsLocating(false);
      },
      () => {
        fallbackMarkerAtCenter("Map marker");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 8000,
      },
    );
  }, [
    addOrMoveMarker,
    fallbackMarkerAtCenter,
    isLocating,
    map,
    onLocationClick,
  ]);

  const zoomIn = useCallback(() => {
    if (!map) return;
    map.zoomIn({ duration: 250 });
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;
    map.zoomOut({ duration: 250 });
  }, [map]);

  const buttonBase =
    "flex h-10 w-10 items-center justify-center text-white transition focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-1 focus:ring-offset-slate-900";

  const singleButtonClass = (active = false) =>
    `${buttonBase} rounded-lg border shadow-lg ${
      active
        ? "border-green-300 bg-[#0f3d2e]"
        : "border-slate-600/80 bg-[#1f2937] hover:bg-[#0f3d2e]"
    }`;

  const groupedButtonClass = `${buttonBase} bg-[#1f2937] hover:bg-[#0f3d2e]`;

  return (
    <div className="pointer-events-none absolute right-3 top-5 z-40 flex items-start gap-2">
      <div className="flex flex-col items-end gap-1">
        <div className="rounded bg-slate-900/90 px-2 py-1 text-[10px] font-semibold leading-none text-white shadow-lg backdrop-blur-sm">
          {coords}
        </div>
        <div className="rounded bg-slate-900/90 px-2 py-1 text-[10px] font-semibold leading-none text-white shadow-lg backdrop-blur-sm">
          Zoom Level: {zoom}
        </div>
      </div>

      <div className="pointer-events-auto flex flex-col gap-2">
        <button
          type="button"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={toggleFullscreen}
          className={singleButtonClass(isFullscreen)}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <button
          type="button"
          title="Pan tool"
          aria-label="Pan tool"
          onClick={activatePan}
          className={singleButtonClass(activeTool === "pan")}
        >
          <Hand size={18} />
        </button>

        <button
          type="button"
          title="Location / marker"
          aria-label="Location / marker"
          onClick={handleLocation}
          disabled={isLocating}
          className={`${singleButtonClass(activeTool === "marker")} ${
            isLocating ? "cursor-wait opacity-80" : ""
          }`}
        >
          <MapPin size={19} />
        </button>

        <div className="overflow-hidden rounded-lg border border-slate-600/80 bg-[#1f2937] shadow-lg">
          <button
            type="button"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={zoomIn}
            className={`${groupedButtonClass} border-b border-slate-600/80`}
          >
            <Plus size={18} strokeWidth={2.8} />
          </button>
          <button
            type="button"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={zoomOut}
            className={groupedButtonClass}
          >
            <Minus size={18} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
