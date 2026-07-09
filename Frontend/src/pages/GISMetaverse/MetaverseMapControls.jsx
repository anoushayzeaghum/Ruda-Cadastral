import { useEffect, useState } from "react";
import MetaverseLegend from "./tools/Layers/MetaverseLegend";
import mapboxgl from "mapbox-gl";
import { Hand, MapPin, Plus, Minus, List } from "lucide-react";

export default function MetaverseMapControls({
  map,
  adminBoundaryVisibility,
  metaverseLegendData,
  layerVisibility,
}) {
  const [coords, setCoords] = useState({ lng: 74.3402, lat: 31.5025 });
  const [zoom, setZoom] = useState(12);
  const [showLegend, setShowLegend] = useState(false);

  // Automatically open the legend when the topography layer is toggled ON
  useEffect(() => {
    if (layerVisibility?.topography) {
      setShowLegend(true);
    }
  }, [layerVisibility?.topography]);

  useEffect(() => {
    if (!map) return;

    const updateMapInfo = () => {
      const center = map.getCenter();

      setCoords({
        lng: center.lng.toFixed(4),
        lat: center.lat.toFixed(4),
      });

      setZoom(Math.round(map.getZoom()));
    };

    updateMapInfo();

    map.on("move", updateMapInfo);
    map.on("zoom", updateMapInfo);

    return () => {
      map.off("move", updateMapInfo);
      map.off("zoom", updateMapInfo);
    };
  }, [map]);

  const handlePan = () => {
    if (!map) return;

    map.dragPan.enable();
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();

    // Do not keep the canvas cursor as grab, otherwise plot hover/click feels stuck in pan mode.
    const canvas = map.getCanvas?.();
    if (canvas?.style) canvas.style.cursor = "";
  };

  const handleLocateMe = () => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        map.flyTo({
          center: [lng, lat],
          zoom: 16,
          essential: true,
        });

        new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="absolute right-2 top-2 z-30 flex items-start gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
      <CoordinateBox coords={coords} zoom={zoom} />

      <div className="flex flex-col items-center gap-1">
        <ControlButton title="Pan" onClick={handlePan}>
          <Hand size={20} />
        </ControlButton>

        <ControlButton title="Locate Me" onClick={handleLocateMe}>
          <MapPin size={20} />
        </ControlButton>

        <div className="overflow-hidden rounded-md border border-[#0c3d2d] bg-[#06291f] shadow-md">
          <button
            type="button"
            title="Zoom In"
            onClick={() => map?.zoomIn()}
            className="flex h-8 w-8 items-center justify-center text-white hover:bg-[#0a3327]"
          >
            <Plus size={20} />
          </button>

          <div className="h-px bg-[#0c3d2d]" />

          <button
            type="button"
            title="Zoom Out"
            onClick={() => map?.zoomOut()}
            className="flex h-8 w-8 items-center justify-center text-white hover:bg-[#0a3327]"
          >
            <Minus size={20} />
          </button>
        </div>

        <div className="relative mt-1">
          <ControlButton
            title="Legend"
            active={showLegend}
            onClick={() => setShowLegend((prev) => !prev)}
          >
            <List size={20} />
          </ControlButton>

          {showLegend && (
            <div className="fixed sm:absolute bottom-14 sm:bottom-auto right-2 sm:right-11 top-auto sm:top-0 w-auto max-w-[calc(100vw-1rem)]">
              <MetaverseLegend
                adminBoundaryVisibility={adminBoundaryVisibility}
                layerVisibility={layerVisibility}
                rudaPhases={metaverseLegendData?.rudaPhases || []}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoordinateBox({ coords, zoom }) {
  return (
    <div className="hidden sm:block mt-0 rounded bg-[#06291f]/90 px-2 py-1 text-[10px] font-semibold text-white shadow-md">
      {coords.lng}, {coords.lat}
      <div className="mt-1 rounded bg-black/60 px-1 py-0.5 text-center text-[9px]">
        Zoom Level: {zoom}
      </div>
    </div>
  );
}

function ControlButton({ title, onClick, children, active = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-white shadow-md transition ${
        active
          ? "border-[#9be37b] bg-[#0a3327]"
          : "border-[#0c3d2d] bg-[#06291f] hover:bg-[#0a3327]"
      }`}
    >
      {children}
    </button>
  );
}
