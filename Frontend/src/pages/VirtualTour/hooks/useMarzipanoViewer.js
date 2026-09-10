import { useEffect, useRef, useCallback, useState } from 'react';
import { TOUR_DATA, getSceneIndex } from '../data/tourData';
import { getTourTileRoot, getTourThumbnailUrl, getTourPreviewUrl } from '../utils/virtualTourAssets';

const blockViewerEvents = (element) => {
  ['touchstart','touchmove','touchend','touchcancel','wheel','mousewheel'].forEach((name) =>
    element.addEventListener(name, (e) => e.stopPropagation())
  );
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const shortestAngleDeg = (a, b) => {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
};

export default function useMarzipanoViewer({
  panoRef,
  onSceneChange,
  onInfoHotspot,
  onLoadingChange,
  onError,
  onTransitionChange,
}) {
  const runtimeRef = useRef(null);
  const [currentSceneId, setCurrentSceneId] = useState(TOUR_DATA.scenes[0].id);
  const [isAutorotating, setIsAutorotating] = useState(TOUR_DATA.settings.autorotate.enabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGyroscopeEnabled, setIsGyroscopeEnabled] = useState(false);
  const [gyroMessage, setGyroMessage] = useState('');

  const viewUpRef = useRef(null);
  const viewDownRef = useRef(null);
  const viewLeftRef = useRef(null);
  const viewRightRef = useRef(null);
  const viewInRef = useRef(null);
  const viewOutRef = useRef(null);

  useEffect(() => {
    const Marzipano = window.Marzipano;
    if (!Marzipano) {
      onError?.('Marzipano library did not load. Check /public/virtual-tour/vendor/marzipano.js.');
      return;
    }
    if (!panoRef.current) return;

    const body = document.body;
    body.classList.add(TOUR_DATA.scenes.length > 1 ? 'multiple-scenes' : 'single-scene', 'no-touch');
    const mq = window.matchMedia?.('(max-width:500px),(max-height:500px)');
    const applyMode = () => {
      const mobile = !!mq?.matches;
      body.classList.toggle('mobile', mobile);
      body.classList.toggle('desktop', !mobile);
    };
    applyMode();
    mq?.addEventListener?.('change', applyMode);
    const onTouch = () => { body.classList.remove('no-touch'); body.classList.add('touch'); };
    window.addEventListener('touchstart', onTouch, { once:true });

    const viewer = new Marzipano.Viewer(panoRef.current, {
      controls: { mouseViewMode: TOUR_DATA.settings.mouseViewMode },
    });

    const autorotateMovement = Marzipano.autorotate({
      yawSpeed: TOUR_DATA.settings.autorotate.yawSpeed,
      targetPitch: 0,
      targetFov: Math.PI / 2,
    });
    let autorotateEnabled = TOUR_DATA.settings.autorotate.enabled;
    const startAutorotate = () => {
      if (!autorotateEnabled || runtimeRef.current?.gyro?.enabled) return;
      viewer.startMovement(autorotateMovement);
      viewer.setIdleMovement(TOUR_DATA.settings.autorotate.idleDelay, autorotateMovement);
      setIsAutorotating(true);
    };
    const stopAutorotate = () => {
      viewer.stopMovement();
      viewer.setIdleMovement(Infinity);
      setIsAutorotating(false);
    };

    let bearingRaf = null;
    const updateBearing = () => {
      const cur = runtimeRef.current?.currentScene;
      if (cur) {
        const deg = ((cur.view.yaw() + (cur.data.northOffset ?? 0)) * 180 / Math.PI + 360) % 360;
        setBearing(Math.round(deg));
      }
      bearingRaf = requestAnimationFrame(updateBearing);
    };

    const findSceneById = (id) => runtimeRef.current?.scenes?.find((s) => s.data.id === id) ?? null;
    const findSceneDataById = (id) => TOUR_DATA.scenes.find((s) => s.id === id) ?? null;

    const closeActiveHotspot = () => {
      const rt = runtimeRef.current;
      if (rt?.activeHotspotEl) rt.activeHotspotEl.classList.remove('is-open');
      if (rt) rt.activeHotspotEl = null;
    };

    const createLinkHotspotElement = (hotspot) => {
      const targetData = findSceneDataById(hotspot.target);
      const targetName = targetData?.name ?? hotspot.target;
      const wrapper = document.createElement('div');
      wrapper.className = 'hotspot link-hotspot ruda-link-hotspot';
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-label', `Preview ${targetName}`);

      const pulse1 = document.createElement('div'); pulse1.className = 'ruda-link-hotspot__pulse ruda-link-hotspot__pulse--one';
      const pulse2 = document.createElement('div'); pulse2.className = 'ruda-link-hotspot__pulse ruda-link-hotspot__pulse--two';
      const arrow = document.createElement('div');
      arrow.className = 'ruda-link-hotspot__arrow';
      arrow.style.transform = `rotate(${hotspot.rotation || 0}rad)`;
      arrow.innerHTML = `<svg width="58" height="58" viewBox="0 0 58 58" fill="none" aria-hidden="true"><circle cx="29" cy="29" r="24" fill="rgba(3,30,22,.28)" stroke="rgba(255,255,255,.9)" stroke-width="2"/><path d="M18 32 L29 23 L40 32" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 38 L29 29 L40 38" stroke="rgba(255,255,255,.78)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

      const card = document.createElement('div');
      card.className = 'ruda-destination-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Go to ${targetName}`);
      const img = document.createElement('img');
      img.className = 'ruda-destination-card__image';
      img.src = getTourThumbnailUrl(hotspot.target);
      img.alt = '';
      img.onerror = () => { if (!img.dataset.fallback) { img.dataset.fallback='1'; img.src=getTourPreviewUrl(hotspot.target); } };
      const copy = document.createElement('div'); copy.className = 'ruda-destination-card__copy';
      copy.innerHTML = `<span class="ruda-destination-card__eyebrow">NEXT LOCATION</span><strong>${targetName}</strong>`;
      card.append(copy, img);

      const openPreview = (e) => {
        e?.stopPropagation?.();
        const rt = runtimeRef.current;
        if (rt?.activeHotspotEl && rt.activeHotspotEl !== wrapper) rt.activeHotspotEl.classList.remove('is-open');
        wrapper.classList.toggle('is-open');
        if (rt) rt.activeHotspotEl = wrapper.classList.contains('is-open') ? wrapper : null;
      };
      const navigate = (e) => {
        e?.stopPropagation?.();
        const target = findSceneById(hotspot.target);
        if (target) runtimeRef.current?.switchScene(target);
      };
      wrapper.addEventListener('click', openPreview);
      wrapper.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openPreview(e); } });
      card.addEventListener('click', navigate);
      card.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); navigate(e); } });
      wrapper.append(card, pulse1, pulse2, arrow);
      blockViewerEvents(wrapper);
      return wrapper;
    };

    const createInfoHotspotElement = (hotspot) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'hotspot info-hotspot ruda-info-hotspot';
      wrapper.setAttribute('role','button'); wrapper.setAttribute('tabindex','0'); wrapper.setAttribute('aria-label',`Info: ${hotspot.title}`);
      wrapper.innerHTML = `<div class="ruda-info-hotspot__btn"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><circle cx="18" cy="18" r="16" fill="rgba(22,132,91,.88)" stroke="rgba(255,255,255,.75)" stroke-width="1.5"/><text x="18" y="23" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="#fff">i</text></svg><div class="ruda-info-hotspot__pulse"></div></div><div class="ruda-info-hotspot__label">${hotspot.title}</div>`;
      const open = (e) => { e?.stopPropagation?.(); onInfoHotspot?.(hotspot); };
      wrapper.addEventListener('click', open);
      wrapper.addEventListener('keydown', (e) => { if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);} });
      blockViewerEvents(wrapper);
      return wrapper;
    };

    const scenes = TOUR_DATA.scenes.map((data) => {
      const tileRoot = getTourTileRoot(data.id);
      const source = Marzipano.ImageUrlSource.fromString(`${tileRoot}/{z}/{f}/{y}/{x}.jpg`, { cubeMapPreviewUrl:`${tileRoot}/preview.jpg` });
      const geometry = new Marzipano.CubeGeometry(data.levels);
      const limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
      const view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);
      const scene = viewer.createScene({ source, geometry, view, pinFirstLevel:true });
      data.linkHotspots.forEach((hs) => scene.hotspotContainer().createHotspot(createLinkHotspotElement(hs), { yaw:hs.yaw, pitch:hs.pitch }));
      data.infoHotspots.forEach((hs) => scene.hotspotContainer().createHotspot(createInfoHotspotElement(hs), { yaw:hs.yaw, pitch:hs.pitch }));
      return { data, scene, view };
    });

    let transitionTimers = [];
    const clearTransitionTimers = () => { transitionTimers.forEach(clearTimeout); transitionTimers=[]; };
    const switchScene = (sceneObj, opts={}) => {
      if (!sceneObj || runtimeRef.current?.transitioning) return;
      closeActiveHotspot();
      stopAutorotate();
      const duration = opts.transitionDuration ?? 760;
      const perform = () => {
        sceneObj.view.setParameters(sceneObj.data.initialViewParameters);
        sceneObj.scene.switchTo({ transitionDuration: duration > 0 ? 560 : 0 });
        if (runtimeRef.current) runtimeRef.current.currentScene = sceneObj;
        setCurrentSceneId(sceneObj.data.id);
        onSceneChange?.(sceneObj.data);
      };
      if (duration <= 0) { perform(); startAutorotate(); return; }
      if (runtimeRef.current) runtimeRef.current.transitioning = true;
      setIsTransitioning(true); onTransitionChange?.(true);
      transitionTimers.push(setTimeout(perform, 150));
      transitionTimers.push(setTimeout(() => {
        if (runtimeRef.current) runtimeRef.current.transitioning = false;
        setIsTransitioning(false); onTransitionChange?.(false); startAutorotate();
      }, duration));
    };

    // Panorama controls.
    // Use Marzipano's native RectilinearView offset methods instead of
    // rebuilding all parameters manually. These methods apply the active
    // scene limiter correctly and immediately notify the renderer.
    const getActiveView = () => runtimeRef.current?.currentScene?.view ?? null;

    const prepareManualControl = () => {
      // A running movement can immediately overwrite pitch/FOV changes.
      // Stop it before every manual pan/zoom action.
      stopAutorotate();
    };

    const panLeft = () => {
      const view = getActiveView();
      if (!view) return;
      prepareManualControl();
      view.offsetYaw(-10 * Math.PI / 180);
    };

    const panRight = () => {
      const view = getActiveView();
      if (!view) return;
      prepareManualControl();
      view.offsetYaw(10 * Math.PI / 180);
    };

    const panUp = () => {
      const view = getActiveView();
      if (!view) return;
      prepareManualControl();

      // Match the visible image movement expected by the UI:
      // pressing UP moves the panorama/view upward on screen.
      view.offsetPitch(-8 * Math.PI / 180);
    };

    const panDown = () => {
      const view = getActiveView();
      if (!view) return;
      prepareManualControl();

      // pressing DOWN moves the panorama/view downward on screen.
      view.offsetPitch(8 * Math.PI / 180);
    };

    const zoomIn = () => {
      const view = getActiveView();
      if (!view) return;
      prepareManualControl();
      // Smaller FOV = zoom in.
      view.offsetFov(-8 * Math.PI / 180);
    };

    const zoomOut = () => {
      const view = getActiveView();
      if (!view) return;
      prepareManualControl();
      // Larger FOV = zoom out.
      view.offsetFov(8 * Math.PI / 180);
    };

    // Native fullscreen API. Target the entire integrated Virtual Tour page.
    const getFullscreenElement = () =>
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null;

    const getFullscreenTarget = () =>
      panoRef.current?.closest?.('.ruda-virtual-tour-page') ||
      panoRef.current?.parentElement ||
      panoRef.current;

    const requestFullscreen = async (element) => {
      if (!element) throw new Error('Fullscreen target is unavailable.');
      if (element.requestFullscreen) return element.requestFullscreen();
      if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
      if (element.msRequestFullscreen) return element.msRequestFullscreen();
      throw new Error('Fullscreen is not supported by this browser.');
    };

    const exitFullscreen = async () => {
      if (document.exitFullscreen) return document.exitFullscreen();
      if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
      if (document.msExitFullscreen) return document.msExitFullscreen();
    };

    const toggleFullscreenInternal = async () => {
      try {
        if (getFullscreenElement()) {
          await exitFullscreen();
        } else {
          await requestFullscreen(getFullscreenTarget());
        }
      } catch (error) {
        console.error('Virtual Tour fullscreen error:', error);
        setGyroMessage('Fullscreen could not be started in this browser.');
      }
    };

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
      // Marzipano normally handles resize, but dispatching resize keeps all
      // browser engines in sync after entering/exiting fullscreen.
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    const gyro = {
      enabled: false,
      listener: null,
      eventName: null,
      baseline: null,
      startYaw: 0,
      startPitch: 0,
      smoothedYaw: 0,
      smoothedPitch: 0,
      receivedEvent: false,
      noEventTimer: null,
    };

    const getScreenAngle = () => {
      const angle =
        window.screen?.orientation?.angle ??
        window.orientation ??
        0;
      return Number(angle) || 0;
    };

    const disableGyroscopeInternal = () => {
      if (gyro.listener && gyro.eventName) {
        window.removeEventListener(gyro.eventName, gyro.listener, true);
      }
      if (gyro.noEventTimer) clearTimeout(gyro.noEventTimer);

      gyro.enabled = false;
      gyro.listener = null;
      gyro.eventName = null;
      gyro.baseline = null;
      gyro.receivedEvent = false;
      gyro.noEventTimer = null;

      setIsGyroscopeEnabled(false);
    };

    const enableGyroscopeInternal = () => {
      const current = runtimeRef.current?.currentScene;
      if (!current) return;

      stopAutorotate();

      gyro.enabled = true;
      gyro.baseline = null;
      gyro.startYaw = current.view.yaw();
      gyro.startPitch = current.view.pitch();
      gyro.smoothedYaw = gyro.startYaw;
      gyro.smoothedPitch = gyro.startPitch;
      gyro.receivedEvent = false;

      const eventName =
        'ondeviceorientationabsolute' in window
          ? 'deviceorientationabsolute'
          : 'deviceorientation';

      gyro.eventName = eventName;

      gyro.listener = (event) => {
        if (!gyro.enabled) return;

        const alpha = Number(event.alpha);
        const beta = Number(event.beta);
        const gamma = Number(event.gamma);

        if (!Number.isFinite(alpha) || !Number.isFinite(beta)) return;

        gyro.receivedEvent = true;

        // Always use the currently active scene so gyroscope still works
        // after a hotspot/gallery scene switch.
        const active = runtimeRef.current?.currentScene;
        if (!active) return;

        const screenAngle = getScreenAngle();

        if (!gyro.baseline) {
          gyro.baseline = {
            alpha,
            beta,
            gamma: Number.isFinite(gamma) ? gamma : 0,
            screenAngle,
          };
          gyro.startYaw = active.view.yaw();
          gyro.startPitch = active.view.pitch();
          gyro.smoothedYaw = gyro.startYaw;
          gyro.smoothedPitch = gyro.startPitch;
          setGyroMessage('');
          return;
        }

        const alphaDelta =
          shortestAngleDeg(alpha, gyro.baseline.alpha) * Math.PI / 180;
        const betaDelta =
          shortestAngleDeg(beta, gyro.baseline.beta) * Math.PI / 180;

        let targetYaw = gyro.startYaw - alphaDelta;
        let targetPitch = gyro.startPitch + betaDelta;

        // Landscape compensation: gamma becomes a better vertical control.
        if (Math.abs(screenAngle) === 90 && Number.isFinite(gamma)) {
          const gammaDelta =
            shortestAngleDeg(gamma, gyro.baseline.gamma) * Math.PI / 180;
          targetPitch = gyro.startPitch - gammaDelta;
        }

        targetPitch = clamp(
          targetPitch,
          -Math.PI / 2 + 0.08,
          Math.PI / 2 - 0.08
        );

        const currentYawDeg = gyro.smoothedYaw * 180 / Math.PI;
        const targetYawDeg = targetYaw * 180 / Math.PI;

        gyro.smoothedYaw +=
          shortestAngleDeg(targetYawDeg, currentYawDeg) *
          Math.PI / 180 *
          0.18;

        gyro.smoothedPitch +=
          (targetPitch - gyro.smoothedPitch) * 0.18;

        active.view.setParameters({
          yaw: gyro.smoothedYaw,
          pitch: gyro.smoothedPitch,
          fov: active.view.fov(),
        });
      };

      window.addEventListener(eventName, gyro.listener, true);
      setIsGyroscopeEnabled(true);
      setGyroMessage('Gyroscope enabled');

      gyro.noEventTimer = setTimeout(() => {
        if (gyro.enabled && !gyro.receivedEvent) {
          setGyroMessage(
            window.isSecureContext
              ? 'No motion data received. Use a phone/tablet with motion sensors enabled.'
              : 'Gyroscope requires HTTPS on mobile devices.'
          );
        }
      }, 2500);
    };

    const onPanoClick = (e) => { if (!e.target.closest?.('.ruda-link-hotspot')) closeActiveHotspot(); };
    panoRef.current.addEventListener('click', onPanoClick);

    const onKeyDown=(e)=>{
      const tag=document.activeElement?.tagName; if(tag==='INPUT'||tag==='TEXTAREA')return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        runtimeRef.current?.toggleFullscreenInternal?.();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const c = runtimeRef.current?.currentScene;
        c?.view.setParameters(c.data.initialViewParameters);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        runtimeRef.current?.panLeft?.();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        runtimeRef.current?.panRight?.();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        runtimeRef.current?.panUp?.();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        runtimeRef.current?.panDown?.();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        runtimeRef.current?.zoomIn?.();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        runtimeRef.current?.zoomOut?.();
      } else if (e.key === ' ') {
        e.preventDefault();
        runtimeRef.current?.toggleAutorotate?.();
      } else if (e.key === 'Escape') {
        closeActiveHotspot();
      }
    };
    window.addEventListener('keydown',onKeyDown);

    runtimeRef.current = {
      viewer,
      scenes,
      currentScene: scenes[0],
      switchScene,
      startAutorotate,
      stopAutorotate,
      gyro,
      transitioning: false,
      activeHotspotEl: null,
      toggleFullscreenInternal,
      panLeft,
      panRight,
      panUp,
      panDown,
      zoomIn,
      zoomOut,
      get autorotateEnabled() { return autorotateEnabled; },
      _setAutorotateEnabled(v) { autorotateEnabled = v; },
      disableGyroscopeInternal,
      enableGyroscopeInternal
    };

    const initialSceneId=new URLSearchParams(window.location.search).get('scene');
    const initialScene=(initialSceneId&&scenes.find((s)=>s.data.id===initialSceneId))||scenes[0];
    onLoadingChange?.(true); switchScene(initialScene,{transitionDuration:0});
    const onFirstRender=()=>{onLoadingChange?.(false);bearingRaf=requestAnimationFrame(updateBearing);};
    viewer.addEventListener('renderComplete',onFirstRender,{once:true});
    const loadFallback=setTimeout(()=>onLoadingChange?.(false),4000);

    return()=>{
      clearTransitionTimers(); cancelAnimationFrame(bearingRaf); clearTimeout(loadFallback); disableGyroscopeInternal(); stopAutorotate();
      window.removeEventListener('keydown', onKeyDown);
      panoRef.current?.removeEventListener('click', onPanoClick);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      mq?.removeEventListener?.('change', applyMode);
      body.classList.remove('multiple-scenes','single-scene','mobile','desktop','touch','no-touch'); runtimeRef.current=null; if(panoRef.current)panoRef.current.innerHTML='';
    };
  }, []);

  const switchSceneById=useCallback((id)=>{const t=runtimeRef.current?.scenes?.find((s)=>s.data.id===id);if(t)runtimeRef.current.switchScene(t);},[]);
  const switchToNext=useCallback(()=>{const rt=runtimeRef.current;if(!rt)return;const idx=getSceneIndex(rt.currentScene?.data?.id);rt.switchScene(rt.scenes[(idx+1)%rt.scenes.length]);},[]);
  const switchToPrev=useCallback(()=>{const rt=runtimeRef.current;if(!rt)return;const idx=getSceneIndex(rt.currentScene?.data?.id);rt.switchScene(rt.scenes[(idx-1+rt.scenes.length)%rt.scenes.length]);},[]);
  const toggleAutorotate=useCallback(()=>{const rt=runtimeRef.current;if(!rt)return;if(rt.autorotateEnabled){rt.stopAutorotate();rt._setAutorotateEnabled(false);}else{rt._setAutorotateEnabled(true);rt.startAutorotate();}},[]);
  const resetView = useCallback(() => {
    const rt = runtimeRef.current;
    const current = rt?.currentScene;
    if (!current) return;
    rt.stopAutorotate?.();
    current.view.setParameters(current.data.initialViewParameters);
  }, []);
  const toggleFullscreen = useCallback(() => {
    runtimeRef.current?.toggleFullscreenInternal?.();
  }, []);

  const panLeft = useCallback(() => runtimeRef.current?.panLeft?.(), []);
  const panRight = useCallback(() => runtimeRef.current?.panRight?.(), []);
  const panUp = useCallback(() => runtimeRef.current?.panUp?.(), []);
  const panDown = useCallback(() => runtimeRef.current?.panDown?.(), []);
  const zoomIn = useCallback(() => runtimeRef.current?.zoomIn?.(), []);
  const zoomOut = useCallback(() => runtimeRef.current?.zoomOut?.(), []);

  const toggleGyroscope=useCallback(async()=>{
    const rt=runtimeRef.current;
    if(!rt)return;
    if(rt.gyro?.enabled){rt.disableGyroscopeInternal();setGyroMessage('');return;}
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setGyroMessage('Gyroscope is available on supported phones and tablets.');
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setGyroMessage('Gyroscope requires HTTPS on mobile devices.');
      return;
    }

    try {
      if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        const result = await window.DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          setGyroMessage('Motion permission was not granted.');
          return;
        }
      }

      rt.enableGyroscopeInternal();
    } catch (err) {
      console.error('Gyroscope error:', err);
      setGyroMessage('Unable to start gyroscope. Check motion-sensor permissions.');
    }
  },[]);

  return {
    currentSceneId,
    isAutorotating,
    isFullscreen,
    bearing,
    isTransitioning,
    isGyroscopeEnabled,
    gyroMessage,
    switchSceneById,
    switchToNext,
    switchToPrev,
    toggleAutorotate,
    resetView,
    toggleFullscreen,
    toggleGyroscope,
    panLeft,
    panRight,
    panUp,
    panDown,
    zoomIn,
    zoomOut,
    runtimeRef
  };
}
