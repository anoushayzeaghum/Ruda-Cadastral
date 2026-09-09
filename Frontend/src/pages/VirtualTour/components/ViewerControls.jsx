/**
 * ViewerControls
 * Single slim pill — vertically centred on the right edge.
 * Buttons (top→bottom): Sidebar · Fullscreen · ─── · ↑ · ← ↓ → · ─── · + · − · ─── · ↺ · ▶/⏸
 */
import React from 'react';

/* ── Divider between button groups inside the pill ── */
const Sep = () => (
  <div style={{ width: 20, height: 1, background: 'rgba(22,132,91,0.25)', margin: '2px auto' }} aria-hidden="true" />
);

/* ── Icons ── */
const IcoArrowUp    = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoArrowDown  = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 4v8M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoArrowLeft  = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M12 8H4M8 4L4 8l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoArrowRight = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoZoomIn     = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7h4M7 5v4M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IcoZoomOut    = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7h4M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const IcoReset      = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.5L3 3v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoPlay       = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 3.5l8 4.5-8 4.5V3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;
const IcoPause      = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor"/></svg>;
const IcoFsEnter    = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoFsExit     = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoMenu       = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3"   width="12" height="1.4" rx="0.7" fill="currentColor"/><rect x="2" y="7.3" width="8"  height="1.4" rx="0.7" fill="currentColor"/><rect x="2" y="11.6" width="12" height="1.4" rx="0.7" fill="currentColor"/></svg>;
const IcoClose      = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

/* ── Single button ── */
function Btn({ refProp, onClick, active, label, children }) {
  return (
    <button
      ref={refProp}
      className={`vt-ctrl-btn${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export default function ViewerControls({
  viewUpRef, viewDownRef, viewLeftRef, viewRightRef, viewInRef, viewOutRef,
  onReset, onToggleAutorotate, onToggleFullscreen, onToggleSidebar,
  isAutorotating, isFullscreen, isSidebarOpen, hidden,
}) {
  return (
    <div
      className={`vt-controls${hidden ? ' vt-controls--hidden' : ''}`}
      role="toolbar"
      aria-label="Viewer controls"
    >
      {/* Single unified glass pill */}
      <div className="vt-controls__pill glass">

        {/* Sidebar + fullscreen */}
        <Btn onClick={onToggleSidebar} active={isSidebarOpen} label={isSidebarOpen ? 'Close scenes' : 'Open scenes'}>
          {isSidebarOpen ? <IcoClose /> : <IcoMenu />}
        </Btn>
        <Btn onClick={onToggleFullscreen} active={isFullscreen} label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <IcoFsExit /> : <IcoFsEnter />}
        </Btn>

        <Sep />

        {/* Pan */}
        <Btn refProp={viewUpRef}    label="Pan up">    <IcoArrowUp />    </Btn>

        {/* Left / Down / Right row */}
        <div style={{ display: 'flex', gap: 2 }}>
          <Btn refProp={viewLeftRef}  label="Pan left">  <IcoArrowLeft />  </Btn>
          <Btn refProp={viewDownRef}  label="Pan down">  <IcoArrowDown />  </Btn>
          <Btn refProp={viewRightRef} label="Pan right"> <IcoArrowRight /> </Btn>
        </div>

        <Sep />

        {/* Zoom */}
        <Btn refProp={viewInRef}  label="Zoom in">  <IcoZoomIn />  </Btn>
        <Btn refProp={viewOutRef} label="Zoom out"> <IcoZoomOut /> </Btn>

        <Sep />

        {/* Reset + autorotate */}
        <Btn onClick={onReset} label="Reset view"><IcoReset /></Btn>
        <Btn onClick={onToggleAutorotate} active={isAutorotating}
             label={isAutorotating ? 'Pause rotation' : 'Start rotation'}>
          {isAutorotating ? <IcoPause /> : <IcoPlay />}
        </Btn>

      </div>
    </div>
  );
}
