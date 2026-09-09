/**
 * TourLoadingScreen
 * Full-viewport overlay shown while Marzipano initialises and the first scene renders.
 * Fades out when `isLoading` becomes false.
 */
import React from 'react';

export default function TourLoadingScreen({ isLoading }) {
  return (
    <div
      className={`vt-loading${isLoading ? '' : ' vt-loading--hidden'}`}
      role="status"
      aria-live="polite"
      aria-label="Loading virtual tour"
    >
      {/* RUDA logo mark */}
      <div className="vt-loading__logo">
        RUDA&nbsp;<span>Virtual Tour</span>
      </div>

      {/* Spinner */}
      <div className="vt-spinner" aria-hidden="true" />

      {/* Label */}
      <div className="vt-loading__label">Loading 360° Scene…</div>
    </div>
  );
}
