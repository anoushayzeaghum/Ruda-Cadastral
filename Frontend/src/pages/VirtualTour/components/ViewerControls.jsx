import React, { useEffect, useRef, useState } from 'react';

const GalleryIco = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><path d="M5.5 17l4.5-4 3 2.5 2.5-2 3 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const GyroIco = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><ellipse cx="12" cy="12" rx="9" ry="4.6" stroke="currentColor" strokeWidth="1.6"/><ellipse cx="12" cy="12" rx="4.6" ry="9" stroke="currentColor" strokeWidth="1.6" transform="rotate(35 12 12)"/></svg>;
const InfoIco = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="1.1" fill="currentColor"/></svg>;
const FsEnterIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9V3h6M15 3h6v6M3 15v6h6M21 15v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const FsExitIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3H3v6M21 9V3h-6M3 15v6h6M15 21h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ZoomInIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11h6M11 8v6M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const ZoomOutIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11h6M20 20l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const ResetIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 0 2-5.3L4 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PlayIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 4.5l14 7.5-14 7.5V4.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
const PauseIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="4" height="16" rx="1.5" fill="currentColor"/><rect x="15" y="4" width="4" height="16" rx="1.5" fill="currentColor"/></svg>;
const MoreIco = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>;
const UpIco = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const DownIco = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4v8M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const LeftIco = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 8H4M8 4L4 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const RightIco = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;

function IconButton({ onClick, active = false, label, children }) {
  return (
    <button type="button" className={`vt-floating-btn${active ? ' vt-floating-btn--active' : ''}`} onClick={onClick} aria-label={label} aria-pressed={active || undefined} title={label}>
      {children}
    </button>
  );
}

function DBtn({ onClick, label, children, className = '' }) {
  return <button type="button" className={`vt-dpad__btn ${className}`} onClick={onClick} aria-label={label} title={label}>{children}</button>;
}

export default function ViewerControls({
  isAutorotating,
  isFullscreen,
  isGyroscopeEnabled,
  galleryOpen,
  infoPanelOpen,
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
  const [moreOpen, setMoreOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMoreOpen(false);
    };
    const esc = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  return (
    <>
      <div className="vt-toolbar" ref={wrapRef} role="toolbar" aria-label="Viewer controls">
        <div className="vt-quick-tools">
          <IconButton onClick={onGallery} active={galleryOpen} label="Gallery"><GalleryIco /></IconButton>
          <IconButton onClick={onInfo} active={infoPanelOpen} label="Information"><InfoIco /></IconButton>
          <IconButton onClick={onToggleFullscreen} active={isFullscreen} label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>{isFullscreen ? <FsExitIco /> : <FsEnterIco />}</IconButton>
          <IconButton onClick={() => setMoreOpen((v) => !v)} active={moreOpen} label="More controls"><MoreIco /></IconButton>
        </div>

        {moreOpen && (
          <div className="vt-more-menu" role="menu" aria-label="More viewer controls">
            <div className="vt-more-menu__header">View controls</div>
            <button type="button" onClick={onToggleGyroscope} className={isGyroscopeEnabled ? 'is-active' : ''}><span><GyroIco /> Motion</span><b>{isGyroscopeEnabled ? 'On' : 'Off'}</b></button>
            <button type="button" onClick={onToggleAutorotate} className={isAutorotating ? 'is-active' : ''}><span>{isAutorotating ? <PauseIco /> : <PlayIco />} Auto rotate</span><b>{isAutorotating ? 'On' : 'Off'}</b></button>
            <div className="vt-more-menu__divider" />
            <button type="button" onClick={onZoomIn}><span><ZoomInIco /> Zoom in</span></button>
            <button type="button" onClick={onZoomOut}><span><ZoomOutIco /> Zoom out</span></button>
            <button type="button" onClick={onReset}><span><ResetIco /> Reset view</span></button>
          </div>
        )}
      </div>

      <div className="vt-dpad-wrap" role="toolbar" aria-label="Pan panorama">
        <div className="vt-dpad">
          <DBtn onClick={onPanUp} label="Pan up" className="vt-dpad__up"><UpIco /></DBtn>
          <DBtn onClick={onPanLeft} label="Pan left" className="vt-dpad__left"><LeftIco /></DBtn>
          <div className="vt-dpad__center" aria-hidden="true" />
          <DBtn onClick={onPanRight} label="Pan right" className="vt-dpad__right"><RightIco /></DBtn>
          <DBtn onClick={onPanDown} label="Pan down" className="vt-dpad__down"><DownIco /></DBtn>
        </div>
      </div>
    </>
  );
}
