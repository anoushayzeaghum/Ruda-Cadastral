/**
 * HotspotInfoPanel
 * Right-side slide-in panel (bottom sheet on mobile) that shows rich info
 * hotspot content: title, category, status, metadata rows,
 * optional media image, and description.
 */
import React, { useEffect } from 'react';

const statusClass = {
  'Not Started': 'not-started',
  'In Progress': 'in-progress',
  'Completed':   'completed',
  'On Hold':     'on-hold',
};

export default function HotspotInfoPanel({ hotspot, isOpen, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Nothing to render when no hotspot is selected
  if (!hotspot) return null;

  const {
    title,
    text,
    category,
    status,
    date,
    contractor,
    image,
  } = hotspot;

  return (
    <aside
      className={`vt-info-panel glass${isOpen ? ' vt-info-panel--open' : ''}`}
      role="complementary"
      aria-label={`Info: ${title ?? 'Detail'}`}
      aria-hidden={!isOpen}
    >
      {/* ── Header ── */}
      <div className="vt-info-panel__header">
        <div style={{ flex: 1, minWidth: 0 }}>
          {category && (
            <div className="vt-info-panel__category">{category}</div>
          )}
          <h2 className="vt-info-panel__title">{title}</h2>
          {status && (
            <span
              className={`vt-status-badge vt-status-badge--${statusClass[status] ?? 'in-progress'}`}
              style={{ marginTop: 6, display: 'inline-flex' }}
            >
              {status}
            </span>
          )}
        </div>

        <button
          className="vt-info-panel__close"
          onClick={onClose}
          aria-label="Close info panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Body ── */}
      <div className="vt-info-panel__body">
        {/* Optional media */}
        {image && (
          <div className="vt-info-panel__media">
            <img src={image} alt={title ?? 'Location image'} loading="lazy" />
          </div>
        )}

        {/* Metadata table */}
        {(date || contractor) && (
          <div className="vt-info-panel__meta">
            {date && (
              <div className="vt-info-panel__meta-row">
                <span className="vt-info-panel__meta-key">Updated</span>
                <span className="vt-info-panel__meta-val">{date}</span>
              </div>
            )}
            {contractor && (
              <div className="vt-info-panel__meta-row">
                <span className="vt-info-panel__meta-key">Contractor</span>
                <span className="vt-info-panel__meta-val">{contractor}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {text && (
          <p className="vt-info-panel__desc">{text}</p>
        )}
      </div>
    </aside>
  );
}
