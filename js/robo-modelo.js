/* Modelo 3D do robô didático, da bancada e da peça (usa Three.js e RoboCin).
   O robô é montado em milímetros/1000 (metros), com o eixo Z para cima, como na cinemática. */
(function (root) {
  'use strict';
  var H = Math.PI / 2;

  /* monta a célula (sem WebGL): piso, bancada, peça, robô com garra */
  function cena(opt) {
    opt = opt || {};
    var K = root.RoboCin, sc = new THREE.Scene(), W = new THREE.Group();
    W.rotation.x = -Math.PI / 2; sc.add(W);
    sc.background = new THREE.Color(opt.bg || 0x0b0f14); sc.fog = new THREE.Fog(opt.bg || 0x0b0f14, 6, 14);
    var M = function (c, m, r) { return new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r }); };
    var OR = M(0xff6a00, .25, .45), DK = M(0x2b3038, .5, .4), GR = M(0xa7b0bb, .6, .35);
    var add = function (g, m, p, x, y, z, rx, ry, rz) {
      var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0);
      o.castShadow = o.receiveShadow = true; p.add(o); return o;
    };
    var cy = function (a, b, h) { return new THREE.CylinderGeometry(a, b, h, 32); }, bx = function (x, y, z) { return new THREE.BoxGeometry(x, y, z); };
    var labels = [], rings = [];
    var ring = function (p, ax, r, len, x, y, z) {
      var m = new THREE.Mesh(cy(r, r, len), new THREE.MeshBasicMaterial({ color: 0x2ee6a6, transparent: true, opacity: .35, depthWrite: false }));
      m.position.set(x || 0, y || 0, z || 0); if (ax === 'x') m.rotation.z = H; if (ax === 'z') m.rotation.x = H; m.visible = false; p.add(m); return m;
    };
    var lab = function (t, p, x, y, z, col) {
      if (opt.labels === false) return null;
      var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext && c.getContext('2d'); if (!g) return null;
      g.fillStyle = 'rgba(6,11,25,.85)'; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = col || '#2EE6A6'; g.stroke();
      g.fillStyle = '#F1F5F9'; g.font = 'bold 52px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 64, 68);
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
      s.scale.set(.1, .1, 1); s.position.set(x, y, z); s.renderOrder = 9; p.add(s); labels.push(s); return s;
    };
    /* célula: piso, grade, faixa de segurança, bancada e área de destino */
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), M(0x161c23, 0, .9)); fl.receiveShadow = true; W.add(fl);
    var gr = new THREE.GridHelper(4, 20, 0x2d3a46, 0x1f2a34); gr.rotation.x = H; gr.position.z = .001; W.add(gr);
    var hz = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.08, 72), new THREE.MeshBasicMaterial({ color: 0xf9c823 })); hz.position.z = .003; W.add(hz);
    var B = K.BENCH, bw = (B.max[0] - B.min[0]) / 1000, bd = (B.max[1] - B.min[1]) / 1000, bcx = (B.max[0] + B.min[0]) / 2000, bcy = (B.max[1] + B.min[1]) / 2000;
    var BH = (B.max[2] - 30) / 1000;
    add(bx(bw, bd, BH), M(0x3a4756, .4, .6), W, bcx, bcy, BH / 2); add(bx(bw + .02, bd + .02, .03), GR, W, bcx, bcy, B.max[2] / 1000 - .015);
    var dz = new THREE.Mesh(bx(.09, .09, .002), new THREE.MeshBasicMaterial({ color: 0x2ee59d, transparent: true, opacity: .45 }));
    dz.position.set(K.PEC.dest[0] / 1000, K.PEC.dest[1] / 1000, B.max[2] / 1000 + .001); W.add(dz);
    var piece = add(bx(.04, .04, .04), new THREE.MeshStandardMaterial({ color: 0x00d4ff, metalness: .1, roughness: .4, emissive: 0x003344 }), W);
    if (opt.axes !== false) {
      var ax = new THREE.AxesHelper(.3); ax.position.set(-.32, -.32, .032); W.add(ax);
      lab('X', W, 0, -.32, .032, '#ff5a5a'); lab('Y', W, -.32, -.02, .032, '#59f0a8'); lab('Z', W, -.32, -.32, .34, '#6fa8ff');
    }
    /* base e A1 */
    add(bx(.56, .56, .03), DK, W, 0, 0, .015); add(cy(.2, .22, .1), GR, W, 0, 0, .08, H);
    var g1 = new THREE.Group(); W.add(g1);
    add(cy(.17, .17, .26), OR, g1, 0, 0, .23, H); add(bx(.2, .27, .3), OR, g1, .02, 0, .33);
    rings[0] = ring(g1, 'z', .2, .28, 0, 0, .23); lab('A1', g1, 0, -.24, .23);
    /* A2: ombro */
    var g2 = new THREE.Group(); g2.position.set(.025, 0, .4); g1.add(g2);
    add(cy(.12, .12, .34), DK, g2); add(bx(.44, .15, .13), OR, g2, .22, 0, 0); add(cy(.075, .075, .15), OR, g2, 0, 0, 0);
    rings[1] = ring(g2, 'y', .17, .38); lab('A2', g2, 0, -.22, 0);
    /* A3: cotovelo */
    var g3 = new THREE.Group(); g3.position.set(.44, 0, 0); g2.add(g3);
    add(cy(.09, .09, .22), DK, g3); add(cy(.05, .08, .42), OR, g3, .21, 0, 0, 0, 0, -H);
    rings[2] = ring(g3, 'y', .12, .26); lab('A3', g3, 0, -.2, 0);
    /* A4, A5, A6: punho esférico */
    var g4 = new THREE.Group(); g4.position.set(.42, 0, 0); g3.add(g4);
    add(cy(.06, .06, .1), DK, g4, .03, 0, 0, 0, 0, H); rings[3] = ring(g4, 'x', .09, .14, .03); lab('A4', g4, .03, -.14, .08);
    var g5 = new THREE.Group(); g4.add(g5);
    add(cy(.055, .055, .15), OR, g5); add(bx(.1, .09, .09), OR, g5, .05, 0, 0); rings[4] = ring(g5, 'y', .08, .17); lab('A5', g5, 0, -.14, -.05);
    var g6 = new THREE.Group(); g5.add(g6);
    add(cy(.045, .045, .05), GR, g6, .1, 0, 0, 0, 0, H); add(bx(.04, .09, .05), DK, g6, .14, 0, 0);
    var f1 = add(bx(.06, .012, .035), GR, g6, .19, .05, 0), f2 = add(bx(.06, .012, .035), GR, g6, .19, -.05, 0);
    add(new THREE.SphereGeometry(.008, 12, 12), M(0xff3030, 0, .5), g6, .22, 0, 0);
    rings[5] = ring(g6, 'x', .065, .07, .1); lab('A6', g6, .12, -.12, 0);
    var tg = new THREE.Mesh(new THREE.SphereGeometry(.022, 20, 20), new THREE.MeshBasicMaterial({ color: 0x2ee59d, transparent: true, opacity: .55 }));
    tg.position.set(.6, .15, .6); tg.visible = false; W.add(tg);
    sc.add(new THREE.HemisphereLight(0xbfd6ff, 0x1a2030, .85));
    var dl = new THREE.DirectionalLight(0xffffff, .95); dl.position.set(2, 4, 2); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024);
    Object.assign(dl.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 }); sc.add(dl);
    return { scene: sc, model: { j: [g1, g2, g3, g4, g5, g6], rings: rings, labels: labels, target: tg, piece: piece, fingers: [f1, f2], dest: dz } };
  }

  /* câmera, renderizador e (opcionalmente) controles de órbita; precisa de WebGL */
  function render(cv, S, opt) {
    opt = opt || {};
    var cam = new THREE.PerspectiveCamera(40, 1, .05, 30), rd = new THREE.WebGLRenderer({ antialias: true });
    rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, opt.pixelMax || 2)); rd.shadowMap.enabled = true; cv.appendChild(rd.domElement);
    var oc = null;
    if (opt.controls) {
      oc = new THREE.OrbitControls(cam, rd.domElement); oc.enableDamping = true; oc.enablePan = false; oc.minDistance = .9; oc.maxDistance = 5; oc.maxPolarAngle = Math.PI / 2 - .03;
    }
    var views = { pad: [1.9, 1.35, 1.7, .4, .55, .1], frente: [3, .9, 0, .35, .55, 0], lado: [.4, .9, 3, .35, .55, 0], topo: [.4, 4.2, .01, .35, 0, 0] };
    var look = [.4, .55, .1];
    function setView(n) {
      var v = views[n]; cam.position.set(v[0], v[1], v[2]); look = [v[3], v[4], v[5]];
      if (oc) { oc.target.set(v[3], v[4], v[5]); oc.update(); } else cam.lookAt(v[3], v[4], v[5]);
    }
    function resize() {
      var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(cv); window.addEventListener('resize', resize);
    setView('pad'); resize();
    return { cam: cam, renderer: rd, setView: setView, resize: resize, look: function () { return look; },
      render: function () { if (oc) oc.update(); rd.render(S.scene, cam); } };
  }

  /* aplica a pose (ângulos em graus), a abertura da garra (mm) e a peça ao modelo */
  function aplicar(m, q, gw, pc) {
    var d = Math.PI / 180, K = root.RoboCin;
    m.j[0].rotation.z = q[0] * d; m.j[1].rotation.y = q[1] * d; m.j[2].rotation.y = q[2] * d;
    m.j[3].rotation.x = q[3] * d; m.j[4].rotation.y = q[4] * d; m.j[5].rotation.x = q[5] * d;
    m.fingers[0].position.y = gw / 1000; m.fingers[1].position.y = -gw / 1000;
    var P = K.pieceWorld(q, pc), R = P.R;
    m.piece.position.set(P.c[0] / 1000, P.c[1] / 1000, P.c[2] / 1000);
    m.piece.quaternion.setFromRotationMatrix(new THREE.Matrix4().set(R[0][0], R[0][1], R[0][2], 0, R[1][0], R[1][1], R[1][2], 0, R[2][0], R[2][1], R[2][2], 0, 0, 0, 0, 1));
    m.piece.material.emissive.setHex(K.graspReady(q, pc) ? 0x00aa66 : 0x003344);
  }
  root.RoboModelo = { cena: cena, render: render, aplicar: aplicar };
})(typeof window !== 'undefined' ? window : this);
