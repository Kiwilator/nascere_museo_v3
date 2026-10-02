/* NASCERE V2 — preserve Nascere layout; improve loading and interaction. */
(() => {
  /* ---------------------------------------------------------------
     1. CAMERA-RELATIVE MOVEMENT
     --------------------------------------------------------------- */
  const movement = AFRAME.components['museum-movement'];
  if (movement?.Component?.prototype) {
    movement.Component.prototype.tick = function (time, delta) {
      const cameraEl = document.getElementById('camera');
      if (!cameraEl || !delta) return;

      let x = this.joystickX;
      let y = this.joystickY;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
      if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) return;

      const threeCamera = cameraEl.getObject3D('camera') || cameraEl.sceneEl?.camera;
      if (!threeCamera) return;
      threeCamera.getWorldDirection(this.forward);
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
    };
  }

  /* ---------------------------------------------------------------
     2. JEWELLERY
     Use repository-local GLBs. Fit each mesh by its visible bounds, then
     reduce it to 50% of the previous V2 size and restore a very subtle
     floating motion so the pieces feel suspended rather than static.
     --------------------------------------------------------------- */
  const LOCAL_JEWELLERY = [
    './assets/pendiente_coral.glb',
    './assets/pendiente_coral1.glb',
    './assets/anillo_coral1.glb',
    './assets/pendientereducido2.glb',
    './assets/pendiente_coral2.glb',
    './assets/pendiente_coral.glb',
    './assets/anillo_coral1.glb',
    './assets/pendientereducido2.glb'
  ];

  const JEWELLERY_LAYOUT = [
    { target: new THREE.Vector3( 2, 1.55, -2), max: new THREE.Vector3(0.52, 0.62, 0.52), rotation: '0 15 0' },
    { target: new THREE.Vector3(-2, 1.55, -2), max: new THREE.Vector3(0.52, 0.62, 0.52), rotation: '0 -15 0' },
    { target: new THREE.Vector3(-2, 1.52,  2), max: new THREE.Vector3(0.48, 0.48, 0.48), rotation: '20 20 20' },
    { target: new THREE.Vector3( 2, 1.52,  2), max: new THREE.Vector3(0.48, 0.48, 0.48), rotation: '90 20 90' },
    { target: new THREE.Vector3(4.02, 1.20, -0.55), max: new THREE.Vector3(0.38, 0.42, 0.55), rotation: '0 90 0' },
    { target: new THREE.Vector3(4.02, 1.20, -1.70), max: new THREE.Vector3(0.38, 0.42, 0.55), rotation: '0 90 0' },
    { target: new THREE.Vector3(4.02, 1.20, -2.85), max: new THREE.Vector3(0.38, 0.38, 0.48), rotation: '0 90 0' },
    { target: new THREE.Vector3(4.02, 1.20, -4.00), max: new THREE.Vector3(0.38, 0.38, 0.48), rotation: '0 90 0' }
  ];

  function addFloatingMotion(el, index) {
    if (!el?.object3D) return;
    const p = el.object3D.position;
    const r = el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
    const rise = index < 4 ? 0.055 : 0.035;
    const floatDur = 2500 + (index % 4) * 320;
    const turnDur = 7000 + (index % 4) * 900;

    el.setAttribute(
      'animation__float',
      `property: position; from: ${p.x} ${p.y} ${p.z}; to: ${p.x} ${p.y + rise} ${p.z}; dir: alternate; loop: true; dur: ${floatDur}; easing: easeInOutSine`
    );
    el.setAttribute(
      'animation__turn',
      `property: rotation; from: ${r.x} ${r.y} ${r.z}; to: ${r.x} ${r.y + 10} ${r.z}; dir: alternate; loop: true; dur: ${turnDur}; easing: easeInOutSine`
    );
  }

  function fitLoadedModel(el, layout, index) {
    const mesh = el?.getObject3D('mesh');
    if (!mesh || !layout) return;

    el.removeAttribute('animation');
    el.removeAttribute('animation__float');
    el.removeAttribute('animation__turn');
    el.setAttribute('rotation', layout.rotation);
    el.object3D.updateMatrixWorld(true);

    let box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (!Number.isFinite(size.x + size.y + size.z) || size.lengthSq() < 1e-10) return;

    const safe = (limit, actual) => actual > 1e-6 ? limit / actual : 1;
    const fit = Math.min(
      safe(layout.max.x, size.x),
      safe(layout.max.y, size.y),
      safe(layout.max.z, size.z)
    );

    /* Previous V2 fitted to the full max volume. User wants 50% less. */
    const factor = THREE.MathUtils.clamp(fit, 0.08, 8) * 0.5;
    el.object3D.scale.multiplyScalar(factor);
    el.object3D.updateMatrixWorld(true);

    box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const delta = layout.target.clone().sub(center);
    el.object3D.position.add(delta);
    el.object3D.updateMatrixWorld(true);

    addFloatingMotion(el, index);
  }

  function prepareJewellery() {
    const jewellery = [...document.querySelectorAll('.jewellery')];
    jewellery.slice(0, 8).forEach((el, index) => {
      const local = LOCAL_JEWELLERY[index];
      const layout = JEWELLERY_LAYOUT[index];
      if (!local || !layout) return;

      el.removeAttribute('deferred-gltf');
      el.setAttribute('gltf-model', local);
      el.setAttribute('visible', true);

      const place = () => requestAnimationFrame(() => fitLoadedModel(el, layout, index));
      if (el.getObject3D('mesh')) place();
      el.addEventListener('model-loaded', place, { once: true });
      el.addEventListener('model-error', () => {
        console.warn('[Nascere] No se pudo cargar una joya local:', local);
      }, { once: true });
    });
  }

  function restoreOriginalSideDisplay() {
    const display = [...document.querySelectorAll('[deferred-gltf], [gltf-model]')].find((el) => {
      const a = String(el.getAttribute('gltf-model') || '');
      const b = String(el.getAttribute('deferred-gltf') || '');
      return a.includes('display_case_maya.glb') || b.includes('display_case_maya.glb');
    });
    if (display) {
      display.removeAttribute('deferred-gltf');
      display.setAttribute('gltf-model', './assets/display_case_maya.glb');
      display.setAttribute('scale', '6 6 50');
      display.setAttribute('position', '4 0.8 -2.3');
      display.setAttribute('rotation', '0 0 0');
    }
  }

  /* ---------------------------------------------------------------
     3. STAND BUTTONS
     Geometry only. Number has a restrained scale and sits comfortably
     inside the circular face instead of competing with the stand.
     --------------------------------------------------------------- */
  const STANDS = [
    { key: 'project',  number: '01', x:  2, z:  2 },
    { key: 'material', number: '02', x:  2, z: -2 },
    { key: 'circular', number: '03', x: -2, z:  2 },
    { key: 'ocean',    number: '04', x: -2, z: -2 }
  ];

  function rebuildStandButtons() {
    const markers = [...document.querySelectorAll('.nascere-hotspot')]
      .filter((el) => !el.classList.contains('nascere-stand-hitbox'))
      .slice(0, 4);
    if (markers.length < 4) return false;

    markers.forEach((marker, index) => {
      const stand = STANDS[index];
      marker.removeAttribute('face-camera');
      marker.removeAttribute('animation__appear');
      marker.setAttribute('position', `${stand.x - 0.54} 0.72 ${stand.z}`);
      marker.setAttribute('rotation', '0 -90 0');
      marker.setAttribute('radius', '0.185');
      marker.setAttribute('scale', '1 1 1');
      marker.setAttribute('material', 'color: #ffffff; opacity: 0.001; transparent: true; depthWrite: false; side: double');

      while (marker.firstChild) marker.removeChild(marker.firstChild);

      const body = document.createElement('a-cylinder');
      body.setAttribute('radius', '0.158');
      body.setAttribute('height', '0.058');
      body.setAttribute('rotation', '90 0 0');
      body.setAttribute('position', '0 0 0.018');
      body.setAttribute('material', 'color: #163b44; roughness: 0.34; metalness: 0.28');
      marker.appendChild(body);

      const face = document.createElement('a-circle');
      face.setAttribute('radius', '0.135');
      face.setAttribute('position', '0 0 0.051');
      face.setAttribute('material', 'color: #8de3e6; shader: flat; side: double');
      marker.appendChild(face);

      const ring = document.createElement('a-ring');
      ring.setAttribute('radius-inner', '0.136');
      ring.setAttribute('radius-outer', '0.150');
      ring.setAttribute('position', '0 0 0.053');
      ring.setAttribute('material', 'color: #eaffff; shader: flat; side: double');
      marker.appendChild(ring);

      const label = document.createElement('a-text');
      label.setAttribute('value', stand.number);
      label.setAttribute('align', 'center');
      label.setAttribute('anchor', 'center');
      label.setAttribute('baseline', 'center');
      label.setAttribute('width', '0.68');
      label.setAttribute('color', '#082d35');
      label.setAttribute('position', '0 -0.010 0.059');
      label.setAttribute('material', 'shader: flat; side: double');
      marker.appendChild(label);
    });
    return true;
  }

  /* ---------------------------------------------------------------
     4. WHOLE STAND CLICKABLE + HOVER FEEDBACK
     --------------------------------------------------------------- */
  const baseScales = new WeakMap();
  const podiumColours = new WeakMap();

  function findAt(selector, x, y, z, tolerance = 0.08) {
    return [...document.querySelectorAll(selector)].find((el) => {
      const p = el.getAttribute('position');
      return p && Math.abs(p.x - x) < tolerance && Math.abs(p.y - y) < tolerance && Math.abs(p.z - z) < tolerance;
    });
  }

  function scaleElement(el, factor) {
    if (!el?.object3D) return;
    if (!baseScales.has(el)) baseScales.set(el, el.object3D.scale.clone());
    const base = baseScales.get(el);
    el.object3D.scale.copy(base).multiplyScalar(factor);
  }

  function tintPodium(el, hover) {
    const mesh = el?.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => {
        if (!mat.color) return;
        if (!podiumColours.has(mat)) podiumColours.set(mat, mat.color.clone());
        const original = podiumColours.get(mat);
        if (hover) mat.color.copy(original).lerp(new THREE.Color('#ffffff'), 0.22);
        else mat.color.copy(original);
        mat.needsUpdate = true;
      });
    });
  }

  function setStandHover(index, hover) {
    const s = STANDS[index];
    const base = findAt('[geometry*="primitive: cylinder"]', s.x, 0.5, s.z);
    const glass = findAt('[geometry*="primitive: cylinder"]', s.x, 1.25, s.z);
    const podium = findAt('[gltf-model*="display_podium.glb"]', s.x, 0.95, s.z, 0.12);

    [base, glass, podium].forEach((el) => scaleElement(el, hover ? 1.04 : 1));
    if (base) base.setAttribute('material', 'color', hover ? '#668a90' : '#254f57');
    if (glass) {
      glass.setAttribute('material', 'color', hover ? '#ffffff' : '#dffcff');
      glass.setAttribute('material', 'opacity', hover ? 0.28 : 0.16);
    }
    tintPodium(podium, hover);
  }

  function makeWholeStandsClickable() {
    const scene = document.getElementById('museum-scene');
    const markers = [...document.querySelectorAll('.nascere-hotspot')]
      .filter((el) => !el.classList.contains('nascere-stand-hitbox'))
      .slice(0, 4);
    if (!scene || markers.length < 4) return false;

    document.querySelectorAll('.nascere-stand-hitbox').forEach((el) => el.remove());

    STANDS.forEach((stand, index) => {
      const hitbox = document.createElement('a-cylinder');
      hitbox.classList.add('nascere-hotspot', 'nascere-stand-hitbox');
      hitbox.setAttribute('position', `${stand.x} 1.35 ${stand.z}`);
      hitbox.setAttribute('radius', '0.62');
      hitbox.setAttribute('height', '2.7');
      hitbox.setAttribute('material', 'color: #ffffff; opacity: 0.001; transparent: true; depthWrite: false');
      hitbox.dataset.exhibit = stand.key;

      hitbox.addEventListener('mouseenter', () => {
        setStandHover(index, true);
        markers[index].setAttribute('scale', '1.08 1.08 1.08');
        if (scene.canvas) scene.canvas.style.cursor = 'pointer';
      });
      hitbox.addEventListener('mouseleave', () => {
        setStandHover(index, false);
        markers[index].setAttribute('scale', '1 1 1');
        if (scene.canvas) scene.canvas.style.cursor = 'grab';
      });
      hitbox.addEventListener('click', () => markers[index].emit('click', {}, false));
      scene.appendChild(hitbox);
    });
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    prepareJewellery();
    restoreOriginalSideDisplay();

    const scene = document.getElementById('museum-scene');
    const afterScene = () => {
      prepareJewellery();
      restoreOriginalSideDisplay();
      requestAnimationFrame(() => {
        rebuildStandButtons();
        makeWholeStandsClickable();
      });
    };

    if (scene?.hasLoaded) afterScene();
    else scene?.addEventListener('loaded', afterScene, { once: true });
  }, { once: true });
})();