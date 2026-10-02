/* NASCERE V2 — original sea-theme sound only. No generated noise fallback. */
(() => {
  const SOURCES = [
    './assets/sea_theme.mp3?v=1'
  ];

  let enabled = false;
  let media = null;
  let currentSource = -1;
  let busy = false;

  function setButtonState(button, on, loading = false) {
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    const text = button.querySelector('[data-i18n="sound"]');
    if (!text) return;
    const en = document.documentElement.lang === 'en';
    if (loading) text.textContent = en ? 'SOUND…' : 'SONIDO…';
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
    setButtonState(button, false, true);

    let played = false;
    for (let i = 0; i < SOURCES.length; i += 1) {
      try {
        await playSource(SOURCES[i]);
        currentSource = i;
        played = true;
        break;
      } catch (error) {
        console.warn(`[Nascere] No se pudo reproducir la fuente de audio ${i + 1}.`, error);
      }
    }

    enabled = played;
    setButtonState(button, enabled, false);
    button.dataset.audioMode = enabled ? `original-${currentSource + 1}` : 'unavailable';
    busy = false;
  }

  function turnOff(button) {
    const audio = getMedia();
    audio.pause();
    enabled = false;
    setButtonState(button, false, false);
    button.dataset.audioMode = 'off';
  }

  function bind() {
    const original = document.getElementById('sound-toggle');
    if (!original) return;

    /* Replace the old node so only this controller owns the click. */
    const button = original.cloneNode(true);
    original.replaceWith(button);
    button.dataset.soundFixBound = 'true';
    setButtonState(button, false, false);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (enabled) turnOff(button);
      else turnOn(button);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
