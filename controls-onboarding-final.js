/* NASCERE — isolated controls onboarding, based on Museo-bacterias-2 visual system. */
(() => {
  const COPY = {
    es: {
      title: 'CÓMO MOVERTE',
      move: 'MOVER',
      keys: 'WASD O FLECHAS',
      keysHelp: 'Usa WASD o las flechas del teclado',
      look: 'MIRAR',
      mouse: 'CLIC + ARRASTRAR',
      mouseHelp: 'Mantén pulsado el botón izquierdo y arrastra',
      joystick: 'JOYSTICK',
      joystickHelp: 'Mueve el joystick para desplazarte',
      swipe: 'DESLIZAR',
      swipeHelp: 'Desliza el dedo para mirar alrededor',
      enter: 'ENTRAR AL MUSEO',
      desktopMove: 'WASD / FLECHAS · MOVER',
      desktopLook: 'CLIC + ARRASTRAR · MIRAR',
      mobileMove: 'JOYSTICK · MOVER',
      mobileLook: 'DESLIZAR · MIRAR',
      help: 'AYUDA'
    },
    en: {
      title: 'HOW TO MOVE',
      move: 'MOVE',
      keys: 'WASD OR ARROW KEYS',
      keysHelp: 'Use WASD or the arrow keys',
      look: 'LOOK',
      mouse: 'CLICK + DRAG',
      mouseHelp: 'Hold the left mouse button and drag',
      joystick: 'JOYSTICK',
      joystickHelp: 'Move the joystick to walk around',
      swipe: 'SWIPE',
      swipeHelp: 'Swipe to look around',
      enter: 'ENTER THE MUSEUM',
      desktopMove: 'WASD / ARROWS · MOVE',
      desktopLook: 'CLICK + DRAG · LOOK',
      mobileMove: 'JOYSTICK · MOVE',
      mobileLook: 'SWIPE · LOOK',
      help: 'HELP'
    }
  };

  function installStyles() {
    if (document.getElementById('nascere-final-onboarding-style')) return;
    const style = document.createElement('style');
    style.id = 'nascere-final-onboarding-style';
    style.textContent = `
      #intro-card {
        position: fixed !important;
        inset: 0 !important;
        z-index: 60 !important;
        display: grid !important;
        place-items: center !important;
        padding: 22px !important;
        background: rgba(4,24,30,.46) !important;
        backdrop-filter: blur(6px) !important;
        -webkit-backdrop-filter: blur(6px) !important;
        pointer-events: auto !important;
      }
      #intro-card.is-hidden {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      #intro-card .nascere-guide {
        box-sizing: border-box;
        width: min(900px, calc(100vw - 48px));
        padding: 22px 24px 18px;
        border: 1px solid rgba(222,249,250,.24);
        border-radius: 16px;
        background: rgba(8,43,52,.96);
        box-shadow: 0 24px 70px rgba(1,18,23,.42);
        color: #f8ffff;
        font-family: 'DM Sans', system-ui, sans-serif;
      }
      #intro-card .nascere-guide-title {
        margin: 0 0 18px;
        text-align: center;
        color: #75d8de;
        font-size: 12px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: .20em;
      }
      #intro-card .nascere-guide-desktop {
        display: grid;
        grid-template-columns: minmax(0,1fr) minmax(0,1fr);
        gap: 22px;
      }
      #intro-card .nascere-guide-mobile { display: none; }
      #intro-card .nascere-guide-card {
        box-sizing: border-box;
        min-width: 0;
        min-height: 176px;
        display: grid;
        grid-template-columns: 140px minmax(0,1fr);
        align-items: center;
        gap: 18px;
        padding: 14px 16px;
        border: 1px solid rgba(222,249,250,.12);
        border-radius: 11px;
        background: rgba(255,255,255,.055);
      }
      #intro-card .nascere-guide-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        text-align: left;
      }
      #intro-card .nascere-guide-kicker {
        color: #75d8de;
        font-size: 10px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: .16em;
      }
      #intro-card .nascere-guide-name {
        color: #f8ffff;
        font-size: 14px;
        line-height: 1.18;
        font-weight: 800;
        letter-spacing: .035em;
      }
      #intro-card .nascere-guide-help {
        color: rgba(248,255,255,.64);
        font-size: 11px;
        line-height: 1.4;
      }

      /* Keyboard: same proportions/placement as Museo-bacterias-2. */
      #intro-card .nascere-keyboard-demo {
        width: 128px;
        height: 138px;
        position: relative;
        justify-self: center;
      }
      #intro-card .nascere-wasd {
        position: absolute;
        left: 15px;
        top: 0;
        width: 98px;
        display: grid;
        grid-template-columns: repeat(3,30px);
        grid-template-rows: repeat(2,30px);
        gap: 4px;
      }
      #intro-card .nascere-arrows {
        position: absolute;
        left: 24px;
        top: 82px;
        width: 80px;
        display: grid;
        grid-template-columns: repeat(3,24px);
        grid-template-rows: repeat(2,24px);
        gap: 3px;
        opacity: .78;
      }
      #intro-card .nascere-key {
        box-sizing: border-box;
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        padding: 0;
        margin: 0;
        border: 1px solid rgba(232,251,251,.42);
        border-radius: 6px;
        background: rgba(255,255,255,.10);
        color: #f8ffff;
        font-size: 11px;
        line-height: 1;
        font-style: normal;
        font-weight: 800;
        box-shadow: 0 2px 0 rgba(1,18,23,.30);
        animation: nascereGuideKeyPulse 2.8s ease-in-out infinite;
      }
      #intro-card .nascere-arrows .nascere-key { width:24px; height:24px; font-size:10px; }
      #intro-card .nascere-key.w { grid-column:2; grid-row:1; }
      #intro-card .nascere-key.a { grid-column:1; grid-row:2; animation-delay:.35s; }
      #intro-card .nascere-key.s { grid-column:2; grid-row:2; animation-delay:.70s; }
      #intro-card .nascere-key.d { grid-column:3; grid-row:2; animation-delay:1.05s; }
      #intro-card .nascere-key.up { grid-column:2; grid-row:1; }
      #intro-card .nascere-key.left { grid-column:1; grid-row:2; animation-delay:.35s; }
      #intro-card .nascere-key.down { grid-column:2; grid-row:2; animation-delay:.70s; }
      #intro-card .nascere-key.right { grid-column:3; grid-row:2; animation-delay:1.05s; }

      /* Mouse: same recognizable silhouette/animation as Museo-bacterias-2. */
      #intro-card .nascere-mouse-demo {
        width: 124px;
        height: 116px;
        position: relative;
        display: grid;
        place-items: center;
        justify-self: center;
      }
      #intro-card .nascere-mouse-shape {
        box-sizing: border-box;
        width: 40px;
        height: 60px;
        position: relative;
        border: 2px solid rgba(232,251,251,.76);
        border-radius: 21px;
        background: rgba(255,255,255,.08);
        animation: nascereGuideMouseDrag 2.4s ease-in-out infinite;
      }
      #intro-card .nascere-mouse-shape::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        width: 1px;
        height: 23px;
        background: rgba(232,251,251,.38);
      }
      #intro-card .nascere-mouse-shape::after {
        content: '';
        position: absolute;
        left: 7px;
        top: 7px;
        width: 12px;
        height: 17px;
        border-radius: 8px 4px 5px 4px;
        background: #75d8de;
        animation: nascereGuideClick 2.4s ease-in-out infinite;
      }
      #intro-card .nascere-drag-arrows {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 2px;
        text-align: center;
        color: #75d8de;
        font-size: 20px;
        line-height: 1;
        letter-spacing: .16em;
      }

      #intro-card .nascere-guide-actions {
        display: flex;
        justify-content: center;
        margin-top: 16px;
      }
      #intro-card .nascere-guide-enter {
        min-height: 40px;
        padding: 0 23px;
        border: 1px solid rgba(232,255,255,.38);
        border-radius: 999px;
        background: #e8fbfb;
        color: #102f39;
        cursor: pointer;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .13em;
      }
      #intro-card .nascere-guide-enter:hover { background: #fff; }

      /* Mobile is selected by input type, not by a narrow desktop window. */
      #intro-card .nascere-mobile-visual {
        width: 96px;
        height: 96px;
        position: relative;
        justify-self: center;
      }
      #intro-card .nascere-joystick {
        border: 1px solid rgba(232,251,251,.32);
        border-radius: 50%;
        background: rgba(255,255,255,.06);
      }
      #intro-card .nascere-joystick::after {
        content:'';
        position:absolute;
        width:38px;
        height:38px;
        left:29px;
        top:29px;
        border-radius:50%;
        background:#75d8de;
        animation:nascereGuideJoystick 2.2s ease-in-out infinite;
      }
      #intro-card .nascere-swipe {
        display:grid;
        place-items:center;
      }
      #intro-card .nascere-swipe::before {
        content:'';
        width:20px;
        height:20px;
        border:2px solid #75d8de;
        border-radius:50%;
        background:rgba(117,216,222,.14);
        animation:nascereGuideSwipe 2.2s ease-in-out infinite;
      }
      #intro-card .nascere-swipe::after {
        content:'←   →';
        position:absolute;
        left:0;
        right:0;
        bottom:16px;
        text-align:center;
        color:#75d8de;
        font-size:20px;
      }

      @keyframes nascereGuideKeyPulse {
        0%,72%,100% { transform:translateY(0); background:rgba(255,255,255,.10); }
        10%,28% { transform:translateY(2px); background:rgba(117,216,222,.24); }
      }
      @keyframes nascereGuideMouseDrag {
        0%,18%,100% { transform:translateX(-17px); }
        55%,72% { transform:translateX(17px); }
      }
      @keyframes nascereGuideClick {
        0%,12%,82%,100% { opacity:.42; transform:scale(1); }
        20%,68% { opacity:1; transform:scale(.86); }
      }
      @keyframes nascereGuideJoystick {
        0%,100% { transform:translate(0,0); }
        25% { transform:translate(0,-16px); }
        50% { transform:translate(15px,0); }
        75% { transform:translate(-15px,0); }
      }
      @keyframes nascereGuideSwipe {
        0%,100% { transform:translateX(-14px); opacity:.55; }
        50% { transform:translateX(14px); opacity:1; }
      }

      @media (max-width:720px), (hover:none) and (pointer:coarse) {
        #intro-card .nascere-guide { width:min(410px,calc(100vw - 24px)); padding:20px 14px 16px; }
        #intro-card .nascere-guide-title { margin-bottom:12px; }
        #intro-card .nascere-guide-desktop { display:none !important; }
        #intro-card .nascere-guide-mobile { display:grid !important; grid-template-columns:1fr; gap:10px; }
        #intro-card .nascere-guide-card { min-height:104px; grid-template-columns:96px minmax(0,1fr); gap:12px; padding:10px 12px; }
        #intro-card .nascere-mobile-visual { width:82px; height:82px; }
        #intro-card .nascere-joystick::after { left:22px; top:22px; }
      }

      @media (prefers-reduced-motion: reduce) {
        #intro-card .nascere-key,
        #intro-card .nascere-mouse-shape,
        #intro-card .nascere-mouse-shape::after,
        #intro-card .nascere-joystick::after,
        #intro-card .nascere-swipe { animation:none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function keyboardVisual() {
    return `<div class="nascere-keyboard-demo" aria-hidden="true">
      <div class="nascere-wasd">
        <span class="nascere-key w">W</span>
        <span class="nascere-key a">A</span>
        <span class="nascere-key s">S</span>
        <span class="nascere-key d">D</span>
      </div>
      <div class="nascere-arrows">
        <span class="nascere-key up">↑</span>
        <span class="nascere-key left">←</span>
        <span class="nascere-key down">↓</span>
        <span class="nascere-key right">→</span>
      </div>
    </div>`;
  }

  function mouseVisual() {
    return `<div class="nascere-mouse-demo" aria-hidden="true">
      <div class="nascere-mouse-shape"></div>
      <div class="nascere-drag-arrows">← →</div>
    </div>`;
  }

  function render() {
    const intro = document.getElementById('intro-card');
    if (!intro) return;
    installStyles();

    intro.innerHTML = `<section class="nascere-guide" aria-labelledby="nascere-guide-title">
      <h2 id="nascere-guide-title" class="nascere-guide-title"></h2>

      <div class="nascere-guide-desktop">
        <div class="nascere-guide-card">
          ${keyboardVisual()}
          <div class="nascere-guide-copy">
            <span class="nascere-guide-kicker" data-guide="move"></span>
            <span class="nascere-guide-name" data-guide="keys"></span>
            <span class="nascere-guide-help" data-guide="keysHelp"></span>
          </div>
        </div>
        <div class="nascere-guide-card">
          ${mouseVisual()}
          <div class="nascere-guide-copy">
            <span class="nascere-guide-kicker" data-guide="look"></span>
            <span class="nascere-guide-name" data-guide="mouse"></span>
            <span class="nascere-guide-help" data-guide="mouseHelp"></span>
          </div>
        </div>
      </div>

      <div class="nascere-guide-mobile">
        <div class="nascere-guide-card">
          <div class="nascere-mobile-visual nascere-joystick" aria-hidden="true"></div>
          <div class="nascere-guide-copy">
            <span class="nascere-guide-kicker" data-guide="move"></span>
            <span class="nascere-guide-name" data-guide="joystick"></span>
            <span class="nascere-guide-help" data-guide="joystickHelp"></span>
          </div>
        </div>
        <div class="nascere-guide-card">
          <div class="nascere-mobile-visual nascere-swipe" aria-hidden="true"></div>
          <div class="nascere-guide-copy">
            <span class="nascere-guide-kicker" data-guide="look"></span>
            <span class="nascere-guide-name" data-guide="swipe"></span>
            <span class="nascere-guide-help" data-guide="swipeHelp"></span>
          </div>
        </div>
      </div>

      <div class="nascere-guide-actions">
        <button id="enter-museum" class="nascere-guide-enter" type="button"></button>
      </div>
    </section>`;

    const reminder = document.getElementById('controls-reminder');
    const help = document.getElementById('controls-help');
    let enteredNotified = false;

    const applyLanguage = () => {
      const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
      const c = COPY[lang];
      const title = document.getElementById('nascere-guide-title');
      if (title) title.textContent = c.title;
      intro.querySelectorAll('[data-guide]').forEach((node) => {
        const key = node.dataset.guide;
        if (c[key]) node.textContent = c[key];
      });
      const enter = document.getElementById('enter-museum');
      if (enter) enter.textContent = c.enter;
      document.querySelectorAll('[data-guide-reminder]').forEach((node) => {
        const key = node.dataset.guideReminder;
        if (c[key]) node.textContent = c[key];
      });
    };

    applyLanguage();
    new MutationObserver(applyLanguage).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });

    const notifyEntered = () => {
      if (enteredNotified) return;
      enteredNotified = true;
      document.documentElement.classList.add('museum-entered');
      window.dispatchEvent(new CustomEvent('nascere:entered'));
    };

    const syncOpenState = () => {
      const open = !intro.classList.contains('is-hidden');
      intro.setAttribute('aria-hidden', open ? 'false' : 'true');
      intro.style.pointerEvents = open ? 'auto' : 'none';
      if (reminder) {
        reminder.classList.toggle('is-visible', !open);
        reminder.setAttribute('aria-hidden', open ? 'true' : 'false');
      }
      if (!open) notifyEntered();
    };

    const setOpen = (open) => {
      intro.classList.toggle('is-hidden', !open);
      syncOpenState();
      if (open) document.getElementById('enter-museum')?.focus({ preventScroll: true });
    };

    const enter = document.getElementById('enter-museum');
    enter?.addEventListener('click', () => setOpen(false));
    help?.addEventListener('click', () => setOpen(true));
    new MutationObserver(syncOpenState).observe(intro, { attributes: true, attributeFilter: ['class'] });
    syncOpenState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once:true });
  else render();
})();
