/**
 * VirtualTourViewer
 *
 * Root UI shell. Orchestrates all overlay components around the Marzipano canvas.
 * Does NOT touch panorama tile paths or Marzipano initialisation logic.
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { getSceneById } from '../data/tourData';
import useMarzipanoViewer from '../hooks/useMarzipanoViewer';
import TourLoadingScreen from './TourLoadingScreen';
import ViewerControls    from './ViewerControls';
import HotspotInfoPanel  from './HotspotInfoPanel';
import HelpOverlay, { shouldShowHelp } from './HelpOverlay';
import SceneGallery      from './SceneGallery';
import ModernTourChrome  from './ModernTourChrome';

/* ── Error banner ──────────────────────────────────────────────────────────── */
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="vt-fatal-error">
      <h2>Unable to Load Virtual Tour</h2>
      <p>{message}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="vt-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function VirtualTourViewer() {
  const panoRef = useRef(null);

  const [isLoading,        setIsLoading]        = useState(true);
  const [errorMessage,     setErrorMessage]      = useState('');
  const [galleryOpen,      setGalleryOpen]       = useState(false);
  const [showHelp,         setShowHelp]          = useState(false);
  const [activePanel,      setActivePanel]       = useState(null);   // info hotspot data
  const [transitionActive, setTransitionActive]  = useState(false);

  /* ── Marzipano hook ── */
  const viewer = useMarzipanoViewer({
    panoRef,
    onSceneChange: useCallback((sceneData) => {
      const p = new URLSearchParams(window.location.search);
      p.set('scene', sceneData.id);
      window.history.replaceState(null, '', `?${p.toString()}`);
      setActivePanel(null);
    }, []),
    onInfoHotspot:    useCallback((hs) => setActivePanel(hs), []),
    onLoadingChange:  useCallback((v) => setIsLoading(v), []),
    onError:          useCallback((msg) => { setErrorMessage(msg); setIsLoading(false); }, []),
    onTransitionChange: useCallback((v) => setTransitionActive(v), []),
  });

  const {
    currentSceneId,
    isAutorotating,
    isFullscreen,
    isGyroscopeEnabled,
    gyroMessage,
    switchSceneById,
    switchToNext,
    switchToPrev,
    toggleAutorotate,
    resetView,
    toggleFullscreen,
    toggleGyroscope,
    panUp,
    panDown,
    panLeft,
    panRight,
    zoomIn,
    zoomOut,
  } = viewer;

  const currentScene = useMemo(() => getSceneById(currentSceneId), [currentSceneId]);

  /* ── Show help once ── */
  useEffect(() => {
    if (shouldShowHelp()) {
      const t = setTimeout(() => setShowHelp(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  /* ── Open scene info panel ── */
  const openTourInfo = useCallback(() => {
    if (!currentScene) return;
    setActivePanel({
      title:    currentScene.name,
      text:     currentScene.description,
      category: currentScene.zone ?? 'Tour Location',
      status:   currentScene.status,
      date:     currentScene.captureDate,
    });
  }, [currentScene]);

  return (
    <>
      {/* Marzipano canvas */}
      <div
        id="pano"
        ref={panoRef}
        aria-label="360° panorama viewer"
      />

      {/* Scene transition flash */}
      <div
        className={`vt-scene-transition${transitionActive ? ' vt-scene-transition--active' : ''}`}
        aria-hidden="true"
      >
        <span className="vt-scene-transition__mark">RUDA</span>
      </div>

      {/* Loading screen */}
      <TourLoadingScreen isLoading={isLoading && !errorMessage} />

      {/* Error */}
      <ErrorBanner message={errorMessage} />

      {/* ── UI Shell ── */}
      <div className="vt-shell">

        {/* Top-left brand + scene card + scene nav + drag hint */}
        <ModernTourChrome
          currentScene={currentScene}
          onPrev={switchToPrev}
          onNext={switchToNext}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenHelp={() => setShowHelp(true)}
        />

        {/* Unified viewer toolbar + d-pad (top-right + bottom-right) */}
        <ViewerControls
          isAutorotating={isAutorotating}
          isFullscreen={isFullscreen}
          isGyroscopeEnabled={isGyroscopeEnabled}
          galleryOpen={galleryOpen}
          infoPanelOpen={!!activePanel}
          onPanUp={panUp}
          onPanDown={panDown}
          onPanLeft={panLeft}
          onPanRight={panRight}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetView}
          onToggleAutorotate={toggleAutorotate}
          onToggleFullscreen={toggleFullscreen}
          onToggleGyroscope={toggleGyroscope}
          onGallery={() => setGalleryOpen((v) => !v)}
          onInfo={openTourInfo}
        />

        {/* Gallery bottom-sheet */}
        <SceneGallery
          isOpen={galleryOpen}
          currentSceneId={currentSceneId}
          onClose={() => setGalleryOpen(false)}
          onSceneSelect={switchSceneById}
        />

        {/* Info panel */}
        <HotspotInfoPanel
          hotspot={activePanel}
          isOpen={!!activePanel}
          onClose={() => setActivePanel(null)}
        />

        {/* Help overlay */}
        <HelpOverlay
          visible={showHelp}
          onDismiss={() => setShowHelp(false)}
        />

        {/* Gyro / system toast */}
        <Toast message={gyroMessage} />

      </div>
    </>
  );
}
