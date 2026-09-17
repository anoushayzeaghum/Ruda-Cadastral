/**
 * ViewerControls
 *
 * Renders TWO things:
 *   1. .vt-toolbar  — single unified glass pill (top-right, below topbar)
 *                     Contains: Gallery | Gyro | Info  |  Fullscreen | Zoom+ | Zoom- | Reset | Autorotate
 *   2. .vt-dpad     — elegant circular directional pad (bottom-right)
 *
 * All icon buttons: 42×42, tooltip on hover, green active state, no permanent labels.
 */
import React from 'react';

/* ── SVG icons ────────────────────────────────────────────────────────────── */
const GalleryIco   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><path d="M5.5 17l4.5-4 3 2.5 2.5-2 3 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const GyroIco      = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><ellipse cx="12" cy="12" rx="9" ry="4.6" stroke="currentColor" strokeWidth="1.6"/><ellipse cx="12" cy="12" rx="4.6" ry="9" stroke="currentColor" strokeWidth="1.6" transform="rotate(35 12 12)"/></svg>;
const InfoIco      = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="1.1" fill="currentColor"/></svg>;
const FsEnterIco   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9V3h6M15 3h6v6M3 15v6h6M21 15v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const FsExitIco    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3H3v6M21 9V3h-6M3 15v6h6M15 21h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ZoomInIco    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11h6M11 8v6M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const ZoomOutIco   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11h6M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const ResetIco     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 0 2-5.3L4 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PlayIco      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 4.5l14 7.5-14 7.5V4.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
const PauseIco     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="4" height="16" rx="1.5" fill="currentColor"/><rect x="15" y="4" width="4" height="16" rx="1.5" fill="currentColor"/></svg>;

/* Directional arrows */
const UpIco    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const DownIco  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4v8M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const LeftIco  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M8 4L4 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const RightIco = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;

/* ── Tooltip button ───────────────────────────────────────────────────────── */
function TBtn({ onClick, active = false, fsActive = false, label, children }) {
  return (
    <button
      type="button"
      className={`vt-tbtn${active ? ' vt-tbtn--active' : ''}${fsActive ? ' vt-tbtn--fs' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
    >
      {children}
      <span className="vt-tbtn__tip">{label}</span>
    </button>
  );
}

/* ── Separator ────────────────────────────────────────────────────────────── */
const Sep = () => <span className="vt-toolbar__sep" aria-hidden="true" />;

/* ── D-pad button ─────────────────────────────────────────────────────────── */
function DBtn({ onClick, label, children, className = '' }) {
  return (
    <button
      type="button"
      className={`vt-dpad__btn ${className}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

/* ── Main export ──────────────────────────────────────────────────────────── */
export default function ViewerControls({
  /* viewer state */
  isAutorotating,
  isFullscreen,
  isGyroscopeEnabled,
  galleryOpen,
  infoPanelOpen,
  /* callbacks */
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleAutorotate,
  onToggleFullscreen,
  onToggleGyroscope,
  onGallery,
  onInfo,
}) {
  return (
    <>
      {/* ── Unified viewer toolbar ── */}
      <div className="vt-toolbar" role="toolbar" aria-label="Viewer controls">
        <div className="vt-toolbar__pill">

          {/* Group 1: content */}
          <TBtn onClick={onGallery}       active={galleryOpen}        label="Gallery">     <GalleryIco /></TBtn>
          <TBtn onClick={onToggleGyroscope} active={isGyroscopeEnabled} label={isGyroscopeEnabled ? 'Motion On' : 'Motion'}><GyroIco /></TBtn>
          <TBtn onClick={onInfo}          active={infoPanelOpen}      label="Information"><InfoIco /></TBtn>

          <Sep />

          {/* Group 2: view */}
          <TBtn onClick={onToggleFullscreen} active={false} fsActive={isFullscreen}
                label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <FsExitIco /> : <FsEnterIco />}
          </TBtn>

          <Sep />

          {/* Group 3: zoom + reset + autorotate */}
          <TBtn onClick={onZoomIn}           label="Zoom In">      <ZoomInIco /></TBtn>
          <TBtn onClick={onZoomOut}          label="Zoom Out">     <ZoomOutIco /></TBtn>
          <TBtn onClick={onReset}            label="Reset View">   <ResetIco /></TBtn>
          <TBtn onClick={onToggleAutorotate} active={isAutorotating}
                label={isAutorotating ? 'Pause Rotation' : 'Auto Rotate'}>
            {isAutorotating ? <PauseIco /> : <PlayIco />}
          </TBtn>

        </div>
      </div>

      {/* ── Directional pad ── */}
      <div className="vt-dpad-wrap" role="toolbar" aria-label="Pan panorama">
        <div className="vt-dpad">
          <DBtn onClick={onPanUp}    label="Pan up"    className="vt-dpad__up">   <UpIco /></DBtn>
          <DBtn onClick={onPanLeft}  label="Pan left"  className="vt-dpad__left"> <LeftIco /></DBtn>
          <div className="vt-dpad__center" aria-hidden="true" />
          <DBtn onClick={onPanRight} label="Pan right" className="vt-dpad__right"><RightIco /></DBtn>
          <DBtn onClick={onPanDown}  label="Pan down"  className="vt-dpad__down"> <DownIco /></DBtn>
        </div>
      </div>
    </>
  );
}
