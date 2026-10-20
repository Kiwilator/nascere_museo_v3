/* NASCERE — Movimiento con gafas de realidad virtual (Meta Quest y otros mandos WebXR).
   - Stick izquierdo: andar hacia donde se mira (usa el mismo movimiento y las mismas
     colisiones con las paredes que el teclado y el joystick del móvil).
   - Stick derecho: hacia los lados gira 30° (giro por pasos, más cómodo en RV);
     hacia delante o atrás también anda.
   Lee los mandos directamente de la sesión WebXR, así que no depende del modelo de mando. */
AFRAME.registerComponent('vr-locomotion', {
  schema: {
    turnDegrees: { type: 'number', default: 30 },
    deadzone: { type: 'number', default: 0.18 }
  },
  init() {
    this.moving = false;
    this.turnReady = true;
    this.headBefore = new THREE.Vector3();
    this.headAfter = new THREE.Vector3();
    this.onExit = () => this.stop();
    this.el.sceneEl.addEventListener('exit-vr', this.onExit);
  },
  stick(gamepad) {
    const a = gamepad && gamepad.axes ? gamepad.axes : [];
    // mapeo xr-standard: el stick va en los ejes 2 y 3; algunos mandos usan 0 y 1
    let x = a.length >= 4 ? a[2] : (a[0] || 0);
    let y = a.length >= 4 ? a[3] : (a[1] || 0);
    if (a.length >= 4 && Math.abs(x) < 0.01 && Math.abs(y) < 0.01) { x = a[0] || 0; y = a[1] || 0; }
    return { x, y };
  },
  dz(v) {
    const d = this.data.deadzone;
    if (Math.abs(v) < d) return 0;
    return Math.sign(v) * (Math.abs(v) - d) / (1 - d);
  },
  movement() { return this.el.components['museum-movement']; },
  stop() {
    const m = this.movement();
    if (this.moving && m) m.setJoystick(0, 0);
    this.moving = false;
    this.turnReady = true;
  },
  snapTurn(direction) {
    const cam = document.getElementById('camera');
    const rig = this.el.object3D;
    if (!cam) return;
    cam.object3D.getWorldPosition(this.headBefore);
    rig.rotation.y -= direction * THREE.MathUtils.degToRad(this.data.turnDegrees);
    rig.updateMatrixWorld(true);
    cam.object3D.getWorldPosition(this.headAfter);
    // girar alrededor de la cabeza, no del centro del espacio de juego
    rig.position.x += this.headBefore.x - this.headAfter.x;
    rig.position.z += this.headBefore.z - this.headAfter.z;
  },
  tick() {
    const scene = this.el.sceneEl, xr = scene.renderer && scene.renderer.xr;
    const session = (xr && xr.getSession && xr.getSession()) || scene.xrSession;
    if (!session || !session.inputSources) { if (this.moving) this.stop(); return; }
    let move = null, right = null;
    for (const source of session.inputSources) {
      if (!source.gamepad) continue;
      const s = this.stick(source.gamepad);
      if (source.handedness === 'right') right = s;
      else move = s; // izquierdo (o mando único sin lado)
    }
    const d = this.data.deadzone;
    const idle = (s) => !s || (Math.abs(s.x) < d && Math.abs(s.y) < d);
    // el stick derecho también anda hacia delante y atrás si el izquierdo está suelto
    if (idle(move) && right && Math.abs(right.y) > Math.abs(right.x)) move = { x: 0, y: right.y };
    const turn = right && Math.abs(right.x) >= Math.abs(right.y) ? right.x : 0;
    const m = this.movement();
    if (m) {
      const x = move ? this.dz(move.x) : 0, y = move ? this.dz(move.y) : 0;
      if (x || y) { m.setJoystick(x, y); this.moving = true; }
      else if (this.moving) { m.setJoystick(0, 0); this.moving = false; }
    }
    if (this.turnReady && Math.abs(turn) > 0.7) { this.snapTurn(Math.sign(turn)); this.turnReady = false; }
    else if (Math.abs(turn) < 0.3) this.turnReady = true;
  },
  remove() { this.el.sceneEl.removeEventListener('exit-vr', this.onExit); this.stop(); }
});
