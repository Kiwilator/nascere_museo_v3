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
    const load = () => {
      if (!this.el.isConnected || !this.data.src) return;
      this.el.setAttribute('gltf-model', this.data.src);
    };
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1200 });
      else load();
    }, this.data.delay);
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

AFRAME.registerComponent('binary-stl-model', {
  schema: {
    src: { type: 'string' },
    color: { type: 'color', default: '#dceced' },
    edgeColor: { type: 'color', default: '#24454d' },
    roughness: { type: 'number', default: 0.38 },
    metalness: { type: 'number', default: 0.08 },
    emissive: { type: 'color', default: '#17343b' },
    emissiveIntensity: { type: 'number', default: 0.16 }
  },

  init() {
    fetch(this.data.src)
      .then((response) => {
        if (!response.ok) throw new Error('STL request failed: ' + response.status);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (buffer.byteLength < 84) throw new Error('Invalid binary STL');

        const view = new DataView(buffer);
        const triangleCount = view.getUint32(80, true);
        const expectedBytes = 84 + triangleCount * 50;
        if (expectedBytes > buffer.byteLength) throw new Error('Malformed binary STL');

        const positions = new Float32Array(triangleCount * 9);
        const normals = new Float32Array(triangleCount * 9);

        let pIndex = 0;
        let offset = 84;

        for (let i = 0; i < triangleCount; i++) {
          const nx = view.getFloat32(offset, true);
          const ny = view.getFloat32(offset + 4, true);
          const nz = view.getFloat32(offset + 8, true);
          offset += 12;

          for (let v = 0; v < 3; v++) {
            positions[pIndex] = view.getFloat32(offset, true);
            positions[pIndex + 1] = view.getFloat32(offset + 4, true);
            positions[pIndex + 2] = view.getFloat32(offset + 8, true);

            normals[pIndex] = nx;
            normals[pIndex + 1] = ny;
            normals[pIndex + 2] = nz;

            pIndex += 3;
            offset += 12;
          }

          offset += 2; // attribute byte count
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.computeBoundingBox();

        if (geometry.boundingBox) {
          const center = new THREE.Vector3();
          geometry.boundingBox.getCenter(center);
          geometry.translate(-center.x, -center.y, -center.z);
        }

        geometry.computeBoundingSphere();

        const material = new THREE.MeshStandardMaterial({
          color: this.data.color,
          roughness: this.data.roughness,
          metalness: this.data.metalness,
          emissive: new THREE.Color(this.data.emissive),
          emissiveIntensity: this.data.emissiveIntensity
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        // Outline the relief edges so the logo and NASCERE lettering remain legible
        // even against the pale stucco wall and from oblique camera angles.
        const edges = new THREE.EdgesGeometry(geometry, 28);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: this.data.edgeColor,
          transparent: true,
          opacity: 0.78
        });
        const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
        edgeLines.renderOrder = 2;
        mesh.add(edgeLines);

        this.el.setObject3D('mesh', mesh);
      })
      .catch((error) => console.warn('Could not load NASCERE STL seal.', error));
  },

  remove() {
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.traverse((obj) => {
        if (obj !== mesh && obj.geometry) obj.geometry.dispose();
        if (obj !== mesh && obj.material) obj.material.dispose();
      });
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      this.el.removeObject3D('mesh');
    }
  }
});

AFRAME.registerComponent('no-cast-shadow', {
  init() {
    const apply = () => {
      const root = this.el.getObject3D('mesh');
      if (!root) return;
      root.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.castShadow = false;
      });
      const renderer = this.el.sceneEl && this.el.sceneEl.renderer;
      if (renderer && renderer.shadowMap) {
        renderer.shadowMap.needsUpdate = true;
      }
    };

    apply();
    this.el.addEventListener('model-loaded', apply);
    this.el.addEventListener('object3dset', apply);
    window.setTimeout(apply, 500);
    window.setTimeout(apply, 1500);
    window.setTimeout(apply, 3000);
  }
});

