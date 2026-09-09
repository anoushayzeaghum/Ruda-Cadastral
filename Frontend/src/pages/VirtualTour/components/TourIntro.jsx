/**
 * TourIntro
 * Cinematic intro screen shown before the viewer is entered.
 * Background uses the first scene's preview.jpg (blurred).
 * Fades out when the user clicks "Enter Virtual Tour".
 */
import React, { useEffect, useState } from 'react';
import { TOUR_DATA } from '../data/tourData';

// Build the preview URL the same way the hook does for the first scene
const mediaBase =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VIRTUAL_TOUR_MEDIA_URL?.replace(/\/$/, '')) ||
  '/tiles';

const firstPreview = `${mediaBase}/${TOUR_DATA.scenes[0].id}/preview.jpg`;

// Format ISO date string → human-readable "Month YYYY"
const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function TourIntro({ visible, onEnter }) {
  const [bgLoaded, setBgLoaded] = useState(false);

  // Preload the preview image so the background appears instantly
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = firstPreview;
  }, []);

  return (
    <div
      className={`vt-intro${visible ? '' : ' vt-intro--hidden'}`}
      role="dialog"
      aria-modal="true"
      aria-label="RUDA Virtual Tour introduction"
    >
      {/* Blurred background */}
      <div
        className="vt-intro__bg"
        style={bgLoaded ? { backgroundImage: `url(${firstPreview})` } : undefined}
        aria-hidden="true"
      />
      <div className="vt-intro__overlay" aria-hidden="true" />

      {/* Content */}
      <div className="vt-intro__content">
        {/* 360° badge */}
        <div className="vt-intro__badge">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M4 7c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          360° Virtual Tour
        </div>

        {/* Brand */}
        <h1 className="vt-intro__brand">
          <em>RUDA</em> Virtual Tour
        </h1>

        <p className="vt-intro__subtitle">
          Explore development progress across {TOUR_DATA.society.name} in immersive 360°
        </p>

        {/* Metadata */}
        <div className="vt-intro__meta">
          <div className="vt-intro__meta-item">
            <span>Society</span>
            <strong>{TOUR_DATA.society.name}</strong>
          </div>
          <div className="vt-intro__meta-item">
            <span>Capture</span>
            <strong>{formatDate(TOUR_DATA.captureDate)}</strong>
          </div>
          <div className="vt-intro__meta-item">
            <span>Scenes</span>
            <strong>{TOUR_DATA.scenes.length}</strong>
          </div>
        </div>

        {/* Enter button */}
        <button
          className="vt-intro__enter"
          onClick={onEnter}
          aria-label="Enter the virtual tour"
          autoFocus
        >
          Enter Virtual Tour
        </button>

        {/* Skip */}
        <button
          className="vt-intro__skip"
          onClick={onEnter}
          aria-label="Skip intro and enter tour"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
