import React, { useEffect, useRef } from 'react';
import { TOUR_DATA } from '../data/tourData';
import { getTourThumbnailUrl, getTourPreviewUrl } from '../utils/virtualTourAssets';

function SceneThumb({ scene, active, onSelect }) {
  return (
    <button
      type="button"
      className={`vt-gallery-card${active ? ' active' : ''}`}
      onClick={() => onSelect(scene.id)}
      aria-label={`Open ${scene.name}`}
    >
      <div className="vt-gallery-card__image-wrap">
        <img
          src={getTourThumbnailUrl(scene.id)}
          alt=""
          className="vt-gallery-card__image"
          onError={(e) => {
            if (e.currentTarget.dataset.fallback) return;
            e.currentTarget.dataset.fallback = '1';
            e.currentTarget.src = getTourPreviewUrl(scene.id);
          }}
        />
        <span className="vt-gallery-card__number">
          {String(TOUR_DATA.scenes.indexOf(scene) + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="vt-gallery-card__meta">
        <strong>{scene.name}</strong>
        <span>{scene.zone || 'Tour location'}</span>
      </div>
    </button>
  );
}

export default function SceneGallery({ isOpen, currentSceneId, onClose, onSceneSelect }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="vt-gallery-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose?.();
    }}>
      <section ref={panelRef} className="vt-gallery glass--heavy" aria-label="Tour locations">
        <div className="vt-gallery__header">
          <div>
            <div className="vt-gallery__eyebrow">RUDA VIRTUAL TOUR</div>
            <h2>Explore Locations</h2>
          </div>
          <button type="button" className="vt-gallery__close" onClick={onClose} aria-label="Close gallery">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="vt-gallery__grid">
          {TOUR_DATA.scenes.map((scene) => (
            <SceneThumb
              key={scene.id}
              scene={scene}
              active={scene.id === currentSceneId}
              onSelect={(id) => { onSceneSelect?.(id); onClose?.(); }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