AFRAME.registerComponent('museum-floor-finish', {
  init() {
    const el = this.el;

    const applyTexture = () => {
      const mesh = el.getObject3D('mesh');
      const renderer = el.sceneEl && el.sceneEl.renderer;
      if (!mesh || !renderer) return;

      const loader = new THREE.TextureLoader();
      loader.load(
        './assets/floor_tiles.png?v=1',
        (texture) => {
          // The source image contains a 2 x 2 tile grid. Repeating the whole
          // texture 20 x 20 produces roughly 1 m tiles across the 40 m floor,
          // rather than four oversized tiles stretched across the museum.
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(20, 20);

          texture.anisotropy = Math.min(
            16,
            renderer.capabilities.getMaxAnisotropy
              ? renderer.capabilities.getMaxAnisotropy()
              : 1
          );
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;

          if ('colorSpace' in texture && THREE.SRGBColorSpace) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }

          texture.needsUpdate = true;

          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (!mat) return;
            mat.map = texture;
            mat.color.set('#ffffff');
            mat.roughness = 0.96;
            mat.metalness = 0;
            mat.needsUpdate = true;
          });

          mesh.receiveShadow = true;
          mesh.castShadow = false;
          renderer.shadowMap.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.warn('Could not load floor tile texture.', error);
        }
      );
    };

    const configureShadows = () => {
      const scene = el.sceneEl;
      const renderer = scene && scene.renderer;
      if (!scene || !renderer) return;

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = true;
      renderer.shadowMap.needsUpdate = true;

      const shadowLightEl = document.getElementById('museum-shadow-light');
      const light = shadowLightEl && shadowLightEl.getObject3D('light');
      if (light && light.shadow) {
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        light.shadow.camera.left = -9;
        light.shadow.camera.right = 9;
        light.shadow.camera.top = 9;
        light.shadow.camera.bottom = -9;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 22;
        light.shadow.bias = -0.00015;
        light.shadow.normalBias = 0.035;
        light.shadow.camera.updateProjectionMatrix();
      }

      const setCaster = (entity, cast = true, receive = true) => {
        if (!entity) return;
        const apply = () => {
          const root = entity.getObject3D('mesh');
          if (!root) return;
          root.traverse((obj) => {
            if (!obj.isMesh) return;
            obj.castShadow = cast;
            obj.receiveShadow = receive;
          });
          renderer.shadowMap.needsUpdate = true;
        };
        apply();
        entity.addEventListener('model-loaded', apply);
        entity.addEventListener('object3dset', apply);
      };

      // Solid display bases.
      [...document.querySelectorAll('a-entity[geometry*="primitive: cylinder"]')].forEach((entity) => {
        const material = entity.getAttribute('material');
        const opacity = material && Number(material.opacity);
        const transparent = material && material.transparent;
        if (transparent || (Number.isFinite(opacity) && opacity < 0.9)) {
          setCaster(entity, false, false);
        } else {
          setCaster(entity, true, true);
        }
      });

      // Solid museum models cast shadows, except the ceiling lamp models.
      [...document.querySelectorAll('[gltf-model], [deferred-gltf]')].forEach((entity) => {
        const noShadow = entity.id === 'ceiling-sculptural-lamp' || entity.id === 'ceiling-light-model' || entity.id === 'museum-entry-door';
        setCaster(entity, !noShadow, !noShadow);
      });

      // Jewellery also casts normally.
      [...document.querySelectorAll('.jewellery')].forEach((entity) => setCaster(entity, true, true));

      // Ceiling lamp geometry must never cast a shadow.
      const noShadowModelIds = ['ceiling-sculptural-lamp', 'ceiling-light-model', 'museum-entry-door'];
      noShadowModelIds.forEach((id) => setCaster(document.getElementById(id), false, false));

      // Architecture and display graphics never cast shadows.
      [
        ...document.querySelectorAll('a-box.wall'),
        ...document.querySelectorAll('#museum-ceiling')
      ].forEach((entity) => setCaster(entity, false, true));

      [
        ...document.querySelectorAll('#ceiling-sculptural-lamp'),
        ...document.querySelectorAll('#ceiling-light-model')
      ].forEach((entity) => setCaster(entity, false, false));

      // Never let the floor self-shadow.
      const floorMesh = el.getObject3D('mesh');
      if (floorMesh) {
        floorMesh.castShadow = false;
        floorMesh.receiveShadow = true;
      }

      renderer.shadowMap.needsUpdate = true;
    };

    const boot = () => {
      applyTexture();
      configureShadows();
      window.setTimeout(configureShadows, 800);
      window.setTimeout(configureShadows, 2200);
    };

    if (el.sceneEl?.hasLoaded) requestAnimationFrame(boot);
    else el.sceneEl?.addEventListener('loaded', () => requestAnimationFrame(boot), { once: true });
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
  const soundToggle = document.getElementById('sound-toggle');
  const resetButton = document.getElementById('reset-view');
  const brandButton = document.getElementById('brand-button');
  const closeButton = document.querySelector('.panel-close');

  let currentLanguage = 'es';
  let soundOn = false;
  let soundSourceAttached = false;
  let introTimer = null;
  let sceneReady = false;
  let criticalLoaded = 0;
  let revealed = false;

  const UI = {
    es: {
      museum: 'MUSEO VIRTUAL', sound: 'SONIDO', reset: 'INICIO',
      intro: 'Recorre el espacio y selecciona los puntos de la exposición para descubrir el proyecto.',
      move: 'Mover', look: 'Mirar', selectPoint: 'Selecciona un punto', explore: 'EXPLORA LA EXPOSICIÓN'
    },
    en: {
      museum: 'VIRTUAL MUSEUM', sound: 'SOUND', reset: 'START',
      intro: 'Move through the space and select the exhibition points to discover the project.',
      move: 'Move', look: 'Look', selectPoint: 'Select a point', explore: 'EXPLORE THE EXHIBITION'
    }
  };

  const EXHIBITS = {
    project: {
      index: '01',
      es: {
        category: 'NASCERE', eyebrow: 'PROYECTO', title: 'Diseñar a partir del residuo',
        lead: 'Nascere parte de una pregunta sencilla: ¿puede un residuo convertirse en una pieza que queramos conservar?',
        body: [
          'El proyecto trabaja con poliestireno expandido (EPS), un material muy habitual en embalajes y difícil de recuperar una vez utilizado. En lugar de desecharlo, se transforma y se utiliza como materia para experimentar con nuevas piezas de joyería.',
          'El museo virtual reúne todo ese proceso en un mismo lugar. No está pensado solo para enseñar la colección terminada: permite recorrer las piezas, conocer el material del que proceden y entender las decisiones de diseño que hay detrás de ellas.'
        ]
      },
      en: {
        category: 'NASCERE', eyebrow: 'PROJECT', title: 'Designing from waste',
        lead: 'Nascere begins with a simple question: can a piece of waste become an object we want to keep?',
        body: [
          'The project works with expanded polystyrene (EPS), a material commonly used in packaging that is difficult to reclaim after use. Instead of discarding it, the material is transformed and used as a medium for experimenting with new jewelry pieces.',
          'The virtual museum brings this entire process together in one place. It is not designed merely to showcase the finished collection; it allows visitors to explore the pieces, learn about their source material, and understand the design decisions behind them.'
        ]
      }
    },
    material: {
      index: '02',
      es: {
        category: 'MATERIAL', eyebrow: 'POLIESTIRENO EXPANDIDO', title: 'Un residuo ligero, un problema real',
        lead: 'El EPS pesa muy poco, pero ocupa muchísimo espacio. Ahí empieza buena parte del problema.',
        body: [
          'Está presente en embalajes, protecciones y envases de uso cotidiano. Su estructura contiene una gran cantidad de aire, por lo que transportar grandes volúmenes para recuperar poca materia puede hacer que su reciclaje resulte poco eficiente.',
          'Nascere trabaja con este residuo a pequeña escala. El EPS se reduce y se transforma para volver a utilizarlo como material de diseño. El interés no está en ocultar su origen, sino justamente en comprobar hasta dónde puede llegar un material que normalmente consideraríamos desecho.'
        ]
      },
      en: {
        category: 'MATERIAL', eyebrow: 'EXPANDED POLYSTYRENE', title: 'Lightweight waste, a real problem',
        lead: 'EPS is very lightweight but takes up a huge amount of space. That is where much of the problem lies.',
        body: [
          'It is found in everyday packaging, protective materials, and containers. Its structure contains a large amount of air, meaning that transporting large volumes to recover only a small amount of material can make recycling it inefficient.',
          'Nascere works with this waste on a small scale. The EPS is reduced and transformed for reuse as a design material. The goal is not to hide its origins, but rather to see what can be achieved with a material normally considered waste.'
        ]
      }
    },
    circular: {
      index: '03',
      es: {
        category: 'SISTEMA', eyebrow: 'DEL RESIDUO A UNA NUEVA PIEZA', title: 'Mantener el material en uso',
        lead: 'La economía circular intenta que los materiales permanezcan en uso el mayor tiempo posible. Nascere aplica esa idea a una escala muy concreta.',
        body: [
          'El residuo de EPS se recoge, se transforma y vuelve a utilizarse como materia para fabricar nuevas piezas. En lugar de seguir una secuencia de usar y tirar, el proyecto busca introducir de nuevo ese material en un proceso de diseño.',
          'La joyería permite experimentar con pequeñas cantidades y probar formas, acabados y procesos sin necesitar grandes volúmenes de materia. Por eso funciona aquí como un campo de ensayo: el residuo deja de ser el final del recorrido y se convierte en el comienzo de otro.'
        ]
      },
      en: {
        category: 'SYSTEM', eyebrow: 'FROM WASTE TO A NEW PIECE', title: 'Keeping material in use',
        lead: 'The circular economy aims to keep materials in use for as long as possible. Nascere applies this concept on a very specific scale.',
        body: [
          'EPS waste is collected, transformed, and reused as raw material for new pieces. Instead of following a "use-and-discard" sequence, the project seeks to reintroduce the material into the design process.',
          'Jewelry offers the opportunity to experiment with small quantities and test shapes, finishes, and processes without requiring large volumes of material. That is why it functions here as a testing ground: waste ceases to be the end of the journey and becomes the beginning of another.'
        ]
      }
    },
    ocean: {
      index: '04',
      es: {
        category: 'COLECCIÓN', eyebrow: 'DEL OCÉANO A LA FORMA', title: 'El océano como forma y mensaje',
        lead: 'Corales, conchas y estructuras marinas inspiran las piezas porque el mar también está en el origen del proyecto.',
        body: [
          'Parte de los residuos plásticos que no se gestionan correctamente termina llegando a ríos y océanos. Nascere utiliza esa relación como punto de partida para construir la identidad de la colección.',
          'Las formas orgánicas no están ahí solo como decoración. Conectan el material reutilizado con aquello que se quiere evitar: que siga formando parte de un sistema de usar y desechar.',
          'Esa idea continúa en el propio museo. Los colores, las imágenes, el movimiento lento de las piezas y el sonido crean una atmósfera marina que une la colección con la historia que hay detrás del material.'
        ]
      },
      en: {
        category: 'COLLECTION', eyebrow: 'FROM OCEAN TO FORM', title: 'The ocean as form and message',
        lead: 'Corals, shells, and marine structures inspire the pieces, as the sea lies at the very origin of the project.',
        body: [
          'Some mismanaged plastic waste ends up in rivers and oceans. Nascere uses this connection as a starting point to build the collection’s identity.',
          'The organic forms are not merely decorative. They link the reused material to what the project seeks to prevent: its continued role in a "use-and-discard" system.',
          'This concept extends into the museum space itself. Colors, imagery, the slow movement of the pieces, and sound create a marine atmosphere that unites the collection with the story behind the material.'
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
    if (revealed || !sceneReady) return;
    if (!force && criticalLoaded < 2) return;
    revealed = true;
    loadingStatus.textContent = currentLanguage === 'es' ? 'Exposición lista' : 'Exhibition ready';
    window.setTimeout(() => loading.classList.add('is-hidden'), 220);
    introTimer = window.setTimeout(hideIntro, 9000);
  }

  const criticalModels = [...document.querySelectorAll('.critical-model')];
  criticalModels.forEach((model) => {
    const markLoaded = () => {
      if (model.dataset.ready === '1') return;
      model.dataset.ready = '1';
      criticalLoaded += 1;
      loadingStatus.textContent = currentLanguage === 'es'
        ? `Cargando piezas ${criticalLoaded}/${criticalModels.length}`
        : `Loading pieces ${criticalLoaded}/${criticalModels.length}`;
      revealMuseum(false);
    };
    if (model.getObject3D('mesh')) markLoaded();
    else model.addEventListener('model-loaded', markLoaded, { once: true });
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

  function toggleSound() {
    const sound = document.getElementById('seaSound');
    if (!sound || !sound.components || !sound.components.sound) return;
    soundOn = !soundOn;
    soundToggle.setAttribute('aria-pressed', soundOn ? 'true' : 'false');

    const play = () => {
      if (soundOn && sound.components.sound) sound.components.sound.playSound();
    };

    if (soundOn) {
      if (!soundSourceAttached) {
        soundSourceAttached = true;
        sound.addEventListener('sound-loaded', play, { once: true });
        sound.setAttribute('sound', 'src', sound.dataset.audioSrc);
        window.setTimeout(play, 600);
      } else play();
    } else {
      sound.components.sound.pauseSound();
    }
  }

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

  soundToggle.addEventListener('click', toggleSound);
  resetButton.addEventListener('click', resetView);
  brandButton.addEventListener('click', () => openPanel('project'));
  closeButton.addEventListener('click', closePanel);
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePanel(); });
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('#exhibit-panel') && !event.target.closest('.topbar')) hideIntro();
  }, { once: true });

  setupJoystick();
  setLanguage('es');
});
