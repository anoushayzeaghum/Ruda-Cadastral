import React from 'react';

const Sep = () => <div className="vt-controls__sep" aria-hidden="true" />;

const Up = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Down = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 4v8M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Left = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12 8H4M8 4L4 8l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Right = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ZoomIn = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 7h4M7 5v4M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const ZoomOut = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 7h4M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const Reset = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8a5 5 0 1 0 1.5-3.5L3 3v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Play = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M5 3.5l8 4.5-8 4.5V3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);
const Pause = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor"/>
    <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor"/>
  </svg>
);
const FsEnter = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const FsExit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Btn({ onClick, active = false, label, children }) {
  return (
    <button
      type="button"
      className={`vt-ctrl-btn${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
    >
      {children}
    </button>
  );
}

export default function ViewerControls({
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleAutorotate,
  onToggleFullscreen,
  isAutorotating,
  isFullscreen,
}) {
  return (
    <>
      {/* Main utility controls remain at the top-right. */}
      <div className="vt-controls vt-controls--utilities" role="toolbar" aria-label="Panorama utility controls">
        <div className="vt-controls__pill">
          <Btn
            onClick={onToggleFullscreen}
            active={isFullscreen}
            label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FsExit /> : <FsEnter />}
          </Btn>

          <Sep />

          <div className="vt-controls__cluster" aria-label="Zoom controls">
            <Btn onClick={onZoomIn} label="Zoom in"><ZoomIn /></Btn>
            <Btn onClick={onZoomOut} label="Zoom out"><ZoomOut /></Btn>
          </div>

          <Sep />

          <div className="vt-controls__cluster" aria-label="View utilities">
            <Btn onClick={onReset} label="Reset view"><Reset /></Btn>
            <Btn
              onClick={onToggleAutorotate}
              active={isAutorotating}
              label={isAutorotating ? 'Pause autorotation' : 'Start autorotation'}
            >
              {isAutorotating ? <Pause /> : <Play />}
            </Btn>
          </div>
        </div>
      </div>

      {/* Directional navigation is intentionally separated and placed bottom-right. */}
      <div className="vt-direction-controls" role="toolbar" aria-label="Pan panorama">
        <div className="vt-direction-pad">
          <div className="vt-direction-pad__up">
            <Btn onClick={onPanUp} label="Pan up"><Up /></Btn>
          </div>
          <div className="vt-direction-pad__left">
            <Btn onClick={onPanLeft} label="Pan left"><Left /></Btn>
          </div>
          <div className="vt-direction-pad__down">
            <Btn onClick={onPanDown} label="Pan down"><Down /></Btn>
          </div>
          <div className="vt-direction-pad__right">
            <Btn onClick={onPanRight} label="Pan right"><Right /></Btn>
          </div>
        </div>
      </div>
    </>
  );
}
