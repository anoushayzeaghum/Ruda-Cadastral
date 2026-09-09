/**
 * useMarzipanoViewer
 *
 * Encapsulates the entire Marzipano lifecycle:
 *   - viewer creation
 *   - scene / geometry / source creation
 *   - link hotspot DOM elements (with modern styling hook)
 *   - info hotspot DOM elements (with modern panel callback)
 *   - autorotation start / stop / toggle
 *   - view controls (pan / zoom) via ElementPressControlMethod
 *   - fullscreen via screenfull
 *   - scene switching with fade overlay
 *   - cleanup on unmount
 *
 * The hook returns a `controls` object that React UI components use to
 * drive the viewer imperatively without touching Marzipano directly.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { TOUR_DATA, getSceneIndex } from '../data/tourData';
import { getTourTileRoot } from '../utils/virtualTourAssets';

// ---------------------------------------------------------------------------
// Stop touch / scroll events from propagating into the Marzipano viewer
// when the user is interacting with a hotspot overlay.
// ---------------------------------------------------------------------------
const blockViewerEvents = (element) => {
  [
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
    'wheel',
    'mousewheel',
  ].forEach((evName) =>
    element.addEventListener(evName, (e) => e.stopPropagation())
  );
};

// ---------------------------------------------------------------------------
export default function useMarzipanoViewer({
  panoRef,           // ref to the #pano container div
  onSceneChange,     // (sceneData) => void  — called after every scene switch
  onInfoHotspot,     // (hotspotData) => void — called when user clicks info ⓘ
  onLoadingChange,   // (isLoading: bool) => void
  onError,           // (message: string) => void
}) {
  // Holds all Marzipano runtime objects so React renders never reset them.
  const runtimeRef = useRef(null);

  // Exposed reactive state (minimal — kept outside Marzipano for React UI)
  const [currentSceneId, setCurrentSceneId] = useState(
    TOUR_DATA.scenes[0].id
  );
  const [isAutorotating, setIsAutorotating] = useState(
    TOUR_DATA.settings.autorotate.enabled
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bearing, setBearing] = useState(0); // current yaw in degrees (0–360) for compass

  // Refs for the viewer's pan/zoom control buttons — exposed so
  // ViewerControls.jsx can attach its DOM elements via ref callbacks.
  const viewUpRef    = useRef(null);
  const viewDownRef  = useRef(null);
  const viewLeftRef  = useRef(null);
  const viewRightRef = useRef(null);
  const viewInRef    = useRef(null);
  const viewOutRef   = useRef(null);

  // ─── Main effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const Marzipano = window.Marzipano;
    const screenfull = window.screenfull;

    if (!Marzipano) {
      onError?.('Marzipano library did not load. Check /public/virtual-tour/vendor/marzipano.js.');
      return;
    }
    if (!panoRef.current) return;

    // ── Body classes (used by legacy CSS + mobile detection) ──────────────
    const body = document.body;
    body.classList.add(
      TOUR_DATA.scenes.length > 1 ? 'multiple-scenes' : 'single-scene'
    );
    body.classList.add('no-touch');

    const mq = window.matchMedia?.('(max-width: 500px), (max-height: 500px)');
    const applyMode = () => {
      const mobile = !!mq?.matches;
      body.classList.toggle('mobile', mobile);
      body.classList.toggle('desktop', !mobile);
    };
    applyMode();
    mq?.addEventListener?.('change', applyMode);

    const onTouch = () => {
      body.classList.remove('no-touch');
      body.classList.add('touch');
    };
    window.addEventListener('touchstart', onTouch, { once: true });

    // ── Viewer ────────────────────────────────────────────────────────────
    const viewer = new Marzipano.Viewer(panoRef.current, {
      controls: { mouseViewMode: TOUR_DATA.settings.mouseViewMode },
    });

    // ── Autorotation ──────────────────────────────────────────────────────
    const autorotateMovement = Marzipano.autorotate({
      yawSpeed: TOUR_DATA.settings.autorotate.yawSpeed,
      targetPitch: 0,
      targetFov: Math.PI / 2,
    });

    let autorotateEnabled = TOUR_DATA.settings.autorotate.enabled;

    const startAutorotate = () => {
      if (!autorotateEnabled) return;
      viewer.startMovement(autorotateMovement);
      viewer.setIdleMovement(
        TOUR_DATA.settings.autorotate.idleDelay,
        autorotateMovement
      );
      setIsAutorotating(true);
    };

    const stopAutorotate = () => {
      viewer.stopMovement();
      viewer.setIdleMovement(Infinity);
      setIsAutorotating(false);
    };

    // ── Compass / bearing update ──────────────────────────────────────────
    let bearingRaf = null;
    const updateBearing = () => {
      if (!runtimeRef.current) return;
      const { currentScene } = runtimeRef.current;
      if (!currentScene) return;
      const yawRad = currentScene.view.yaw();
      const northOffset = currentScene.data.northOffset ?? 0;
      const deg = ((yawRad + northOffset) * (180 / Math.PI) + 360) % 360;
      setBearing(Math.round(deg));
      bearingRaf = requestAnimationFrame(updateBearing);
    };

    // ── Hotspot factories ─────────────────────────────────────────────────

    const findSceneById = (id) =>
      runtimeRef.current?.scenes?.find((s) => s.data.id === id) ?? null;

    const findSceneDataById = (id) =>
      TOUR_DATA.scenes.find((s) => s.id === id) ?? null;

    // Modern link hotspot ──────────────────────────────────────────────────
    const createLinkHotspotElement = (hotspot) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'hotspot link-hotspot ruda-link-hotspot';

      // Arrow container
      const arrow = document.createElement('div');
      arrow.className = 'ruda-link-hotspot__arrow';
      arrow.style.transform = `rotate(${hotspot.rotation}rad)`;
      arrow.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
             xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="24" cy="24" r="22" fill="rgba(22,132,91,0.18)"
                  stroke="rgba(22,132,91,0.7)" stroke-width="1.5"/>
          <path d="M24 14 L32 30 L24 26 L16 30 Z"
                fill="rgba(22,132,91,0.9)" stroke="#fff" stroke-width="1"/>
        </svg>`;

      // Pulse ring
      const pulse = document.createElement('div');
      pulse.className = 'ruda-link-hotspot__pulse';

      // Tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'hotspot-tooltip link-hotspot-tooltip ruda-link-hotspot__tooltip';
      const targetName =
        findSceneDataById(hotspot.target)?.name ?? hotspot.target;
      tooltip.textContent = `Go to ${targetName}`;
      tooltip.setAttribute('role', 'tooltip');

      wrapper.append(pulse, arrow, tooltip);

      wrapper.addEventListener('click', () => {
        const target = findSceneById(hotspot.target);
        if (target) switchScene(target);
      });
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('aria-label', `Navigate to ${targetName}`);
      wrapper.setAttribute('tabindex', '0');
      wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const target = findSceneById(hotspot.target);
          if (target) switchScene(target);
        }
      });

      blockViewerEvents(wrapper);
      return wrapper;
    };

    // Modern info hotspot ─────────────────────────────────────────────────
    const createInfoHotspotElement = (hotspot) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'hotspot info-hotspot ruda-info-hotspot';
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('aria-label', `Info: ${hotspot.title}`);
      wrapper.setAttribute('tabindex', '0');

      wrapper.innerHTML = `
        <div class="ruda-info-hotspot__btn">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="rgba(22,132,91,0.85)"
                    stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
            <text x="18" y="23" text-anchor="middle"
                  font-family="sans-serif" font-size="16"
                  font-weight="bold" fill="#fff">i</text>
          </svg>
          <div class="ruda-info-hotspot__pulse"></div>
        </div>
        <div class="ruda-info-hotspot__label">${hotspot.title}</div>`;

      const open = () => {
        onInfoHotspot?.(hotspot);
      };
      wrapper.addEventListener('click', open);
      wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });

      blockViewerEvents(wrapper);
      return wrapper;
    };

    // ── Scene creation ────────────────────────────────────────────────────
    const scenes = TOUR_DATA.scenes.map((data) => {
      const tileRoot = getTourTileRoot(data.id);

      const source = Marzipano.ImageUrlSource.fromString(
        `${tileRoot}/{z}/{f}/{y}/{x}.jpg`,
        { cubeMapPreviewUrl: `${tileRoot}/preview.jpg` }
      );

      const geometry = new Marzipano.CubeGeometry(data.levels);

      const limiter = Marzipano.RectilinearView.limit.traditional(
        data.faceSize,
        100 * Math.PI / 180,
        120 * Math.PI / 180
      );

      const view = new Marzipano.RectilinearView(
        data.initialViewParameters,
        limiter
      );

      const scene = viewer.createScene({
        source,
        geometry,
        view,
        pinFirstLevel: true,
      });

      data.linkHotspots.forEach((hs) => {
        scene
          .hotspotContainer()
          .createHotspot(createLinkHotspotElement(hs), {
            yaw: hs.yaw,
            pitch: hs.pitch,
          });
      });

      data.infoHotspots.forEach((hs) => {
        scene
          .hotspotContainer()
          .createHotspot(createInfoHotspotElement(hs), {
            yaw: hs.yaw,
            pitch: hs.pitch,
          });
      });

      return { data, scene, view };
    });

    // ── Scene switching ───────────────────────────────────────────────────
    // Exposed via runtimeRef so both internal and external callers use same fn.
    const switchScene = (sceneObj, opts = {}) => {
      if (!sceneObj) return;
      stopAutorotate();

      const duration = opts.transitionDuration ?? 700;

      sceneObj.view.setParameters(sceneObj.data.initialViewParameters);
      sceneObj.scene.switchTo({ transitionDuration: duration });

      runtimeRef.current.currentScene = sceneObj;
      setCurrentSceneId(sceneObj.data.id);
      onSceneChange?.(sceneObj.data);

      startAutorotate();
    };

    // ── View controls (pan / zoom buttons) ───────────────────────────────
    const velocity = 0.7;
    const friction = 3;
    const ctls = viewer.controls();

    const registerBtn = (ref, methodId, axis, sign) => {
      if (!ref.current) return;
      ctls.registerMethod(
        methodId,
        new Marzipano.ElementPressControlMethod(
          ref.current,
          axis,
          sign * velocity,
          friction
        ),
        true
      );
    };

    registerBtn(viewUpRef,    'upElement',    'y',    -1);
    registerBtn(viewDownRef,  'downElement',  'y',     1);
    registerBtn(viewLeftRef,  'leftElement',  'x',    -1);
    registerBtn(viewRightRef, 'rightElement', 'x',     1);
    registerBtn(viewInRef,    'inElement',    'zoom', -1);
    registerBtn(viewOutRef,   'outElement',   'zoom',  1);

    // ── Fullscreen ────────────────────────────────────────────────────────
    let removeFullscreenListener = null;
    if (screenfull?.isEnabled) {
      const onFsChange = () => setIsFullscreen(!!screenfull.isFullscreen);
      screenfull.on('change', onFsChange);
      removeFullscreenListener = () => screenfull.off('change', onFsChange);
    }

    // ── Keyboard navigation ───────────────────────────────────────────────
    const onKeyDown = (e) => {
      // Skip if a text input is focused
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case '+':
        case '-':
          // Handled by Marzipano's own keyboard controls natively;
          // we intercept only for our custom extras below.
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (screenfull?.isEnabled) screenfull.toggle();
          break;
        case 'r':
        case 'R': {
          e.preventDefault();
          const cur = runtimeRef.current?.currentScene;
          if (cur) cur.view.setParameters(cur.data.initialViewParameters);
          break;
        }
        case ' ':
          e.preventDefault();
          toggleAutorotate();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // ── Populate runtimeRef ───────────────────────────────────────────────
    runtimeRef.current = {
      viewer,
      scenes,
      currentScene: scenes[0],
      switchScene,
      startAutorotate,
      stopAutorotate,
      get autorotateEnabled() { return autorotateEnabled; },
      _setAutorotateEnabled(val) { autorotateEnabled = val; },
    };

    // ── Boot first scene ─────────────────────────────────────────────────
    const initialSceneId =
      new URLSearchParams(window.location.search).get('scene');
    const initialScene =
      (initialSceneId && scenes.find((s) => s.data.id === initialSceneId)) ||
      scenes[0];

    onLoadingChange?.(true);
    switchScene(initialScene, { transitionDuration: 0 });

    // Marzipano fires `renderComplete` after the first frame is ready.
    // We listen once to hide the loading overlay.
    const onFirstRender = () => {
      onLoadingChange?.(false);
      bearingRaf = requestAnimationFrame(updateBearing);
    };
    viewer.addEventListener('renderComplete', onFirstRender, { once: true });

    // Fallback: if Marzipano never fires, hide loader after 4 s
    const loadFallback = setTimeout(() => onLoadingChange?.(false), 4000);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(bearingRaf);
      clearTimeout(loadFallback);
      stopAutorotate();
      window.removeEventListener('keydown', onKeyDown);
      removeFullscreenListener?.();
      mq?.removeEventListener?.('change', applyMode);
      // Remove only Virtual Tour body classes. Never wipe RUDA/global body classes.
      body.classList.remove(
        'multiple-scenes',
        'single-scene',
        'mobile',
        'desktop',
        'touch',
        'no-touch'
      );
      runtimeRef.current = null;
      if (panoRef.current) panoRef.current.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Stable callbacks exposed to the React UI ────────────────────────────

  const switchSceneById = useCallback((id) => {
    const target = runtimeRef.current?.scenes?.find((s) => s.data.id === id);
    if (target) runtimeRef.current.switchScene(target);
  }, []);

  const switchToNext = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt) return;
    const idx = getSceneIndex(rt.currentScene?.data?.id);
    const next = rt.scenes[(idx + 1) % rt.scenes.length];
    rt.switchScene(next);
  }, []);

  const switchToPrev = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt) return;
    const idx = getSceneIndex(rt.currentScene?.data?.id);
    const prev = rt.scenes[(idx - 1 + rt.scenes.length) % rt.scenes.length];
    rt.switchScene(prev);
  }, []);

  const toggleAutorotate = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt) return;
    if (rt.autorotateEnabled) {
      // We need direct access to the closure variable — use the stopAutorotate
      // which also sets state, then toggle the enabled flag via a small hack:
      rt.stopAutorotate();
      // Patch the closure-captured variable via the ref object
      // (we expose a setter on the ref for this purpose)
      rt._setAutorotateEnabled?.(false);
    } else {
      rt._setAutorotateEnabled?.(true);
      rt.startAutorotate();
    }
  }, []);

  const resetView = useCallback(() => {
    const cur = runtimeRef.current?.currentScene;
    if (!cur) return;
    cur.view.setParameters(cur.data.initialViewParameters);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const screenfull = window.screenfull;
    if (screenfull?.isEnabled) screenfull.toggle();
  }, []);

  // ── Expose refs for control buttons ──────────────────────────────────────
  return {
    // state
    currentSceneId,
    isAutorotating,
    isFullscreen,
    bearing,

    // actions
    switchSceneById,
    switchToNext,
    switchToPrev,
    toggleAutorotate,
    resetView,
    toggleFullscreen,

    // button refs (ViewerControls attaches these to DOM elements)
    viewUpRef,
    viewDownRef,
    viewLeftRef,
    viewRightRef,
    viewInRef,
    viewOutRef,

    // raw runtime (needed by VirtualTourViewer for URL sync etc.)
    runtimeRef,
  };
}
