import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  Maximize2,
  Hand,
  MapPin,
  Plus,
  Minus,
  List,
} from "lucide-react";

// import Legend from "./Legend";

export default function MetaverseMapControls({ map }) {
  const [coords, setCoords] = useState({ lng: 74.3402, lat: 31.5025 });
  const [zoom, setZoom] = useState(12);

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

  const handleFullscreen = () => {
    const mapElement = map?.getContainer?.();
    if (!mapElement) return;

    if (!document.fullscreenElement) {
      mapElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handlePan = () => {
    if (!map) return;

    map.dragPan.enable();
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();
    map.getCanvas().style.cursor = "grab";
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
      { enableHighAccuracy: true }
    );
  };

  return (
    <>
      <div className="absolute right-3 top-3 z-30 flex items-start gap-2">
        <CoordinateBox coords={coords} zoom={zoom} />

        <div className="flex flex-col items-center gap-1">
          <ControlButton title="Fullscreen" onClick={handleFullscreen}>
            <Maximize2 size={20} />
          </ControlButton>

          <ControlButton title="Pan" onClick={handlePan}>
            <Hand size={20} />
          </ControlButton>

          <ControlButton title="Locate Me" onClick={handleLocateMe}>
            <MapPin size={20} />
          </ControlButton>

          <div className="overflow-hidden rounded-md border border-[#344055] bg-[#1d2533] shadow-md">
            <button
              type="button"
              title="Zoom In"
              onClick={() => map?.zoomIn()}
              className="flex h-8 w-8 items-center justify-center text-white hover:bg-[#293445]"
            >
              <Plus size={20} />
            </button>

            <div className="h-px bg-[#344055]" />

            <button
              type="button"
              title="Zoom Out"
              onClick={() => map?.zoomOut()}
              className="flex h-8 w-8 items-center justify-center text-white hover:bg-[#293445]"
            >
              <Minus size={20} />
            </button>
          </div>

          <div className="mt-10">
            <ControlButton
              title="Legend"
              onClick={() => console.log("Legend clicked")}
            >
              <List size={20} />
            </ControlButton>
          </div>
        </div>
      </div>

      {/* Later when Legend.jsx is ready */}
      {/* <Legend map={map} /> */}
    </>
  );
}

function CoordinateBox({ coords, zoom }) {
  return (
    <div className="mt-0 rounded bg-[#111827] px-2 py-1 text-[10px] font-semibold text-white shadow-md">
      {coords.lng}, {coords.lat}
      <div className="mt-1 rounded bg-black/60 px-1 py-0.5 text-center text-[9px]">
        Zoom Level: {zoom}
      </div>
    </div>
  );
}

function ControlButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#344055] bg-[#1d2533] text-white shadow-md transition hover:bg-[#293445]"
    >
      {children}
    </button>
  );
}