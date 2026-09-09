/**
 * SceneCarousel
 * Horizontal bottom strip for quick scene switching.
 * Shows thumbnails + names, highlights the active scene, supports
 * prev/next buttons and drag-to-scroll.
 * Auto-scrolls the active card into view on scene change.
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { TOUR_DATA } from '../data/tourData';
import { getSceneIndex } from '../data/tourData';
import { getTourPreviewUrl } from '../utils/virtualTourAssets';


export default function SceneCarousel({
  currentSceneId,
  onSceneSelect,
  onPrev,
  onNext,
  hidden,
}) {
  const trackRef   = useRef(null);
  const isDragging = useRef(false);
  const dragStart  = useRef(0);
  const scrollStart = useRef(0);

  const scenes = TOUR_DATA.scenes;
  const currentIdx = getSceneIndex(currentSceneId);

  // Auto-scroll active card into view
  useEffect(() => {
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll('.vt-carousel__card');
    if (cards[currentIdx]) {
      cards[currentIdx].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentSceneId, currentIdx]);

  // Drag-to-scroll mouse handlers
  const onMouseDown = useCallback((e) => {
    isDragging.current = true;
    dragStart.current  = e.clientX;
    scrollStart.current = trackRef.current?.scrollLeft ?? 0;
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !trackRef.current) return;
    const dx = dragStart.current - e.clientX;
    trackRef.current.scrollLeft = scrollStart.current + dx;
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  return (
    <nav
      className={`vt-carousel glass${hidden ? ' vt-carousel--hidden' : ''}`}
      aria-label="Scene quick navigation"
    >
      {/* Previous button */}
      <button
        className="vt-carousel__prev"
        onClick={onPrev}
        aria-label="Previous scene"
        title="Previous scene (←)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M8.5 3L5 7l3.5 4" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Scrollable track */}
      <div
        className="vt-carousel__track"
        ref={trackRef}
        role="listbox"
        aria-label="Scene list"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {scenes.map((scene, idx) => {
          const active = scene.id === currentSceneId;
          return (
            <button
              key={scene.id}
              className={`vt-carousel__card${active ? ' active' : ''}`}
              role="option"
              aria-selected={active}
              aria-label={`Go to scene: ${scene.name}`}
              onClick={() => onSceneSelect?.(scene.id)}
              // Prevent drag from triggering click
              onMouseDown={(e) => e.stopPropagation()}
            >
              <img
                className="vt-carousel__card-thumb"
                src={getTourPreviewUrl(scene.id)}
                alt=""
                loading="lazy"
                draggable={false}
                aria-hidden="true"
                onError={(e) => { e.currentTarget.style.opacity = '0'; }}
              />
              <div className="vt-carousel__card-label">
                <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {scene.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        className="vt-carousel__next"
        onClick={onNext}
        aria-label="Next scene"
        title="Next scene (→)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M5.5 3L9 7l-3.5 4" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}
