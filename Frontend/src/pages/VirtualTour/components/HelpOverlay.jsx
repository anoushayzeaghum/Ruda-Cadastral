/**
 * HelpOverlay
 *
 * Elegant first-time welcome overlay.
 * Dismissal stored in localStorage — shows only once per browser.
 * sessionStorage flag used so it doesn't re-appear on scene change.
 */
import React, { useEffect } from 'react';

const STORAGE_KEY = 'ruda-vt-help-dismissed';

const hints = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
        <path d="M8 14h12M16 10l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    text: 'Drag to look around',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
        <circle cx="14" cy="14" r="5" stroke="#fff" strokeWidth="1.8"/>
        <path d="M14 4v3M14 21v3M4 14h3M21 14h3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    text: 'Scroll or pinch to zoom',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
        <circle cx="14" cy="14" r="4" fill="#fff" opacity=".9"/>
        <circle cx="14" cy="14" r="8" stroke="#fff" strokeWidth="1.3" strokeDasharray="3 2"/>
      </svg>
    ),
    text: 'Click hotspots to move',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
        <circle cx="14" cy="14" r="7" stroke="#fff" strokeWidth="1.8"/>
        <path d="M14 10v5M14 17v1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    text: 'Tap ⓘ for location info',
  },
];

export default function HelpOverlay({ visible, onDismiss }) {
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => { if (e.key === 'Escape') onDismiss?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onDismiss]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    onDismiss?.();
  };

  return (
    <div
      className={`vt-help${visible ? '' : ' vt-help--hidden'}`}
      role="dialog"
      aria-modal="true"
      aria-label="How to navigate the virtual tour"
    >
      <div className="vt-help__card">
        {/* Badge */}
        <span className="vt-help__badge">RUDA Virtual Tour</span>

        {/* Heading */}
        <h2 className="vt-help__title">Explore in 360°</h2>
        <p className="vt-help__sub">Navigate Chahar Bagh development sites from every angle.</p>

        {/* Hints grid */}
        <div className="vt-help__hints">
          {hints.map((h) => (
            <div key={h.text} className="vt-help__hint">
              <span className="vt-help__hint-icon" aria-hidden="true">{h.icon}</span>
              <span className="vt-help__hint-text">{h.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          className="vt-help__cta"
          onClick={dismiss}
          autoFocus
          aria-label="Start exploring the virtual tour"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}

/** Call before rendering to check if the overlay should show */
export const shouldShowHelp = () => !localStorage.getItem(STORAGE_KEY);
