/* NASCERE V2 — final visual correction for glass, jewellery and stand labels. */
(() => {
  const CENTRAL_TARGETS = [
    { target: new THREE.Vector3( 2, 1.55, -2), max: new THREE.Vector3(0.26, 0.31, 0.26), rotation: [0, 15, 0] },
    { target: new THREE.Vector3(-2, 1.55, -2), max: new THREE.Vector3(0.26, 0.31, 0.26), rotation: [0, -15, 0] },
    { target: new THREE.Vector3(-2, 1.52,  2), max: new THREE.Vector3(0.24, 0.24, 0.24), rotation: [20, 20, 20] },
    { target: new THREE.Vector3( 2, 1.52,  2), max: new THREE.Vector3(0.24, 0.24, 0.24), rotation: [90, 20, 90] },
    { target: new THREE.Vector3(4.02, 1.20, -0.55), max: new THREE.Vector3(0.19, 0.21, 0.275), rotation: [0, 90, 0] },
    { target: new THREE.Vector3(4.02, 1.20, -1.70), max: new THREE.Vector3(0.19, 0.21, 0.275), rotation: [0, 90, 0] },
    { target: new THREE.Vector3(4.02, 1.20, -2.85), max: new THREE.Vector3(0.19, 0.19, 0.24), rotation: [0, 90, 0] },
    { target: new THREE.Vector3(4.02, 1.20, -4.00), max: new THREE.Vector3(0.19, 0.19, 0.24), rotation: [0, 90, 0] }
  ];

  function deg(v) { return THREE.MathUtils.degToRad(v); }

  function localBounds(el) {
    const mesh = el?.getObject3D('mesh');
    if (!mesh) return null;
    el.object3D.position.set(0, 0, 0);
    el.object3D.rotation.set(0, 0, 0);
    el.object3D.scale.set(1, 1, 1);
    el.object3D.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    if (box.isEmpty()) return null;
    return { center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()) };
  }

  function makeJewelleryOpaque(el) {
    const mesh = el?.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.renderOrder = 2;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (!mat) return;
        mat.depthTest = true;
        mat.depthWrite = true;
        if (mat.opacity == null || mat.opacity > 0.96) {
          mat.opacity = 1;
          mat.transparent = false;
        }
        mat.needsUpdate = true;
      });
    });
  }

  function placeJewellery(el, layout, index) {
    if (!el || !layout || !el.getObject3D('mesh')) return;
    el.removeAttribute('animation');
    el.removeAttribute('animation__float');
    el.removeAttribute('animation__turn');
    const measured = localBounds(el);
    if (!measured) return;
    const { center, size } = measured;
    const ratio = (limit, actual) => actual > 1e-7 ? limit / actual : Infinity;
    const scale = Math.min(ratio(layout.max.x, size.x), ratio(layout.max.y, size.y), ratio(layout.max.z, size.z));
    if (!Number.isFinite(scale) || scale <= 0) return;
    el.object3D.scale.setScalar(scale);
    el.object3D.rotation.set(deg(layout.rotation[0]), deg(layout.rotation[1]), deg(layout.rotation[2]));
    el.object3D.updateMatrixWorld(true);
    const offset = center.clone().multiplyScalar(scale).applyQuaternion(el.object3D.quaternion);
    const p = layout.target.clone().sub(offset);
    el.object3D.position.copy(p);
    el.object3D.updateMatrixWorld(true);
    makeJewelleryOpaque(el);
    const rise = index < 4 ? 0.05 : 0.03;
    const dur = 2700 + (index % 4) * 330;
    const turn = 7800 + (index % 4) * 700;
    el.setAttribute('animation__float', `property: position; from: ${p.x} ${p.y} ${p.z}; to: ${p.x} ${p.y + rise} ${p.z}; dir: alternate; loop: true; dur: ${dur}; easing: easeInOutSine`);
    el.setAttribute('animation__turn', `property: rotation; from: ${layout.rotation[0]} ${layout.rotation[1]} ${layout.rotation[2]}; to: ${layout.rotation[0]} ${layout.rotation[1] + 8} ${layout.rotation[2]}; dir: alternate; loop: true; dur: ${turn}; easing: easeInOutSine`);
  }

  function fixGlass() {
    const stands = [[-2,-2],[2,-2],[-2,2],[2,2]];
    const cylinders = [...document.querySelectorAll('[geometry*="primitive: cylinder"]')];
    stands.forEach(([x,z]) => {
      const glass = cylinders.find((el) => {
        const p = el.getAttribute('position');
        return p && Math.abs(p.x-x)<0.03 && Math.abs(p.y-1.25)<0.03 && Math.abs(p.z-z)<0.03;
      });
      if (!glass) return;
      glass.setAttribute('material', 'depthWrite', false);
      glass.setAttribute('material', 'depthTest', true);
      const mesh = glass.getObject3D('mesh');
      if (mesh) {
        mesh.renderOrder = 20;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (!mat) return;
          mat.transparent = true;
          mat.depthWrite = false;
          mat.depthTest = true;
          mat.needsUpdate = true;
        });
      }
    });
  }

  function fixSideDisplayCase() {
    const display = [...document.querySelectorAll('[gltf-model], [deferred-gltf]')].find((el) => {
      const gltf = String(el.getAttribute('gltf-model') || '');
      const deferred = String(el.getAttribute('deferred-gltf') || '');
      return gltf.includes('display_case_maya.glb') || deferred.includes('display_case_maya.glb');
    });
    if (!display) return;
    const applyMaterial = () => {
      const mesh = display.getObject3D('mesh');
      if (!mesh) return;
      mesh.renderOrder = 18;
      mesh.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.renderOrder = 18;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (!mat) return;
          mat.transparent = true;
          mat.opacity = 0.10;
          mat.depthWrite = false;
          mat.depthTest = true;
          mat.side = THREE.DoubleSide;
          if (mat.color) mat.color.set('#dffcff');
          if ('roughness' in mat) mat.roughness = 0.08;
          if ('metalness' in mat) mat.metalness = 0.02;
          mat.needsUpdate = true;
        });
      });
    };
    if (display.getObject3D('mesh')) applyMaterial();
    else display.addEventListener('model-loaded', applyMaterial, { once: true });
  }

  function doubleButtonNumbers() {
    document.querySelectorAll('.nascere-hotspot:not(.nascere-stand-hitbox) a-text').forEach((label) => {
      label.setAttribute('width', '1.36');
      label.setAttribute('position', '0 -0.010 0.038');
    });
  }

  function refineButtonDepth() {
    document.querySelectorAll('.nascere-hotspot:not(.nascere-stand-hitbox)').forEach((marker) => {
      const body = marker.querySelector('a-cylinder');
      const face = marker.querySelector('a-circle');
      const ring = marker.querySelector('a-ring');
      const label = marker.querySelector('a-text');
      if (body) {
        body.setAttribute('height', '0.036');
        body.setAttribute('position', '0 0 0.010');
      }
      if (face) face.setAttribute('position', '0 0 0.031');
      if (ring) ring.setAttribute('position', '0 0 0.033');
      if (label) label.setAttribute('position', '0 -0.010 0.038');
    });
  }

  /* Keep the wall illustrations, but cool them down so they support the jewellery
     instead of competing with it. The texture remains visible; this is only a tint. */
  function softenGraphicWalls() {
    const imageTokens = ['_388d7e97', '_0f20b462', '_b54debe5', 'OIG2.jpg'];
    document.querySelectorAll('a-box[src]').forEach((el) => {
      const src = String(el.getAttribute('src') || '');
      if (!imageTokens.some((token) => src.includes(token))) return;
      el.setAttribute('material', 'color', '#c4dce1');
      el.setAttribute('material', 'roughness', 0.92);
    });
  }

  /* Darker, quieter podiums. A separate cyan ring preserves the luminous identity
     without leaving the whole top surface as a saturated blue disk. */
  function refinePodiums() {
    const scene = document.getElementById('museum-scene');
    const podiums = [...document.querySelectorAll('[gltf-model*="display_podium.glb"]')];
    podiums.forEach((podium) => {
      const tone = () => {
        const mesh = podium.getObject3D('mesh');
        if (!mesh) return;
        mesh.traverse((obj) => {
          if (!obj.isMesh) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => {
            if (!mat) return;
            if (mat.color) mat.color.lerp(new THREE.Color('#173b43'), 0.72);
            if ('roughness' in mat) mat.roughness = 0.34;
            if ('metalness' in mat) mat.metalness = 0.16;
            if ('emissiveIntensity' in mat) mat.emissiveIntensity *= 0.30;
            mat.needsUpdate = true;
          });
        });
      };
      if (podium.getObject3D('mesh')) tone();
      else podium.addEventListener('model-loaded', tone, { once: true });
    });

    if (!scene) return;
    document.querySelectorAll('.nascere-podium-accent').forEach((el) => el.remove());
    [[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([x,z]) => {
      const ring = document.createElement('a-ring');
      ring.classList.add('nascere-podium-accent');
      ring.setAttribute('position', `${x} 1.075 ${z}`);
      ring.setAttribute('rotation', '-90 0 0');
      ring.setAttribute('radius-inner', '0.335');
      ring.setAttribute('radius-outer', '0.355');
      ring.setAttribute('material', 'color: #64e5ed; emissive: #2fc7d0; emissiveIntensity: 0.75; opacity: 0.90; transparent: true; shader: standard; depthWrite: false');
      scene.appendChild(ring);
    });
  }

  /* Focused light around the exhibits: enough to reveal volume in the jewellery,
     but low intensity so the room does not become even more washed out. */
  function addJewelleryLights() {
    const scene = document.getElementById('museum-scene');
    if (!scene) return;
    document.querySelectorAll('.nascere-jewel-light').forEach((el) => el.remove());

    [[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([x,z]) => {
      const light = document.createElement('a-entity');
      light.classList.add('nascere-jewel-light');
      light.setAttribute('position', `${x} 1.72 ${z}`);
      light.setAttribute('light', 'type: point; color: #eaffff; intensity: 0.22; distance: 1.55; decay: 2; castShadow: false');
      scene.appendChild(light);
    });

    [
      [3.90, 1.50, -1.10],
      [3.90, 1.50, -3.45]
    ].forEach(([x,y,z]) => {
      const light = document.createElement('a-entity');
      light.classList.add('nascere-jewel-light');
      light.setAttribute('position', `${x} ${y} ${z}`);
      light.setAttribute('light', 'type: point; color: #dffcff; intensity: 0.12; distance: 2.0; decay: 2; castShadow: false');
      scene.appendChild(light);
    });
  }

  /* A minimal interior base and two illuminated edges make the lateral case read
     as an exhibition vitrine instead of a transparent volume floating over the counter. */
  function refineSideVitrine() {
    const scene = document.getElementById('museum-scene');
    if (!scene) return;
    document.querySelectorAll('.nascere-side-vitrine-detail').forEach((el) => el.remove());

    const shelf = document.createElement('a-box');
    shelf.classList.add('nascere-side-vitrine-detail');
    shelf.setAttribute('position', '4.02 1.015 -2.28');
    shelf.setAttribute('width', '0.34');
    shelf.setAttribute('height', '0.022');
    shelf.setAttribute('depth', '4.35');
    shelf.setAttribute('material', 'color: #173b43; opacity: 0.64; transparent: true; roughness: 0.30; metalness: 0.12; depthWrite: false');
    scene.appendChild(shelf);

    [3.86, 4.18].forEach((x) => {
      const rail = document.createElement('a-box');
      rail.classList.add('nascere-side-vitrine-detail');
      rail.setAttribute('position', `${x} 1.032 -2.28`);
      rail.setAttribute('width', '0.012');
      rail.setAttribute('height', '0.012');
      rail.setAttribute('depth', '4.25');
      rail.setAttribute('material', 'color: #64e5ed; emissive: #2fc7d0; emissiveIntensity: 0.55; opacity: 0.70; transparent: true; shader: standard; depthWrite: false');
      scene.appendChild(rail);
    });
  }

  function apply() {
    fixGlass();
    fixSideDisplayCase();
    const jewellery = [...document.querySelectorAll('.jewellery')].slice(0, 8);
    jewellery.forEach((el, index) => {
      const run = () => placeJewellery(el, CENTRAL_TARGETS[index], index);
      if (el.getObject3D('mesh')) run();
      else el.addEventListener('model-loaded', run, { once: true });
    });
    doubleButtonNumbers();
    refineButtonDepth();
    softenGraphicWalls();
    refinePodiums();
    addJewelleryLights();
    refineSideVitrine();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const scene = document.getElementById('museum-scene');
    const afterScene = () => {
      requestAnimationFrame(apply);
      window.setTimeout(apply, 250);
      window.setTimeout(apply, 1200);
    };
    if (scene?.hasLoaded) afterScene();
    else scene?.addEventListener('loaded', afterScene, { once: true });
  }, { once: true });
})();
