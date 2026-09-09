/**
 * SceneDrawer — thumbnail + name only, no status/progress clutter
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TOUR_DATA } from '../data/tourData';

const mediaBase =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VIRTUAL_TOUR_MEDIA_URL?.replace(/\/$/, '')) ||
  '/tiles';

const thumbUrl = (id) => `${mediaBase}/${id}/preview.jpg`;

export default function SceneDrawer({ isOpen, currentSceneId, onSceneSelect, onClose }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TOUR_DATA.scenes;
    return TOUR_DATA.scenes.filter((s) => s.name.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const handleSelect = useCallback((id) => {
    onSceneSelect?.(id);
    if (window.matchMedia('(max-width: 600px)').matches) onClose?.();
  }, [onSceneSelect, onClose]);

  return (
    <aside
      id="vt-scene-drawer"
      className={`vt-drawer glass${isOpen ? ' vt-drawer--open' : ''}`}
      aria-label="Scene navigation"
      aria-hidden={!isOpen}
    >
      <div className="vt-drawer__inner">
        {/* Search */}
        <div className="vt-drawer__search">
          <div className="vt-drawer__search-wrap">
            <svg className="vt-drawer__search-icon" width="14" height="14"
                 viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="vt-drawer__search-input"
              placeholder="Search scenes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search scenes"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Scene list — thumbnail + number + name only */}
        <ul className="vt-drawer__list" role="listbox" aria-label="Scenes">
          {filtered.length === 0 && (
            <li style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No results for "{query}"
            </li>
          )}
          {filtered.map((scene) => {
            const active  = scene.id === currentSceneId;
            const idx     = TOUR_DATA.scenes.indexOf(scene);
            return (
              <li key={scene.id} role="option" aria-selected={active}>
                <button
                  className={`vt-drawer__card${active ? ' active' : ''}`}
                  onClick={() => handleSelect(scene.id)}
                  aria-label={`Go to ${scene.name}`}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <img
                    className="vt-drawer__card-thumb"
                    src={thumbUrl(scene.id)}
                    alt=""
                    loading="lazy"
                    aria-hidden="true"
                    onError={(e) => { e.currentTarget.style.opacity = '0.25'; }}
                  />
                  <div className="vt-drawer__card-body">
                    <div className="vt-drawer__card-num">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="vt-drawer__card-name">{scene.name}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
