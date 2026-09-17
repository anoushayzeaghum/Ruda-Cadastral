/**
 * HotspotInfoPanel
 *
 * Right-side slide-in panel (bottom sheet on mobile).
 * Shows: category label · title · status badge · metadata · description · optional image.
 */
import React, { useEffect } from 'react';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const statusMeta = {
  'Not Started': { cls: 'not-started', label: 'Not Started' },
  'In Progress':  { cls: 'in-progress',  label: 'In Progress'  },
  'Completed':    { cls: 'completed',    label: 'Completed'    },
  'On Hold':      { cls: 'on-hold',      label: 'On Hold'      },
};

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="vt-info-panel__meta-row">
      <span className="vt-info-panel__meta-key">{label}</span>
      <span className="vt-info-panel__meta-val">{value}</span>
    </div>
  );
}

export default function HotspotInfoPanel({ hotspot, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!hotspot) return null;

  const { title, text, category, status, date, contractor, image } = hotspot;
  const sm = statusMeta[status] ?? statusMeta['In Progress'];
  const hasMeta = date || contractor;

  return (
    <aside
      className={`vt-info-panel${isOpen ? ' vt-info-panel--open' : ''}`}
      role="complementary"
      aria-label={`Details: ${title ?? 'Location'}`}
      aria-hidden={!isOpen}
    >
      {/* ── Header ── */}
      <div className="vt-info-panel__header">
        <div className="vt-info-panel__header-copy">
          {category && <span className="vt-info-panel__category">{category}</span>}
          <h2 className="vt-info-panel__title">{title}</h2>
          {status && (
            <span className={`vt-status-badge vt-status-badge--${sm.cls}`}>
              {sm.label}
            </span>
          )}
        </div>
        <button
          type="button"
          className="vt-info-panel__close"
          onClick={onClose}
          aria-label="Close panel"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="vt-info-panel__body">
        {/* Optional image */}
        {image && (
          <div className="vt-info-panel__media">
            <img src={image} alt={title ?? 'Location image'} loading="lazy" />
          </div>
        )}

        {/* Metadata */}
        {hasMeta && (
          <div className="vt-info-panel__meta">
            <MetaRow label="Updated"    value={date}       />
            <MetaRow label="Contractor" value={contractor} />
          </div>
        )}

        {/* Description */}
        {text && <p className="vt-info-panel__desc">{text}</p>}
      </div>
    </aside>
  );
}
