/**
 * ModernTourChrome — Premium RUDA Virtual Tour overlay chrome
 *
 * Renders:
 *   • Top-left: back button + RUDA brand
 *   • Bottom-left: floating scene information card
 *   • Bottom-center: prev / scene-name / next navigator
 */
import React, { useMemo } from 'react';
import RudaLogo from '../../../assets/RUDA L&M.png';
import { useNavigate } from 'react-router-dom';
import { TOUR_DATA, getSceneIndex } from '../data/tourData';
import { getTourThumbnailUrl } from '../utils/virtualTourAssets';

/* ── SVG icons ────────────────────────────────────────────────────────────── */
const ArrowLeft  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ArrowRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const BackArrow  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="m19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
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
    <div className="vt-brand" aria-label="RUDA Virtual Tour">
      <button
        type="button"
        className="vt-brand__back"
        onClick={onClick}
        aria-label="Back to RUDA"
        title="Back to RUDA"
      >
        <BackArrow />
      </button>

      <button
        type="button"
        className="vt-brand__identity"
        onClick={onClick}
        aria-label="RUDA home"
        title="Back to RUDA"
      >
        <img className="vt-brand__logo" src={RudaLogo} alt="RUDA" />
        <span className="vt-brand__text">
          <strong>RUDA</strong>
          <small>Virtual Tour</small>
        </span>
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


/* ── Main export ──────────────────────────────────────────────────────────── */
export default function ModernTourChrome({
  currentScene,
  onPrev,
  onNext,
  onOpenGallery,
}) {
  const navigate = useNavigate();

  const allScenes  = TOUR_DATA.scenes;
  const sceneIndex = useMemo(() => getSceneIndex(currentScene?.id), [currentScene?.id]);
  const sceneNum   = sceneIndex >= 0 ? sceneIndex + 1 : 1;




  if (!currentScene) return null;

  return (
    <>
      {/* ── Top bar ─────────────────────────────────── */}
      <div className="vt-topbar">
        <Brand onClick={() => navigate('/landing')} />
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
    </>
  );
}
