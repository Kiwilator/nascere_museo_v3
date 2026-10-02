/* NASCERE V2 — interaction and museographic finishing pass. */
(() => {
  const STANDS = [
    { key: 'project',  x:  2, z:  2, es: 'PROYECTO',  en: 'PROJECT' },
    { key: 'material', x:  2, z: -2, es: 'MATERIAL',  en: 'MATERIAL' },
    { key: 'circular', x: -2, z:  2, es: 'SISTEMA',   en: 'SYSTEM' },
    { key: 'ocean',    x: -2, z: -2, es: 'COLECCIÓN', en: 'COLLECTION' }
  ];

  const LIGHT_ORDER = [
    { x: -2, z: -2 },
    { x:  2, z: -2 },
    { x: -2, z:  2 },
    { x:  2, z:  2 }
  ];

  function getMarkers() {
    return [...document.querySelectorAll('.nascere-hotspot:not(.nascere-stand-hitbox)')].slice(0, 4);
  }

  function refineButtons() {
    const markers = getMarkers();
    markers.forEach((marker, index) => {
      const stand = STANDS[index];
      if (!stand) return;
      marker.setAttribute('position', `${stand.x - 0.49} 0.54 ${stand.z}`);
      marker.setAttribute('rotation', '0 -90 0');

      const body = marker.querySelector('a-cylinder');
      const face = marker.querySelector('a-circle');
      const ring = marker.querySelector('a-ring');
      const label = marker.querySelector('a-text');
      if (body) {
        body.setAttribute('height', '0.022');
        body.setAttribute('position', '0 0 0.003');
      }
      if (face) face.setAttribute('position', '0 0 0.015');
      if (ring) ring.setAttribute('position', '0 0 0.017');
      if (label) label.setAttribute('position', '0 -0.010 0.022');
    });

    document.querySelectorAll('.nascere-podium-accent').forEach((ring) => {
      const p = ring.getAttribute('position');
      if (p) ring.setAttribute('position', `${p.x} 1.025 ${p.z}`);
    });
  }

  function setVisited(marker) {
    if (!marker) return;
    marker.dataset.visited = 'true';
    const body = marker.querySelector('a-cylinder');
    const face = marker.querySelector('a-circle');
    const ring = marker.querySelector('a-ring');
    const label = marker.querySelector('a-text');
    if (body) body.setAttribute('material', 'color', '#123a41');
    if (face) face.setAttribute('material', 'color', '#c8f4ef');
    if (ring) ring.setAttribute('material', 'color', '#79e5d2');
    if (label) label.setAttribute('color', '#073239');
  }

  function clearActiveFocus() {
    [...document.querySelectorAll('.nascere-jewel-light')].slice(0, 4)
      .forEach((light) => light.setAttribute('light', 'intensity', 0.22));
    document.querySelectorAll('.nascere-podium-accent').forEach((ring) => {
      ring.setAttribute('material', 'opacity', 0.90);
      ring.setAttribute('material', 'emissiveIntensity', 0.75);
    });
  }

  function focusStand(index) {
    const stand = STANDS[index];
    if (!stand) return;
    [...document.querySelectorAll('.nascere-jewel-light')].slice(0, 4).forEach((light, lightIndex) => {
      const coords = LIGHT_ORDER[lightIndex];
      const active = coords && coords.x === stand.x && coords.z === stand.z;
      light.setAttribute('light', 'intensity', active ? 0.58 : 0.09);
    });
    document.querySelectorAll('.nascere-podium-accent').forEach((ring) => {
      const p = ring.getAttribute('position');
      const active = p && Math.abs(p.x - stand.x) < 0.03 && Math.abs(p.z - stand.z) < 0.03;
      ring.setAttribute('material', 'opacity', active ? 1 : 0.38);
      ring.setAttribute('material', 'emissiveIntensity', active ? 1.25 : 0.35);
    });
  }

  function bindStandStates() {
    getMarkers().forEach((marker, index) => {
      if (marker.dataset.nascereStateBound === 'true') return;
      marker.dataset.nascereStateBound = 'true';
      marker.addEventListener('click', () => {
        setVisited(marker);
        focusStand(index);
      });
    });
  }

  function addMicroLabels() {
    const scene = document.getElementById('museum-scene');
    if (!scene) return;
    document.querySelectorAll('.nascere-micro-label').forEach((el) => el.remove());
    const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
    STANDS.forEach((stand) => {
      const label = document.createElement('a-text');
      label.classList.add('nascere-micro-label');
      label.dataset.es = stand.es;
      label.dataset.en = stand.en;
      label.setAttribute('value', stand[lang]);
      label.setAttribute('position', `${stand.x - 0.492} 0.90 ${stand.z}`);
      label.setAttribute('rotation', '0 -90 0');
      label.setAttribute('align', 'center');
      label.setAttribute('anchor', 'center');
      label.setAttribute('baseline', 'center');
      label.setAttribute('width', '0.72');
      label.setAttribute('wrap-count', '12');
      label.setAttribute('color', '#aeeef0');
      label.setAttribute('material', 'shader: flat; side: double; transparent: true; opacity: 0.88');
      scene.appendChild(label);
    });
  }

  function updateMicroLabels() {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
    document.querySelectorAll('.nascere-micro-label').forEach((label) => {
      label.setAttribute('value', label.dataset[lang] || '');
    });
  }

  function refineVitrineSupports() {
    const scene = document.getElementById('museum-scene');
    if (!scene) return;
    document.querySelectorAll('.nascere-vitrine-support').forEach((el) => el.remove());
    [-0.55, -1.70, -2.85, -4.00].forEach((z) => {
      const support = document.createElement('a-cylinder');
      support.classList.add('nascere-vitrine-support');
      support.setAttribute('position', `4.02 1.038 ${z}`);
      support.setAttribute('radius', '0.095');
      support.setAttribute('height', '0.024');
      support.setAttribute('segments-radial', '32');
      support.setAttribute('material', 'color: #173b43; roughness: 0.30; metalness: 0.16');
      scene.appendChild(support);

      const halo = document.createElement('a-ring');
      halo.classList.add('nascere-vitrine-support');
      halo.setAttribute('position', `4.02 1.052 ${z}`);
      halo.setAttribute('rotation', '-90 0 0');
      halo.setAttribute('radius-inner', '0.066');
      halo.setAttribute('radius-outer', '0.083');
      halo.setAttribute('material', 'color: #68e1e8; emissive: #2abcc6; emissiveIntensity: 0.48; opacity: 0.68; transparent: true; shader: standard; depthWrite: false');
      scene.appendChild(halo);
    });
  }

  function setupPanelFocus() {
    const panel = document.getElementById('exhibit-panel');
    if (!panel || panel.dataset.nascereObserverBound === 'true') return;
    panel.dataset.nascereObserverBound = 'true';
    let veil = document.getElementById('nascere-panel-veil');
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'nascere-panel-veil';
      Object.assign(veil.style, {
        position: 'fixed', inset: '0', zIndex: '6', pointerEvents: 'none',
        background: 'rgba(5, 27, 34, 0.12)', opacity: '0',
        backdropFilter: 'blur(1.2px) saturate(0.92)',
        WebkitBackdropFilter: 'blur(1.2px) saturate(0.92)',
        transition: 'opacity 260ms ease'
      });
      document.body.appendChild(veil);
    }
    const sync = () => {
      const open = panel.classList.contains('is-open');
      veil.style.opacity = open ? '1' : '0';
      if (!open) clearActiveFocus();
    };
    new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['class', 'data-exhibit'] });
    sync();
  }

  function bindLanguageRefresh() {
    document.querySelectorAll('[data-language]').forEach((button) => {
      if (button.dataset.nascereLangBound === 'true') return;
      button.dataset.nascereLangBound = 'true';
      button.addEventListener('click', () => window.setTimeout(updateMicroLabels, 0));
    });
  }

  function setupSoundFix() {
    const button = document.getElementById('sound-toggle');
    const host = document.getElementById('seaSound');
    if (!button || !host || button.dataset.nascereSoundFixed === 'true') return;
    button.dataset.nascereSoundFixed = 'true';

    /* 20% smaller than the shared utility-button dimensions. */
    button.style.minHeight = '27.2px';
    button.style.padding = '0 10.4px';
    button.style.fontSize = '8px';
    button.style.letterSpacing = '0.10em';
    const dot = button.querySelector('.status-dot');
    if (dot) {
      dot.style.width = '4.8px';
      dot.style.height = '4.8px';
      dot.style.marginRight = '5.6px';
    }

    let audio = null;
    let playing = false;
    const src = host.dataset.audioSrc;

    const setState = (on) => {
      playing = on;
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    };

    const ensureAudio = () => {
      if (audio || !src) return audio;
      audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.5;
      audio.preload = 'auto';
      audio.playsInline = true;
      return audio;
    };

    button.addEventListener('click', (event) => {
      /* This capture listener replaces the older A-Frame sound handler. */
      event.preventDefault();
      event.stopImmediatePropagation();

      const player = ensureAudio();
      if (!player) {
        setState(false);
        return;
      }

      if (playing) {
        player.pause();
        setState(false);
        return;
      }

      const promise = player.play();
      if (promise && typeof promise.then === 'function') {
        promise.then(() => setState(true)).catch(() => setState(false));
      } else {
        setState(true);
      }
    }, true);
  }

  function applyFinishingPass() {
    refineButtons();
    bindStandStates();
    addMicroLabels();
    refineVitrineSupports();
    setupPanelFocus();
    bindLanguageRefresh();
    setupSoundFix();
  }

  function start() {
    setupSoundFix();
    const scene = document.getElementById('museum-scene');
    const afterScene = () => {
      window.setTimeout(applyFinishingPass, 1350);
      window.setTimeout(applyFinishingPass, 2200);
    };
    if (scene?.hasLoaded) afterScene();
    else scene?.addEventListener('loaded', afterScene, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
