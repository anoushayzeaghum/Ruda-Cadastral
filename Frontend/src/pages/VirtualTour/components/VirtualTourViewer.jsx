import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { getSceneById } from '../data/tourData';
import useMarzipanoViewer from '../hooks/useMarzipanoViewer';
import TourLoadingScreen from './TourLoadingScreen';
import ViewerControls from './ViewerControls';
import HotspotInfoPanel from './HotspotInfoPanel';
import HelpOverlay, { shouldShowHelp } from './HelpOverlay';
import SceneGallery from './SceneGallery';
import SideActions from './SideActions';

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div role="alert" className="vt-fatal-error"><h2>Unable to Load Virtual Tour</h2><p>{message}</p><button onClick={()=>window.location.reload()}>Retry</button></div>;
}

export default function VirtualTourViewer() {
  const panoRef = useRef(null);
  const [isLoading,setIsLoading] = useState(true);
  const [errorMessage,setErrorMessage] = useState('');
  const [galleryOpen,setGalleryOpen] = useState(false);
  const [showHelp,setShowHelp] = useState(false);
  const [activePanel,setActivePanel] = useState(null);
  const [transitionActive,setTransitionActive] = useState(false);

  const viewer = useMarzipanoViewer({
    panoRef,
    onSceneChange: useCallback((sceneData)=>{
      const p=new URLSearchParams(window.location.search); p.set('scene',sceneData.id); window.history.replaceState(null,'',`?${p.toString()}`);
      setActivePanel(null);
    },[]),
    onInfoHotspot: useCallback((hs)=>setActivePanel(hs),[]),
    onLoadingChange: useCallback((v)=>setIsLoading(v),[]),
    onError: useCallback((msg)=>{setErrorMessage(msg);setIsLoading(false);},[]),
    onTransitionChange: useCallback((v)=>setTransitionActive(v),[]),
  });

  const {
    currentSceneId,
    isAutorotating,
    isFullscreen,
    isGyroscopeEnabled,
    gyroMessage,
    switchSceneById,
    toggleAutorotate,
    resetView,
    toggleFullscreen,
    toggleGyroscope,
    panUp,
    panDown,
    panLeft,
    panRight,
    zoomIn,
    zoomOut
  } = viewer;
  const currentScene=useMemo(()=>getSceneById(currentSceneId),[currentSceneId]);

  useEffect(()=>{ if(shouldShowHelp()) setTimeout(()=>setShowHelp(true),900); },[]);

  const openTourInfo=()=>{
    if(!currentScene)return;
    setActivePanel({
      title: currentScene.name,
      text: currentScene.description,
      category: currentScene.zone || 'Tour Location',
      status: currentScene.status,
      date: currentScene.captureDate
    });
  };

  return <>
    <div id="pano" ref={panoRef} aria-label="360° panorama viewer" />
    <div className={`vt-scene-transition${transitionActive?' active':''}`} aria-hidden="true"><div className="vt-scene-transition__mark">RUDA</div></div>
    <TourLoadingScreen isLoading={isLoading&&!errorMessage}/>
    <ErrorBanner message={errorMessage}/>

    <div className="vt-shell">
      <div className="vt-top-right-control-stack">
        <SideActions
          galleryOpen={galleryOpen}
          onGallery={()=>setGalleryOpen(v=>!v)}
          gyroEnabled={isGyroscopeEnabled}
          onGyro={toggleGyroscope}
          onInfo={openTourInfo}
        />

        <ViewerControls
          onPanUp={panUp}
          onPanDown={panDown}
          onPanLeft={panLeft}
          onPanRight={panRight}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetView}
          onToggleAutorotate={toggleAutorotate}
          onToggleFullscreen={toggleFullscreen}
          isAutorotating={isAutorotating}
          isFullscreen={isFullscreen}
        />
      </div>

      <SceneGallery
        isOpen={galleryOpen}
        currentSceneId={currentSceneId}
        onClose={()=>setGalleryOpen(false)}
        onSceneSelect={switchSceneById}
      />

      {gyroMessage && <div className="vt-toast glass" role="status">{gyroMessage}</div>}

      <HotspotInfoPanel hotspot={activePanel} isOpen={!!activePanel} onClose={()=>setActivePanel(null)}/>
      <HelpOverlay visible={showHelp} onDismiss={()=>setShowHelp(false)}/>
    </div>
  </>;
}
