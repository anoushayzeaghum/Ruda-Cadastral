/**
 * HelpOverlay
 * First-time onboarding overlay.
 * Shows four interaction hints, then a "Got It" button.
 * Dismissal is stored in localStorage so it only shows once per browser.
 */
import React, { useEffect } from 'react';

const STORAGE_KEY = 'ruda-vt-help-dismissed';

const hints = [
  { icon: '👆', text: 'Drag to look around' },
  { icon: '🔍', text: 'Scroll or pinch to zoom' },
  { icon: '⬆️', text: 'Click arrows to move' },
  { icon: 'ℹ️', text: 'Click ⓘ for details' },
];

export default function HelpOverlay({ visible, onDismiss }) {
  // Close on Escape
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
      <div className="vt-help__card glass glass--heavy">
        <h2 className="vt-help__title">How to Navigate</h2>

        <div className="vt-help__hints">
          {hints.map((h) => (
            <div key={h.text} className="vt-help__hint">
              <span className="vt-help__hint-icon" aria-hidden="true">{h.icon}</span>
              <span className="vt-help__hint-text">{h.text}</span>
            </div>
          ))}
        </div>

        <button
          className="vt-help__got-it"
          onClick={dismiss}
          autoFocus
          aria-label="Dismiss help and start tour"
        >
          Got It
        </button>
      </div>
    </div>
  );
}

/** Call this before rendering to check if the overlay should show */
export const shouldShowHelp = () =>
  !localStorage.getItem(STORAGE_KEY);
