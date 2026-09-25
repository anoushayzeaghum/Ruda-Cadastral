/**
 * SceneGallery
 *
 * Premium bottom-sheet gallery with 3-column grid.
 * Active scene gets a green border + "Current" badge.
 * Closes on Escape, backdrop click, or selecting a scene.
 */
import React, { useEffect, useRef } from 'react';
import { TOUR_DATA } from '../data/tourData';
import { getTourThumbnailUrl, getTourPreviewUrl } from '../utils/virtualTourAssets';

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function GalleryCard({ scene, isActive, onSelect, index }) {
  return (
    <button
      type="button"
      className={`vt-gcard${isActive ? ' vt-gcard--active' : ''}`}
      onClick={() => onSelect(scene.id)}
      aria-label={`${isActive ? 'Current location: ' : 'Go to '}${scene.name}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className="vt-gcard__img-wrap">
        <img
          src={getTourThumbnailUrl(scene.id)}
          alt=""
          className="vt-gcard__img"
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.dataset.fb) return;
            e.currentTarget.dataset.fb = '1';
            e.currentTarget.src = getTourPreviewUrl(scene.id);
          }}
        />
        <span className="vt-gcard__num">{String(index + 1).padStart(2, '0')}</span>
        {isActive && <span className="vt-gcard__badge">Current</span>}
      </div>
      <div className="vt-gcard__meta">
        <strong className="vt-gcard__title">{scene.name}</strong>
        <span className="vt-gcard__zone">{scene.zone ?? 'Tour Location'}</span>
        {scene.captureDate && (
          <span className="vt-gcard__date">
            {new Date(scene.captureDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        )}
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
    // focus-trap: move focus into panel
    panelRef.current?.focus?.();
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (id) => {
    onSceneSelect?.(id);
    onClose?.();
  };

  return (
    <div
      className="vt-gallery-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      role="presentation"
    >
      <section
        ref={panelRef}
        className="vt-gallery-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Tour locations gallery"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="vt-gallery-sheet__header">
          <div className="vt-gallery-sheet__heading">
            <span className="vt-gallery-sheet__eyebrow">RUDA Virtual Tour</span>
            <h2 className="vt-gallery-sheet__title">Explore Locations</h2>
          </div>
          <button
            type="button"
            className="vt-gallery-sheet__close"
            onClick={onClose}
            aria-label="Close gallery"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scene count */}
        <div className="vt-gallery-sheet__meta-bar">
          <span className="vt-gallery-sheet__count">
            {TOUR_DATA.scenes.length} location{TOUR_DATA.scenes.length !== 1 ? 's' : ''}
          </span>
          <span className="vt-gallery-sheet__society">{TOUR_DATA.society?.name}</span>
        </div>

        {/* Grid */}
        <div className="vt-gallery-sheet__body">
          <div className="vt-gallery-grid">
            {TOUR_DATA.scenes.map((scene, i) => (
              <GalleryCard
                key={scene.id}
                scene={scene}
                index={i}
                isActive={scene.id === currentSceneId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
