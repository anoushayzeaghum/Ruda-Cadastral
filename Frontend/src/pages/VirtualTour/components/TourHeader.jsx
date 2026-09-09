/**
 * TourHeader — clean minimal top bar
 * Logo · scene name · drawer toggle · immersive toggle
 */
import React from 'react';

export default function TourHeader({
  currentScene,
  isDrawerOpen,
  onDrawerToggle,
  isImmersive,
  onImmersiveToggle,
  hidden,
}) {
  return (
    <header
      className={`vt-header glass${hidden ? ' vt-header--hidden' : ''}`}
      role="banner"
    >
      {/* Logo */}
      <div className="vt-header__logo">
        <div className="vt-header__logo-mark" aria-hidden="true">RU</div>
        <div className="vt-header__logo-text">
          <strong>RUDA</strong>
          <span>Virtual Tour</span>
        </div>
      </div>

      <div className="vt-header__divider" aria-hidden="true" />

      {/* Scene name only */}
      <div className="vt-header__scene-meta">
        <div className="vt-header__scene-name">
          {currentScene?.name ?? 'Loading…'}
        </div>
      </div>

      {/* Right controls */}
      <div className="vt-header__controls" role="toolbar" aria-label="View controls">
        {/* Scenes toggle */}
        <button
          className={`vt-header__ctrl-btn${isDrawerOpen ? ' active' : ''}`}
          onClick={onDrawerToggle}
          aria-label={isDrawerOpen ? 'Close scene list' : 'Open scene list'}
          aria-expanded={isDrawerOpen}
          aria-controls="vt-scene-drawer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="2" y="3.5"  width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="2" y="8.25" width="10" height="1.5" rx="0.75" fill="currentColor" />
            <rect x="2" y="13"   width="14" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>

        {/* Immersive mode */}
        <button
          className={`vt-header__ctrl-btn${isImmersive ? ' active' : ''}`}
          onClick={onImmersiveToggle}
          aria-label={isImmersive ? 'Show interface' : 'Immersive mode'}
          aria-pressed={isImmersive}
        >
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="6"   stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="2.5" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
