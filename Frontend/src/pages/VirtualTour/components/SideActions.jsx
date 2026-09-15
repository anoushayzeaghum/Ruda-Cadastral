import React from 'react';

const GalleryIcon = () => <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><path d="M5.5 17l4.5-4 3 2.5 2.5-2 3 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const GyroIcon = () => <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><ellipse cx="12" cy="12" rx="9" ry="4.6" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="12" cy="12" rx="4.6" ry="9" stroke="currentColor" strokeWidth="1.5" transform="rotate(35 12 12)"/></svg>;
const InfoIcon = () => <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="1" fill="currentColor"/></svg>;

function Action({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      className={`vt-side-action${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
    >
      {children}
      <span className="vt-side-action__label">{label}</span>
    </button>
  );
}

export default function SideActions({ galleryOpen, onGallery, gyroEnabled, onGyro, onInfo }) {
  return (
    <div className="vt-side-actions glass" role="toolbar" aria-label="Tour tools">
      <Action active={galleryOpen} label="Gallery" onClick={onGallery}><GalleryIcon /></Action>
      <Action active={gyroEnabled} label={gyroEnabled ? 'Gyroscope on' : 'Gyroscope'} onClick={onGyro}><GyroIcon /></Action>
      <Action label="Tour info" onClick={onInfo}><InfoIcon /></Action>
    </div>
  );
}
