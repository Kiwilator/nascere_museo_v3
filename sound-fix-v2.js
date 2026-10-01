/* NASCERE V2 — original sea-theme sound only. No generated noise fallback. */
(() => {
  const SOURCES = [
    'https://cdn.glitch.global/875c914b-5bf9-4bd8-8d5b-92c7da9612b5/sea_theme.mp3?v=1726130217666',
    'https://cdn.glitch.me/875c914b-5bf9-4bd8-8d5b-92c7da9612b5%2Fsea_theme.mp3?v=1726130217666',
    'https://cdn.glitch.com/875c914b-5bf9-4bd8-8d5b-92c7da9612b5%2Fsea_theme.mp3?v=1726130217666'
  ];

  let enabled = false;
  let media = null;
  let currentSource = -1;
  let busy = false;

  function setButtonState(button, state) {
    const on = state === 'on';
    button.dataset.soundState = state;
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    const text = button.querySelector('[data-i18n="sound"]');
    if (!text) return;
    const en = document.documentElement.lang === 'en';
    if (state === 'loading') text.textContent = en ? 'SOUND…' : 'SONIDO…';
    else if (state === 'unavailable') text.textContent = en ? 'NO SOUND' : 'SIN SONIDO';
    else if (on) text.textContent = en ? 'SOUND ON' : 'SONIDO ON';
    else text.textContent = en ? 'SOUND' : 'SONIDO';
  }

  function getMedia() {
    if (media) return media;
    media = document.createElement('audio');
    media.id = 'nascere-original-sea-theme';
    media.loop = true;
    media.preload = 'auto';
    media.volume = 0.5;
    media.playsInline = true;
    media.style.display = 'none';
    document.body.appendChild(media);
    return media;
  }

  async function playSource(url) {
    const audio = getMedia();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.src = url;
    audio.load();

    const timeout = new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('audio timeout')), 4500);
    });
    await Promise.race([audio.play(), timeout]);
  }

  async function turnOn(button) {
    if (busy) return;
    busy = true;
    setButtonState(button, 'loading');

    let played = false;
    let lastError = null;
    for (let i = 0; i < SOURCES.length; i += 1) {
      try {
        await playSource(SOURCES[i]);
        currentSource = i;
        played = true;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    enabled = played;
    setButtonState(button, enabled ? 'on' : 'unavailable');
    button.dataset.audioMode = enabled ? `original-${currentSource + 1}` : 'unavailable';
    if (!played) {
      console.warn('[Nascere] El audio original externo no está disponible.', lastError?.name || lastError);
    }
    busy = false;
  }

  function turnOff(button) {
    const audio = getMedia();
    audio.pause();
    enabled = false;
    setButtonState(button, 'off');
    button.dataset.audioMode = 'off';
  }

  function bind() {
    const original = document.getElementById('sound-toggle');
    if (!original) return;

    /* Replace the old node so only this controller owns the click. */
    const button = original.cloneNode(true);
    original.replaceWith(button);
    button.dataset.soundFixBound = 'true';
    setButtonState(button, 'off');

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (enabled) turnOff(button);
      else turnOn(button);
    });

    new MutationObserver(() => {
      setButtonState(button, button.dataset.soundState || 'off');
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
