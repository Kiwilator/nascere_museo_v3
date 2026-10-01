/* NASCERE V2 — scene components are registered before <a-scene> is parsed. */
AFRAME.registerComponent('museum-movement', {
  schema: { speed: { type: 'number', default: 1.55 } },
  init() {
    this.keys = new Set();
    this.joystickX = 0;
    this.joystickY = 0;
    this.onKeyDown = (event) => {
      if (/^(KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(event.code)) {
        this.keys.add(event.code);
        event.preventDefault();
      }
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.move = new THREE.Vector3();
  },
  setJoystick(x, y) {
    this.joystickX = x;
    this.joystickY = y;
  },
  tick(time, delta) {
    const camera = document.getElementById('camera');
    if (!camera || !delta) return;
    const onboarding = document.getElementById('intro-card');
    if (onboarding && !onboarding.classList.contains('is-hidden')) return;

    let x = this.joystickX;
    let y = this.joystickY;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) return;

    camera.object3D.getWorldDirection(this.forward);
    this.forward.y = 0;
    if (this.forward.lengthSq() < 0.0001) return;
    this.forward.normalize();
    this.right.set(-this.forward.z, 0, this.forward.x);
    this.move.set(0, 0, 0)
      .addScaledVector(this.right, x)
      .addScaledVector(this.forward, -y);
    if (this.move.lengthSq() > 1) this.move.normalize();
    this.move.multiplyScalar(this.data.speed * Math.min(delta / 1000, 0.045));
    this.el.object3D.position.add(this.move);
  },
  remove() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
});

AFRAME.registerComponent('rig-collider', {
  schema: {
    wallSelector: { type: 'string', default: '.wall' },
    radius: { type: 'number', default: 0.35 }
  },
  init() {
    this.playerSphere = new THREE.Sphere(new THREE.Vector3(), this.data.radius);
    this.prevLocal = this.el.object3D.position.clone();
    this.world = new THREE.Vector3();
    this.wallBoxes = [];
    const refresh = () => this.refreshWalls();
    const scene = this.el.sceneEl;
    if (scene && scene.hasLoaded) requestAnimationFrame(refresh);
    else if (scene) scene.addEventListener('loaded', () => requestAnimationFrame(refresh), { once: true });
  },
  refreshWalls() {
    this.wallBoxes = [...document.querySelectorAll(this.data.wallSelector)].map((wall) => {
      wall.object3D.updateMatrixWorld(true);
      return new THREE.Box3().setFromObject(wall.object3D);
    }).filter((box) => !box.isEmpty());
  },
  tick() {
    if (!this.wallBoxes.length) return;
    this.el.object3D.getWorldPosition(this.world);
    this.playerSphere.center.copy(this.world);
    for (const box of this.wallBoxes) {
      if (box.intersectsSphere(this.playerSphere)) {
        this.el.object3D.position.copy(this.prevLocal);
        return;
      }
    }
    this.prevLocal.copy(this.el.object3D.position);
  }
});

AFRAME.registerComponent('deferred-gltf', {
  schema: {
    src: { type: 'string' },
    delay: { type: 'number', default: 1000 }
  },
  init() {
    let scheduled = false;
    const load = () => {
      if (!this.el.isConnected || !this.data.src) return;
      this.el.setAttribute('gltf-model', this.data.src);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(() => {
        if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1200 });
        else load();
      }, this.data.delay);
    };
    if (document.documentElement.classList.contains('museum-entered')) schedule();
    else window.addEventListener('nascere:entered', schedule, { once: true });
  }
});

