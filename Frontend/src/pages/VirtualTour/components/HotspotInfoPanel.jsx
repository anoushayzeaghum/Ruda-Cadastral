/**
 * HotspotInfoPanel
 * Right-side slide-in panel (bottom sheet on mobile) that shows rich info
 * hotspot content: title, category, progress bar, status, metadata rows,
 * optional media image, description, and a Compare Progress placeholder.
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
    progress,
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
            <img src={image} alt={title ?? 'Progress photo'} loading="lazy" />
          </div>
        )}

        {/* Progress bar */}
        {typeof progress === 'number' && (
          <div className="vt-progress">
            <div className="vt-progress__header">
              <span className="vt-progress__label">Construction Progress</span>
              <span className="vt-progress__value">{progress}%</span>
            </div>
            <div className="vt-progress__track">
              <div
                className="vt-progress__fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progress}% complete`}
              />
            </div>
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

        {/* Compare Progress placeholder */}
        <button
          className="vt-info-panel__compare"
          disabled
          aria-label="Compare progress — feature coming soon"
          title="Before/After comparison requires multiple capture dates for this location"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <rect x="1" y="3" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="8" y="3" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7.5 6.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Compare Progress
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
            (unavailable)
          </span>
        </button>
      </div>
    </aside>
  );
}
