/**
 * ModernTourChrome — Premium RUDA Virtual Tour overlay chrome
 *
 * Renders:
 *   • Top-left: back button + RUDA brand
 *   • Top-right: Explore / Share / Help actions
 *   • Bottom-left: floating scene information card
 *   • Bottom-center: prev / scene-name / next navigator
 *   • Center: drag-hint (fades after 4 s or first pointer-down)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOUR_DATA, getSceneIndex } from '../data/tourData';
import { getTourThumbnailUrl } from '../utils/virtualTourAssets';

/* ── SVG icons ────────────────────────────────────────────────────────────── */
const ArrowLeft  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ArrowRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const BackArrow  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="m19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const GridIcon   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/></svg>;
const ShareIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/><path d="m8.7 10.7 6.6-4M8.7 13.3l6.6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const HelpIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M9.7 9a2.45 2.45 0 0 1 4.8.7c0 1.7-1.8 2.2-2.4 3.2-.2.3-.2.7-.2 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>;
const GalleryOpenIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/></svg>;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return iso ?? '';
  }
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
function Brand({ onClick }) {
  return (
    <button
      type="button"
      className="vt-brand"
      onClick={onClick}
      aria-label="Back to RUDA"
    >
      <span className="vt-brand__back" aria-hidden="true">
        <BackArrow />
      </span>
      <span className="vt-brand__mark" aria-hidden="true">RU</span>
      <span className="vt-brand__text">
        <strong>RUDA</strong>
        <small>Virtual Tour</small>
      </span>
    </button>
  );
}

function TopActions({ onExplore, onShare, copied, onHelp }) {
  return (
    <div className="vt-top-actions" role="toolbar" aria-label="Primary actions">
      <button
        type="button"
        className="vt-action vt-action--primary"
        onClick={onExplore}
        aria-label="Explore all locations"
      >
        <GridIcon />
        <span>Explore</span>
      </button>
      <button
        type="button"
        className="vt-action vt-action--secondary"
        onClick={onShare}
        aria-label={copied ? 'Link copied' : 'Share this view'}
      >
        <ShareIcon />
        <span>{copied ? 'Copied!' : 'Share'}</span>
      </button>
      <button
        type="button"
        className="vt-action vt-action--icon"
        onClick={onHelp}
        aria-label="Help"
        title="Help"
      >
        <HelpIcon />
      </button>
    </div>
  );
}

function SceneCard({ scene, sceneNumber, totalScenes, onGallery }) {
  const thumbSrc = getTourThumbnailUrl(scene.id);
  const date     = formatDate(scene.captureDate || TOUR_DATA.captureDate);

  return (
    <div className="vt-scene-card" aria-live="polite" aria-label={`Current location: ${scene.name}`}>
      <div className="vt-scene-card__thumb">
        <img src={thumbSrc} alt="" loading="lazy" />
      </div>

      <div className="vt-scene-card__body">
        <div className="vt-scene-card__head">
          <span className="vt-scene-card__zone">
            {TOUR_DATA.society?.name ?? 'RUDA'} · {scene.zone ?? 'Tour Location'}
          </span>
          <span className="vt-scene-card__counter" aria-label={`Scene ${sceneNumber} of ${totalScenes}`}>
            {pad(sceneNumber)} / {pad(totalScenes)}
          </span>
        </div>

        <h1 className="vt-scene-card__name">{scene.name}</h1>

        <p className="vt-scene-card__desc">{scene.description}</p>

        <div className="vt-scene-card__footer">
          <span className="vt-scene-card__date">{date}</span>
          <button
            type="button"
            className="vt-scene-card__all-btn"
            onClick={onGallery}
            aria-label="View all locations"
          >
            <GalleryOpenIcon />
            All Locations
          </button>
        </div>
      </div>
    </div>
  );
}

function SceneNav({ currentScene, allScenes, sceneIndex, onPrev, onNext }) {
  const prevScene = allScenes[(sceneIndex - 1 + allScenes.length) % allScenes.length];
  const nextScene = allScenes[(sceneIndex + 1) % allScenes.length];

  return (
    <nav className="vt-scene-nav" aria-label="Scene navigation">
      <button
        type="button"
        className="vt-scene-nav__arrow vt-scene-nav__arrow--prev"
        onClick={onPrev}
        aria-label={`Previous: ${prevScene?.name ?? ''}`}
        title={prevScene?.name ?? 'Previous'}
      >
        <ArrowLeft />
      </button>

      <div className="vt-scene-nav__center" aria-current="true">
        <span className="vt-scene-nav__name">{currentScene?.name ?? ''}</span>
        <small className="vt-scene-nav__sub">Explore location</small>
      </div>

      <button
        type="button"
        className="vt-scene-nav__arrow vt-scene-nav__arrow--next"
        onClick={onNext}
        aria-label={`Next: ${nextScene?.name ?? ''}`}
        title={nextScene?.name ?? 'Next'}
      >
        <ArrowRight />
      </button>
    </nav>
  );
}

function DragHint({ visible }) {
  return (
    <div
      className={`vt-drag-hint${visible ? ' vt-drag-hint--visible' : ''}`}
      aria-hidden="true"
    >
      <span className="vt-drag-hint__mouse"><i /></span>
      <span className="vt-drag-hint__text">Drag to explore · Scroll to zoom</span>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────────────────── */
export default function ModernTourChrome({
  currentScene,
  onPrev,
  onNext,
  onOpenGallery,
  onOpenHelp,
}) {
  const navigate = useNavigate();
  const [copied, setCopied]         = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const allScenes  = TOUR_DATA.scenes;
  const sceneIndex = useMemo(() => getSceneIndex(currentScene?.id), [currentScene?.id]);
  const sceneNum   = sceneIndex >= 0 ? sceneIndex + 1 : 1;

  /* Fade out drag hint after 4 s or on first pointer interaction */
  useEffect(() => {
    const t = window.setTimeout(() => setHintVisible(false), 4200);
    const dismiss = () => setHintVisible(false);
    window.addEventListener('pointerdown', dismiss, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointerdown', dismiss);
    };
  }, []);

  /* Reset hint whenever scene changes */
  useEffect(() => {
    setHintVisible(true);
    const t = window.setTimeout(() => setHintVisible(false), 4200);
    return () => window.clearTimeout(t);
  }, [currentScene?.id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!currentScene) return null;

  return (
    <>
      {/* ── Top bar ─────────────────────────────────── */}
      <div className="vt-topbar">
        <Brand onClick={() => navigate('/landing')} />
        <TopActions
          onExplore={onOpenGallery}
          onShare={handleShare}
          copied={copied}
          onHelp={onOpenHelp}
        />
      </div>

      {/* ── Bottom-left scene card ───────────────────── */}
      <SceneCard
        scene={currentScene}
        sceneNumber={sceneNum}
        totalScenes={allScenes.length}
        onGallery={onOpenGallery}
      />

      {/* ── Bottom-center navigator ──────────────────── */}
      <SceneNav
        currentScene={currentScene}
        allScenes={allScenes}
        sceneIndex={sceneIndex}
        onPrev={onPrev}
        onNext={onNext}
      />

      {/* ── Center drag hint ─────────────────────────── */}
      <DragHint visible={hintVisible} />
    </>
  );
}