AFRAME.registerComponent('face-camera', {
  init() { this.camera = null; this.cameraPosition = new THREE.Vector3(); },
  tick() {
    if (!this.camera) this.camera = document.getElementById('camera');
    if (!this.camera) return;
    this.camera.object3D.getWorldPosition(this.cameraPosition);
    this.el.object3D.lookAt(this.cameraPosition);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const scene = document.getElementById('museum-scene');
  const loading = document.getElementById('loading-screen');
  const loadingStatus = document.getElementById('loading-status');
  const panel = document.getElementById('exhibit-panel');
  const panelIndex = document.getElementById('panel-index');
  const panelCategory = document.getElementById('panel-category');
  const panelEyebrow = document.getElementById('panel-eyebrow');
  const panelTitle = document.getElementById('panel-title');
  const panelLead = document.getElementById('panel-lead');
  const panelBody = document.getElementById('panel-body');
  const panelProgress = document.getElementById('panel-progress');
  const introCard = document.getElementById('intro-card');
  const exhibitHint = document.getElementById('exhibit-hint');
  const resetButton = document.getElementById('reset-view');
  const brandButton = document.getElementById('brand-button');
  const closeButton = document.querySelector('.panel-close');
  const enterButton = document.getElementById('enter-museum');

  const showStableUI = () => document.documentElement.classList.add('ui-ready');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(showStableUI).catch(showStableUI);
  else showStableUI();
  window.setTimeout(showStableUI, 2500);

  let currentLanguage = 'es';
  let introTimer = null;
  let sceneReady = false;
  let criticalLoaded = 0;
  let revealed = false;

  const UI = {
    es: {
      museum: 'MUSEO VIRTUAL', sound: 'SONIDO', reset: 'INICIO',
      howTo: 'CÓMO RECORRER EL MUSEO', introTitle: 'Explora Nascere', enter: 'ENTRAR AL MUSEO',
      intro: 'Recorre el espacio y selecciona los puntos de la exposición para descubrir el proyecto.',
      move: 'Mover', look: 'Mirar', selectPoint: 'Selecciona un punto', explore: 'EXPLORA LA EXPOSICIÓN'
    },
    en: {
      museum: 'VIRTUAL MUSEUM', sound: 'SOUND', reset: 'START',
      howTo: 'HOW TO MOVE AROUND THE MUSEUM', introTitle: 'Explore Nascere', enter: 'ENTER THE MUSEUM',
      intro: 'Move through the space and select the exhibition points to discover the project.',
      move: 'Move', look: 'Look', selectPoint: 'Select a point', explore: 'EXPLORE THE EXHIBITION'
    }
  };

  const EXHIBITS = {
    project: {
      index: '01',
      es: {
        category: 'NASCERE', eyebrow: 'PROYECTO', title: 'Diseñar a partir del residuo',
        lead: 'Nascere combina diseño de joyería, reutilización material y exposición digital en un mismo proyecto.',
        body: [
          'La propuesta parte del poliestireno expandido (EPS) como residuo y lo transforma en materia para crear piezas de joyería. El objetivo es dar valor a un material de uso cotidiano que suele resultar difícil de gestionar una vez desechado.',
          'El museo virtual permite mostrar las piezas y explicar el proceso sin depender de una exposición física. La visita se convierte así en una parte del propio proyecto: no solo enseña el resultado, también hace visible la relación entre material, diseño y sostenibilidad.'
        ]
      },
      en: {
        category: 'NASCERE', eyebrow: 'PROJECT', title: 'Designing from waste',
        lead: 'Nascere brings jewellery design, material reuse and digital exhibition together in one project.',
        body: [
          'The project starts with expanded polystyrene (EPS) as waste and transforms it into material for jewellery pieces. Its aim is to give new value to an everyday material that is often difficult to manage once discarded.',
          'The virtual museum presents the pieces and explains the process without relying on a physical exhibition. The visit therefore becomes part of the project itself: it shows not only the final objects, but also the relationship between material, design and sustainability.'
        ]
      }
    },
    material: {
      index: '02',
      es: {
        category: 'MATERIAL', eyebrow: 'POLIESTIRENO EXPANDIDO', title: 'Un residuo ligero, un problema real',
        lead: 'El EPS contiene una gran proporción de aire. Esa ligereza es útil durante su vida como embalaje, pero complica su recuperación posterior.',
        body: [
          'El poliestireno expandido es habitual en envases y embalajes. Su baja densidad implica transportar mucho volumen para recuperar relativamente poca materia, lo que puede hacer poco eficiente su reciclaje convencional.',
          'Nascere investiga una transformación a pequeña escala y próxima al lugar donde se genera el residuo. En vez de entender el EPS únicamente como desecho, el proyecto lo utiliza como punto de partida para desarrollar objetos con un nuevo valor formal y simbólico.'
        ]
      },
      en: {
        category: 'MATERIAL', eyebrow: 'EXPANDED POLYSTYRENE', title: 'Lightweight waste, a real problem',
        lead: 'EPS contains a very high proportion of air. That lightness is useful as packaging, but makes its recovery more difficult afterwards.',
        body: [
          'Expanded polystyrene is common in packaging. Its low density means transporting a large volume to recover a comparatively small amount of material, which can make conventional recycling inefficient.',
          'Nascere explores small-scale transformation close to where the waste is generated. Rather than treating EPS only as refuse, the project uses it as a starting point for objects with new formal and symbolic value.'
        ]
      }
    },
    circular: {
      index: '03',
      es: {
        category: 'SISTEMA', eyebrow: 'ECONOMÍA CIRCULAR', title: 'Mantener el material en uso',
        lead: 'La lógica circular cambia la pregunta: no qué hacer con el residuo al final, sino cómo volver a introducirlo en un ciclo de uso.',
        body: [
          'Procesar el material localmente permite reducir desplazamientos y explorar usos que no dependen de grandes volúmenes industriales. El residuo se convierte en un recurso disponible para experimentar desde el diseño.',
          'En este contexto, la joyería funciona como un campo de prueba especialmente interesante: trabaja con poca cantidad de materia, admite procesos experimentales y permite comunicar el origen del material a través del propio objeto.'
        ]
      },
      en: {
        category: 'SYSTEM', eyebrow: 'CIRCULAR ECONOMY', title: 'Keeping material in use',
        lead: 'Circular thinking changes the question: not simply what to do with waste at the end, but how to introduce it into another cycle of use.',
        body: [
          'Processing material locally can reduce transport and open up uses that do not depend on industrial-scale volumes. Waste becomes a resource available for design experimentation.',
          'Jewellery is a particularly useful testing ground in this context: it uses small amounts of material, allows experimental processes and can communicate the origin of that material through the object itself.'
        ]
      }
    },
    ocean: {
      index: '04',
      es: {
        category: 'COLECCIÓN', eyebrow: 'INSPIRACIÓN MARINA', title: 'El océano como forma y mensaje',
        lead: 'Corales, conchas y estructuras orgánicas conectan la forma de las piezas con el destino ambiental de muchos residuos plásticos.',
        body: [
          'La colección utiliza referencias marinas para construir una narrativa visual alrededor del material. Las formas no funcionan solo como decoración: sitúan las piezas dentro de una reflexión sobre contaminación, transformación y cuidado de los ecosistemas.',
          'Esta relación también orienta la atmósfera del museo. Luz, color, sonido y movimiento buscan que la exposición digital tenga una identidad propia y que el visitante entienda las joyas como parte de un relato más amplio.'
        ]
      },
      en: {
        category: 'COLLECTION', eyebrow: 'MARINE INSPIRATION', title: 'The ocean as form and message',
        lead: 'Corals, shells and organic structures connect the pieces with the environmental destination of many plastic wastes.',
        body: [
          'The collection uses marine references to build a visual narrative around the material. The forms are not merely decorative: they place the pieces within a reflection on pollution, transformation and the care of ecosystems.',
          'This relationship also shapes the atmosphere of the museum. Light, colour, sound and movement give the digital exhibition its own identity and connect each jewel to a wider story.'
        ]
      }
    }
  };

  const HOTSPOTS = [
    { key: 'project', number: '01', position: '1.58 1.30 1.72' },
    { key: 'material', number: '02', position: '1.58 1.30 -2.25' },
    { key: 'circular', number: '03', position: '-1.58 1.30 1.72' },
    { key: 'ocean', number: '04', position: '-1.58 1.30 -2.25' }
  ];

  function setLanguage(lang) {
    if (!UI[lang]) return;
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-language]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.language === lang ? 'true' : 'false');
    });
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      if (UI[lang][key]) node.textContent = UI[lang][key];
    });
    if (panel.classList.contains('is-open') && panel.dataset.exhibit) fillPanel(panel.dataset.exhibit);
  }

  function fillPanel(key) {
    const exhibit = EXHIBITS[key];
    if (!exhibit) return;
    const text = exhibit[currentLanguage];
    panel.dataset.exhibit = key;
    panelIndex.textContent = exhibit.index;
    panelCategory.textContent = text.category;
    panelEyebrow.textContent = text.eyebrow;
    panelTitle.textContent = text.title;
    panelLead.textContent = text.lead;
    panelBody.innerHTML = text.body.map((p) => `<p>${p}</p>`).join('');
    panelProgress.textContent = `${exhibit.index} / 04`;
  }

  function openPanel(key) {
    fillPanel(key);
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    hideIntro();
  }

  function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
  }

  function hideIntro() {
    if (introTimer) clearTimeout(introTimer);
    introCard.classList.add('is-hidden');
    introCard.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => { introCard.style.pointerEvents = 'none'; }, 500);
  }

  function createEntity(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
    return el;
  }

  function addHotspots() {
    HOTSPOTS.forEach(({ key, number, position }) => {
      const marker = createEntity('a-circle', {
        class: 'nascere-hotspot',
        position,
        radius: '0.105',
        'face-camera': '',
        material: 'color: #e9ffff; shader: flat; opacity: 0.94; transparent: true; side: double',
        animation__appear: 'property: scale; from: 0.01 0.01 0.01; to: 1 1 1; dur: 650; easing: easeOutBack'
      });
      marker.dataset.exhibit = key;
      const ring = createEntity('a-ring', {
        position: '0 0 0.003',
        'radius-inner': '0.125',
        'radius-outer': '0.135',
        material: 'color: #75d8de; shader: flat; opacity: 0.72; transparent: true; side: double',
        animation: 'property: material.opacity; from: 0.25; to: 0.85; dur: 1400; dir: alternate; loop: true; easing: easeInOutSine'
      });
      const text = createEntity('a-text', {
        value: number,
        align: 'center',
        color: '#123b43',
        width: '0.48',
        position: '0 -0.018 0.006',
        material: 'shader: flat; side: double'
      });
      marker.appendChild(ring);
      marker.appendChild(text);
      marker.addEventListener('mouseenter', () => {
        marker.setAttribute('scale', '1.16 1.16 1.16');
        exhibitHint.classList.add('is-visible');
      });
      marker.addEventListener('mouseleave', () => {
        marker.setAttribute('scale', '1 1 1');
        exhibitHint.classList.remove('is-visible');
      });
      marker.addEventListener('click', () => openPanel(key));
      scene.appendChild(marker);
    });

    const mouseCursor = createEntity('a-entity', {
      cursor: 'rayOrigin: mouse; fuse: false',
      raycaster: 'objects: .nascere-hotspot; far: 30'
    });
    scene.appendChild(mouseCursor);
  }

  function revealMuseum(force = false) {
    if (revealed) return;
    if (!force && (!sceneReady || criticalLoaded < 2)) return;
    revealed = true;
    const partial = force && (!sceneReady || criticalLoaded < 2);
    loadingStatus.textContent = partial
      ? (currentLanguage === 'es' ? 'Entrada disponible, piezas en carga' : 'Entry available, pieces still loading')
      : (currentLanguage === 'es' ? 'Exposición lista' : 'Exhibition ready');
    window.setTimeout(() => loading.classList.add('is-hidden'), 220);
    // Onboarding remains until visitor enters.
  }

  const criticalModels = [...document.querySelectorAll('.critical-model')];
  criticalModels.forEach((model) => {
    const markSettled = (failed = false) => {
      if (model.dataset.ready) return;
      model.dataset.ready = failed ? 'error' : 'loaded';
      criticalLoaded += 1;
      loadingStatus.textContent = currentLanguage === 'es'
        ? `Cargando piezas ${criticalLoaded}/${criticalModels.length}`
        : `Loading pieces ${criticalLoaded}/${criticalModels.length}`;
      revealMuseum(false);
    };
    if (model.getObject3D('mesh')) markSettled(false);
    else {
      model.addEventListener('model-loaded', () => markSettled(false), { once: true });
      model.addEventListener('model-error', () => markSettled(true), { once: true });
    }
  });

  scene.addEventListener('loaded', () => {
    sceneReady = true;
    addHotspots();
    document.querySelectorAll('.jewellery').forEach((el, index) => {
      if (!el.hasAttribute('animation')) {
        el.setAttribute('animation', `property: rotation; to: 0 ${360 + (index % 2) * 15} 0; dur: ${18500 + index * 800}; loop: true; easing: linear`);
      }
    });
    revealMuseum(false);
  }, { once: true });

  window.setTimeout(() => revealMuseum(true), 3400);

  function resetView() {
    const rig = document.getElementById('rig');
    const camera = document.getElementById('camera');
    if (rig) {
      rig.object3D.position.set(-5, 0, 0);
      rig.object3D.rotation.set(0, THREE.MathUtils.degToRad(-90), 0);
    }
    const look = camera?.components?.['look-controls'];
    if (look?.pitchObject) look.pitchObject.rotation.x = 0;
    if (look?.yawObject) look.yawObject.rotation.y = 0;
    closePanel();
  }

  function setupJoystick() {
    const base = document.getElementById('joystick-base');
    const nub = document.getElementById('joystick-nub');
    const movement = document.getElementById('rig')?.components?.['museum-movement'];
    if (!base || !nub) return;
    const state = { active: false, pointerId: null };

    const setInput = (x, y) => {
      const component = document.getElementById('rig')?.components?.['museum-movement'];
      if (component) component.setJoystick(x, y);
    };

    function update(event) {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = rect.width * 0.33;
      let dx = event.clientX - cx;
      let dy = event.clientY - cy;
      const length = Math.hypot(dx, dy);
      if (length > max) { dx = dx / length * max; dy = dy / length * max; }
      nub.style.transform = `translate(${dx}px, ${dy}px)`;
      setInput(dx / max, dy / max);
    }

    base.addEventListener('pointerdown', (event) => {
      state.active = true;
      state.pointerId = event.pointerId;
      base.setPointerCapture(event.pointerId);
      update(event);
      hideIntro();
    });
    base.addEventListener('pointermove', (event) => {
      if (state.active && event.pointerId === state.pointerId) update(event);
    });
    const stop = (event) => {
      if (state.pointerId !== null && event.pointerId !== state.pointerId) return;
      state.active = false;
      state.pointerId = null;
      nub.style.transform = 'translate(0,0)';
      setInput(0, 0);
    };
    base.addEventListener('pointerup', stop);
    base.addEventListener('pointercancel', stop);
  }

  resetButton.addEventListener('click', resetView);
  brandButton.addEventListener('click', () => openPanel('project'));
  closeButton.addEventListener('click', closePanel);
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePanel(); });
  if (enterButton) enterButton.addEventListener('click', hideIntro);

  setupJoystick();
  setLanguage('es');
});
