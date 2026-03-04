import { useState } from "react";

export default function LayerPanel() {
  const [expandedItems, setExpandedItems] = useState({
    layers: true,
    basemap: false,
    legend: false,
  });

  const [layerVisibility, setLayerVisibility] = useState({
    boundaries: true,
    societies: true,
    points: true,
  });

  const toggleSection = (section) => {
    setExpandedItems((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleLayer = (layer) => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="accordion">
      <div className="accordion-item" onClick={() => toggleSection("layers")}>
        <h4>🗺️ Map Layers {expandedItems.layers ? "▼" : "▶"}</h4>
      </div>
      {expandedItems.layers && (
        <div className="accordion-content">
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerVisibility.boundaries}
              onChange={() => toggleLayer("boundaries")}
            />
            Boundaries
          </label>
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerVisibility.societies}
              onChange={() => toggleLayer("societies")}
            />
            Societies
          </label>
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerVisibility.points}
              onChange={() => toggleLayer("points")}
            />
            Points of Interest
          </label>
        </div>
      )}

      <div className="accordion-item" onClick={() => toggleSection("basemap")}>
        <h4>🎨 Basemap {expandedItems.basemap ? "▼" : "▶"}</h4>
      </div>
      {expandedItems.basemap && (
        <div className="accordion-content">
          <label className="basemap-option">
            <input type="radio" name="basemap" defaultChecked />
            Satellite
          </label>
          <label className="basemap-option">
            <input type="radio" name="basemap" />
            Street
          </label>
          <label className="basemap-option">
            <input type="radio" name="basemap" />
            Outdoors
          </label>
        </div>
      )}

      <div className="accordion-item" onClick={() => toggleSection("legend")}>
        <h4>📋 Legend {expandedItems.legend ? "▼" : "▶"}</h4>
      </div>
      {expandedItems.legend && (
        <div className="accordion-content">
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#FF4444" }}
            ></span>
            District Boundary
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#4A90E2" }}
            ></span>
            Society Areas
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#F5A623" }}
            ></span>
            Points of Interest
          </div>
        </div>
      )}
    </div>
  );
}
