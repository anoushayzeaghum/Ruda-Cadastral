import React, { useState, useEffect } from "react";
import { ChevronRight, Grid3X3, Clock } from "lucide-react";

export default function DroneImagery({ map }) {
  const [jan2023Visible, setJan2023Visible] = useState(false);
  const [jan2023Opacity, setJan2023Opacity] = useState(100);

  const [june2023Visible, setJune2023Visible] = useState(false);
  const [june2023Opacity, setJune2023Opacity] = useState(100);

  const [nov2024Visible, setNov2024Visible] = useState(false);
  const [nov2024Opacity, setNov2024Opacity] = useState(100);

  const JAN2023_SOURCE = "gis-jan2023-source";
  const JAN2023_LAYER = "gis-jan2023-layer";
  const JUNE2023_SOURCE = "gis-june2023-source";
  const JUNE2023_LAYER = "gis-june2023-layer";
  const NOV2024_SOURCE = "gis-nov2024-source";
  const NOV2024_LAYER = "gis-nov2024-layer";

  const flyToChaharbagh = () => {
    if (!map) return;
    const bounds = [
      [74.42562653088396, 31.60509230706726],
      [74.43545280361002, 31.6112165411359],
    ];
    map.fitBounds(bounds, { padding: 50, duration: 1500 });
  };

  // AsBuilt Jan 2023
  useEffect(() => {
    if (!map) return;

    if (jan2023Visible) {
      if (!map.getSource(JAN2023_SOURCE)) {
        map.addSource(JAN2023_SOURCE, {
          type: "raster",
          tiles: [
            "http://localhost:8081/data/Chahar_Bagh_Jan2023/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
        });
      }
      if (!map.getLayer(JAN2023_LAYER)) {
        map.addLayer({
          id: JAN2023_LAYER,
          type: "raster",
          source: JAN2023_SOURCE,
          paint: { "raster-opacity": jan2023Opacity / 100 },
          layout: { visibility: "visible" },
        });
        flyToChaharbagh();
      } else {
        map.setLayoutProperty(JAN2023_LAYER, "visibility", "visible");
        map.setPaintProperty(
          JAN2023_LAYER,
          "raster-opacity",
          jan2023Opacity / 100,
        );
      }
    } else {
      if (map.getLayer(JAN2023_LAYER)) {
        map.setLayoutProperty(JAN2023_LAYER, "visibility", "none");
      }
    }
  }, [map, jan2023Visible, jan2023Opacity]);

  // Ortho June 2023
  useEffect(() => {
    if (!map) return;

    if (june2023Visible) {
      if (!map.getSource(JUNE2023_SOURCE)) {
        map.addSource(JUNE2023_SOURCE, {
          type: "raster",
          tiles: [
            "http://localhost:8081/data/Chahar_Bagh_June2023/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
        });
      }
      if (!map.getLayer(JUNE2023_LAYER)) {
        map.addLayer({
          id: JUNE2023_LAYER,
          type: "raster",
          source: JUNE2023_SOURCE,
          paint: { "raster-opacity": june2023Opacity / 100 },
          layout: { visibility: "visible" },
        });
        flyToChaharbagh();
      } else {
        map.setLayoutProperty(JUNE2023_LAYER, "visibility", "visible");
        map.setPaintProperty(
          JUNE2023_LAYER,
          "raster-opacity",
          june2023Opacity / 100,
        );
      }
    } else {
      if (map.getLayer(JUNE2023_LAYER)) {
        map.setLayoutProperty(JUNE2023_LAYER, "visibility", "none");
      }
    }
  }, [map, june2023Visible, june2023Opacity]);

  // Ortho Nov 2024
  useEffect(() => {
    if (!map) return;

    if (nov2024Visible) {
      if (!map.getSource(NOV2024_SOURCE)) {
        map.addSource(NOV2024_SOURCE, {
          type: "raster",
          tiles: [
            "http://localhost:8081/data/Chahar_Bagh_Nov2024/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
        });
      }
      if (!map.getLayer(NOV2024_LAYER)) {
        map.addLayer({
          id: NOV2024_LAYER,
          type: "raster",
          source: NOV2024_SOURCE,
          paint: { "raster-opacity": nov2024Opacity / 100 },
          layout: { visibility: "visible" },
        });
        flyToChaharbagh();
      } else {
        map.setLayoutProperty(NOV2024_LAYER, "visibility", "visible");
        map.setPaintProperty(
          NOV2024_LAYER,
          "raster-opacity",
          nov2024Opacity / 100,
        );
      }
    } else {
      if (map.getLayer(NOV2024_LAYER)) {
        map.setLayoutProperty(NOV2024_LAYER, "visibility", "none");
      }
    }
  }, [map, nov2024Visible, nov2024Opacity]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 text-[12px] font-bold">
        <span>Drone Imagery</span>
        <ChevronRight size={15} />
      </div>

      <div className="p-3 text-[12px]">
        <div className="mb-3 text-white/70">
          Toggle historical drone imagery of Chaharbagh Phase 1 to monitor
          construction progress over time.
        </div>

        <div className="rounded-sm border border-[#3b4558] bg-[#232b3a] p-2 space-y-4">
          {/* Jan 2023 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={jan2023Visible}
                  onChange={(e) => setJan2023Visible(e.target.checked)}
                  className="accent-[#65c96b]"
                />
                <Clock size={14} className="text-[#a855f7]" />
                <span className="font-semibold text-white/90">Jan 2023</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>
            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={jan2023Opacity}
                onChange={(e) => setJan2023Opacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]"
              />
              <span className="text-[11px] text-white/90 w-8 text-right">
                {jan2023Opacity}%
              </span>
            </div>
          </div>

          <div className="border-t border-[#394354]" />

          {/* June 2023 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={june2023Visible}
                  onChange={(e) => setJune2023Visible(e.target.checked)}
                  className="accent-[#65c96b]"
                />
                <Clock size={14} className="text-[#3b82f6]" />
                <span className="font-semibold text-white/90"> June 2023</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>
            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={june2023Opacity}
                onChange={(e) => setJune2023Opacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]"
              />
              <span className="text-[11px] text-white/90 w-8 text-right">
                {june2023Opacity}%
              </span>
            </div>
          </div>

          <div className="border-t border-[#394354]" />

          {/* Nov 2024 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nov2024Visible}
                  onChange={(e) => setNov2024Visible(e.target.checked)}
                  className="accent-[#65c96b]"
                />
                <Clock size={14} className="text-[#ef4444]" />
                <span className="font-semibold text-white/90"> Nov 2024</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>
            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={nov2024Opacity}
                onChange={(e) => setNov2024Opacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]"
              />
              <span className="text-[11px] text-white/90 w-8 text-right">
                {nov2024Opacity}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
