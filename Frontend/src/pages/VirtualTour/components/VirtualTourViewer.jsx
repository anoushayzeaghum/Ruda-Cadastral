/**
 * VirtualTourViewer — main orchestrator (no header bar)
 */
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { getSceneById }             from '../data/tourData';
import useMarzipanoViewer            from '../hooks/useMarzipanoViewer';

import TourLoadingScreen             from './TourLoadingScreen';
import SceneDrawer                   from './SceneDrawer';
import ViewerControls                from './ViewerControls';
import HotspotInfoPanel              from './HotspotInfoPanel';
import HelpOverlay, { shouldShowHelp } from './HelpOverlay';

/* ── Error banner ── */
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div role="alert" style={{
      position:'fixed', inset:0, zIndex:800,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:16, background:'rgba(10,26,20,0.92)',
      color:'var(--text-primary)', padding:32, textAlign:'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="22" stroke="#ef4444" strokeWidth="2" />
        <path d="M24 14v14M24 32v2" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#f87171' }}>
        Unable to Load Virtual Tour
      </h2>
      <p style={{ fontSize:14, color:'var(--text-secondary)', maxWidth:420 }}>
        {message}
      </p>
      <button onClick={() => window.location.reload()} style={{
        padding:'10px 28px', borderRadius:'var(--radius-full)',
        background:'#ef4444', color:'#fff',
        fontSize:14, fontWeight:600, border:'none', cursor:'pointer',
      }}>
        Retry
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function VirtualTourViewer() {
  const panoRef  = useRef(null);
  const shellRef = useRef(null);

  const [isLoading,    setIsLoading]    = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImmersive,  setIsImmersive]  = useState(false);
  const [showHelp,     setShowHelp]     = useState(false);
  const [activePanel,  setActivePanel]  = useState(null);

  const viewer = useMarzipanoViewer({
    panoRef,
    onSceneChange: useCallback((sceneData) => {
      const p = new URLSearchParams(window.location.search);
      p.set('scene', sceneData.id);
      window.history.replaceState(null, '', `?${p.toString()}`);
    }, []),
    onInfoHotspot:   useCallback((hs)  => setActivePanel(hs), []),
    onLoadingChange: useCallback((v)   => setIsLoading(v), []),
    onError:         useCallback((msg) => { setErrorMessage(msg); setIsLoading(false); }, []),
  });

  const {
    currentSceneId,
    isAutorotating,
    isFullscreen,
    switchSceneById,
    toggleAutorotate,
    resetView,
    toggleFullscreen,
    viewUpRef, viewDownRef, viewLeftRef, viewRightRef, viewInRef, viewOutRef,
  } = viewer;

  const currentScene = useMemo(() => getSceneById(currentSceneId), [currentSceneId]);

  /* Show help on first visit */
  useEffect(() => {
    if (shouldShowHelp()) setTimeout(() => setShowHelp(true), 1200);
  }, []);

  /* Escape exits immersive */
  useEffect(() => {
    if (!isImmersive) return;
    const h = (e) => { if (e.key === 'Escape') setIsImmersive(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isImmersive]);

  useEffect(() => {
    shellRef.current?.classList.toggle('vt-immersive', isImmersive);
  }, [isImmersive]);

  /* Open drawer on desktop on mount */
  useEffect(() => {
    const mobile = window.matchMedia('(max-width:600px),(max-height:500px)').matches;
    if (!mobile) setIsDrawerOpen(true);
  }, []);

  const chromeHidden = isImmersive;

  return (
    <>
      {/* Marzipano canvas */}
      <div id="pano" ref={panoRef} aria-label="360° panorama viewer" />

      <TourLoadingScreen isLoading={isLoading && !errorMessage} />
      <ErrorBanner message={errorMessage} />

      <div ref={shellRef} className="vt-shell">

        {/* Scene drawer — slides in from the left, starts at very top */}
        <SceneDrawer
          isOpen={isDrawerOpen && !chromeHidden}
          currentSceneId={currentSceneId}
          onSceneSelect={switchSceneById}
          onClose={() => setIsDrawerOpen(false)}
        />

        {/* Floating controls bottom-right (includes sidebar + fullscreen btns) */}
        <ViewerControls
          viewUpRef={viewUpRef}
          viewDownRef={viewDownRef}
          viewLeftRef={viewLeftRef}
          viewRightRef={viewRightRef}
          viewInRef={viewInRef}
          viewOutRef={viewOutRef}
          onReset={resetView}
          onToggleAutorotate={toggleAutorotate}
          onToggleFullscreen={toggleFullscreen}
          onToggleSidebar={() => setIsDrawerOpen((v) => !v)}
          isAutorotating={isAutorotating}
          isFullscreen={isFullscreen}
          isSidebarOpen={isDrawerOpen}
          hidden={chromeHidden}
        />

        {/* Info hotspot panel */}
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
      </div>
    </>
  );
}
