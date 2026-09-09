/**
 * MiniMap
 * Lightweight schematic mini-map.
 * Renders scene nodes from mapPosition {x, y} coordinates (0–100 %).
 * The active node is highlighted; clicking any node switches to that scene.
 * Collapsible via its header.
 */
import React, { useState } from 'react';
import { TOUR_DATA } from '../data/tourData';

export default function MiniMap({ currentSceneId, onSceneSelect, hidden }) {
  const [collapsed, setCollapsed] = useState(false);

  const scenes = TOUR_DATA.scenes.filter((s) => s.mapPosition);

  // Build SVG connector lines between consecutive scenes (simple polyline)
  const linePoints = scenes
    .map((s) => `${s.mapPosition.x},${s.mapPosition.y}`)
    .join(' ');

  return (
    <div
      className={`vt-minimap glass${hidden ? ' vt-minimap--hidden' : ''}${collapsed ? ' collapsed' : ''}`}
      role="navigation"
      aria-label="Location mini-map"
    >
      {/* Header / toggle */}
      <div
        className="vt-minimap__header"
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-controls="vt-minimap-body"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
      >
        <span>Map</span>
        <span className="vt-minimap__toggle-icon" aria-hidden="true">▲</span>
      </div>

      {/* Body */}
      <div id="vt-minimap-body" className="vt-minimap__body" aria-hidden={collapsed}>
        {/* SVG connector lines */}
        <svg
          className="vt-minimap__svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {scenes.length > 1 && (
            <polyline
              points={linePoints}
              stroke="rgba(22,132,91,0.3)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* Scene nodes */}
        {scenes.map((scene) => {
          const active = scene.id === currentSceneId;
          return (
            <div
              key={scene.id}
              className={`vt-minimap__node${active ? ' active' : ''}`}
              style={{
                left: `${scene.mapPosition.x}%`,
                top:  `${scene.mapPosition.y}%`,
              }}
              role="button"
              tabIndex={0}
              aria-label={`Go to ${scene.name}${active ? ' (current)' : ''}`}
              aria-pressed={active}
              onClick={() => onSceneSelect?.(scene.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSceneSelect?.(scene.id);
                }
              }}
            >
              <span className="vt-minimap__node-label">
                {scene.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
