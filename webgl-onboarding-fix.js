/* NASCERE — WebGL-safe onboarding overlay.
   Avoids backdrop-filter compositing over the A-Frame canvas and forces a clean
   renderer resize after the guide closes/reopens. Does not touch scene objects. */
(() => {
  function refreshRenderer() {
    const scene = document.getElementById('museum-scene');
    if (!scene) return;

    const run = () => {
      try {
        if (typeof scene.resize === 'function') scene.resize();
        window.dispatchEvent(new Event('resize'));
        const canvas = scene.canvas;
        if (canvas) {
          canvas.style.visibility = 'visible';
          canvas.style.opacity = '1';
        }
        if (scene.renderer && scene.camera) {
          scene.renderer.render(scene.object3D, scene.camera);
        }
      } catch (error) {
        console.warn('[Nascere] WebGL refresh skipped:', error);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(run));
    window.setTimeout(run, 120);
  }

  function makeOverlayWebGLSafe() {
    const intro = document.getElementById('intro-card');
    if (!intro) return false;

    /* backdrop-filter over a WebGL canvas can cause compositing artefacts where
       meshes appear to vanish. Use a translucent overlay instead. */
    intro.style.setProperty('backdrop-filter', 'none', 'important');
    intro.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    intro.style.setProperty('background', 'rgba(4, 24, 30, .62)', 'important');

    if (!intro.dataset.webglSafeBound) {
      intro.dataset.webglSafeBound = '1';
      intro.addEventListener('click', (event) => {
        if (event.target.closest('#enter-museum, .nascere-guide-enter')) {
          window.setTimeout(refreshRenderer, 20);
        }
      });

      new MutationObserver(() => {
        if (intro.classList.contains('is-hidden')) refreshRenderer();
      }).observe(intro, { attributes: true, attributeFilter: ['class'] });
    }
    return true;
  }

  function init() {
    if (makeOverlayWebGLSafe()) return;
    const observer = new MutationObserver(() => {
      if (makeOverlayWebGLSafe()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
