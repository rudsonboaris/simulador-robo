/* Cinemática do robô didático de 6 eixos (milímetros e graus).
   Eixos: A1 gira em Z; A2 e A3 em Y; A4 e A6 em X (eixo do braço); A5 em Y. Punho esférico. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RoboCin = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var G = { a1: 25, d1: 400, L2: 440, L3: 420, d6: 100, tool: 120 };
  var LIM = [[-170, 170], [-135, 35], [-120, 158], [-185, 185], [-120, 120], [-350, 350]];
  var HOME = [0, -90, 90, 0, 90, 0];
  var cl = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  function Rx(a) { var c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; }
  function Ry(a) { var c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; }
  function Rz(a) { var c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; }
  function mul(A, B) { var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j]; return C; }
  function mv(A, v) { return [A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2], A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2], A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]]; }
  function tr(A) { return [[A[0][0], A[1][0], A[2][0]], [A[0][1], A[1][1], A[2][1]], [A[0][2], A[1][2], A[2][2]]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function n180(x) { x = ((x % 360) + 360) % 360; return x > 180 ? x - 360 : x; }
  function near(x, ref) { return x + 2 * Math.PI * Math.round((ref - x) / (2 * Math.PI)); }

  /* cinemática direta: posições (mm) e orientação do flange */
  function fk(q) {
    var r = q.map(function (d) { return d * D2R; });
    var R = Rz(r[0]), sh = mv(R, [G.a1, 0, G.d1]);
    R = mul(R, Ry(r[1])); var el = add(sh, mv(R, [G.L2, 0, 0]));
    R = mul(R, Ry(r[2])); var wr = add(el, mv(R, [G.L3, 0, 0]));
    R = mul(mul(mul(R, Rx(r[3])), Ry(r[4])), Rx(r[5]));
    return { shoulder: sh, elbow: el, wrist: wr, tcp: add(wr, mv(R, [G.d6 + G.tool, 0, 0])), R: R };
  }
  /* orientação da ferramenta como A, B, C (rotações em Z, Y, X), no estilo industrial */
  function abc(R) {
    var T = mul(mul(R, Ry(Math.PI / 2)), Rz(Math.PI));
    return [n180(Math.atan2(T[1][0], T[0][0]) * R2D), n180(-Math.asin(cl(T[2][0], -1, 1)) * R2D), n180(Math.atan2(T[2][1], T[2][2]) * R2D)];
  }
  /* devolve null se estiver tudo bem, ou a mensagem do problema */
  function check(q) {
    for (var i = 0; i < 6; i++) if (q[i] < LIM[i][0] - 1e-6 || q[i] > LIM[i][1] + 1e-6) return 'LIMITE A' + (i + 1);
    var f = fk(q);
    if (f.tcp[2] < 15 || f.wrist[2] < 40 || f.elbow[2] < 40) return 'COLISÃO COM O PISO';
    return null;
  }
  /* cinemática inversa analítica (cotovelo para cima, braço à frente) para posição + orientação do flange */
  function ik(pos, Rf, qc) {
    var Dd = G.d6 + G.tool, pw = [pos[0] - Rf[0][0] * Dd, pos[1] - Rf[1][0] * Dd, pos[2] - Rf[2][0] * Dd];
    var rr = Math.hypot(pw[0], pw[1]);
    var q1 = rr < 1e-6 ? qc[0] * D2R : near(Math.atan2(pw[1], pw[0]), qc[0] * D2R);
    var u = rr - G.a1, v = pw[2] - G.d1, d2 = Math.hypot(u, v);
    if (d2 > G.L2 + G.L3 - 1e-3 || d2 < Math.abs(G.L2 - G.L3) + 1e-3) return { err: 'FORA DO ALCANCE' };
    var E = Math.acos(cl((G.L2 * G.L2 + G.L3 * G.L3 - d2 * d2) / (2 * G.L2 * G.L3), -1, 1)), q3 = Math.PI - E;
    var de = Math.acos(cl((G.L2 * G.L2 + d2 * d2 - G.L3 * G.L3) / (2 * G.L2 * d2), -1, 1));
    var q2 = -(Math.atan2(v, u) + de);
    var M = mul(tr(mul(Rz(q1), Ry(q2 + q3))), Rf), cb = M[0][0], sb = Math.hypot(M[0][1], M[0][2]), c = [];
    if (sb < 1e-6) { var s = Math.atan2(M[2][1], M[1][1]); c.push([qc[3] * D2R, 0, s - qc[3] * D2R]); }
    else [1, -1].forEach(function (sg) { var b = Math.atan2(sg * sb, cb), sbb = Math.sin(b); c.push([Math.atan2(M[1][0] / sbb, -M[2][0] / sbb), b, Math.atan2(M[0][1] / sbb, M[0][2] / sbb)]); });
    var best = null, bc = 1e9, why = null;
    c.forEach(function (w) {
      var q = [q1 * R2D, q2 * R2D, q3 * R2D, near(w[0], qc[3] * D2R) * R2D, w[1] * R2D, near(w[2], qc[5] * D2R) * R2D];
      var bad = null; for (var i = 0; i < 6; i++) if (q[i] < LIM[i][0] - 1e-6 || q[i] > LIM[i][1] + 1e-6) { bad = 'LIMITE A' + (i + 1); break; }
      if (bad) { why = why || bad; return; }
      var cost = 0; for (var k = 0; k < 6; k++) cost += (q[k] - qc[k]) * (q[k] - qc[k]);
      if (cost < bc) { bc = cost; best = q; }
    });
    return best ? { q: best } : { err: why || 'FORA DO ALCANCE' };
  }

  /* ---------- célula: bancada, peça, garra e colisão (mm) ---------- */
  var BENCH = { min: [480, 120, 0], max: [880, 650, 300] };
  var PEC = { size: 40, half: 20, start: [560, 260, 320], dest: [560, 430, 320] };
  var GRIP = { open: 50, piece: 26, empty: 6, speed: 60 };
  var I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function distBox(p, b) {
    return Math.hypot(Math.max(b.min[0] - p[0], 0, p[0] - b.max[0]), Math.max(b.min[1] - p[1], 0, p[1] - b.max[1]), Math.max(b.min[2] - p[2], 0, p[2] - b.max[2]));
  }
  function inBox(p, b, m) { return p[0] > b.min[0] + m && p[0] < b.max[0] - m && p[1] > b.min[1] + m && p[1] < b.max[1] - m && p[2] > b.min[2] + m && p[2] < b.max[2] - m; }
  function newPiece() { return { c: PEC.start.slice(), att: false, off: null, rel: null, fall: false, vz: 0 }; }
  function pieceWorld(q, pc) {
    if (pc.att) { var f = fk(q); return { c: add(f.tcp, mv(f.R, pc.off)), R: mul(f.R, pc.rel) }; }
    return { c: pc.c, R: I3 };
  }
  /* a ferramenta está sobre a peça, apontando para baixo, com a ponta dos dedos na altura certa? */
  function graspReady(q, pc) {
    if (pc.att || pc.fall) return false;
    var f = fk(q), t = f.tcp, c = pc.c;
    return -f.R[2][0] > 0.9 && Math.abs(t[0] - c[0]) < 15 && Math.abs(t[1] - c[1]) < 15 && t[2] >= c[2] - 12 && t[2] <= c[2] + 20;
  }
  function attach(q, pc) { var f = fk(q), Rt = tr(f.R); pc.off = mv(Rt, sub(pc.c, f.tcp)); pc.rel = Rt; pc.att = true; }
  function release(q, pc) { if (!pc.att) return; pc.c = pieceWorld(q, pc).c.slice(); pc.att = false; pc.fall = true; pc.vz = 0; }
  function support(c) {
    var on = c[0] >= BENCH.min[0] && c[0] <= BENCH.max[0] && c[1] >= BENCH.min[1] && c[1] <= BENCH.max[1] && c[2] >= BENCH.max[2] - 1;
    return on ? BENCH.max[2] + PEC.half : PEC.half;
  }
  function pieceStep(pc, dt) {
    if (!pc.fall) return;
    var sp = support(pc.c); pc.vz += 9810 * dt; pc.c[2] -= pc.vz * dt;
    if (pc.c[2] <= sp) { pc.c[2] = sp; pc.fall = false; pc.vz = 0; }
  }
  function newGrip() { return { gw: GRIP.open, tgt: 0 }; }
  function gripStep(g, dt, pc, q) {
    if (g.tgt) {
      g.gw = Math.max(pc.att ? GRIP.piece : GRIP.empty, g.gw - GRIP.speed * dt);
      if (!pc.att && g.gw <= GRIP.piece + 0.01 && graspReady(q, pc)) { attach(q, pc); g.gw = GRIP.piece; }
    } else g.gw = Math.min(GRIP.open, g.gw + GRIP.speed * dt);
  }
  function setGrip(g, v, pc, q) { if (v === g.tgt) return; g.tgt = v; if (!v) release(q, pc); }
  /* colisão: nível 2 = alarme (parar), nível 1 = proximidade (aviso), 0 = livre */
  function collide(q, gw, pc) {
    var f = fk(q), W = function (l) { return add(f.wrist, mv(f.R, l)); }, tool = [], fing = [], alarm = null, warn = null;
    [-1, 1].forEach(function (s) { [160, 190, 220].forEach(function (x) { [-17.5, 0, 17.5].forEach(function (z) { [-6, 0, 6].forEach(function (dy) { fing.push(W([x, s * gw + dy, z])); }); }); }); });
    [120, 140, 160].forEach(function (x) { [-45, 0, 45].forEach(function (y) { [-25, 25].forEach(function (z) { tool.push(W([x, y, z])); }); }); });
    [[100, 45, 0], [100, -45, 0], [100, 0, 45], [100, 0, -45]].forEach(function (l) { tool.push(W(l)); });
    var all = tool.concat(fing), ready = graspReady(q, pc);
    all.forEach(function (p) {
      var d = distBox(p, BENCH);
      if (d < 4) alarm = alarm || 'COLISÃO COM A BANCADA'; else if (d < 30) warn = warn || 'PERTO DA BANCADA';
    });
    var links = [[add(f.shoulder, mv(Rz(0), [0, 0, 0])), 90], [[(f.shoulder[0] + f.elbow[0]) / 2, (f.shoulder[1] + f.elbow[1]) / 2, (f.shoulder[2] + f.elbow[2]) / 2], 75], [f.elbow, 75],
      [[(f.elbow[0] + f.wrist[0]) / 2, (f.elbow[1] + f.wrist[1]) / 2, (f.elbow[2] + f.wrist[2]) / 2], 65], [f.wrist, 60]];
    links.forEach(function (l) { if (distBox(l[0], BENCH) < l[1]) alarm = alarm || 'COLISÃO COM A BANCADA'; });
    if (!pc.att) {
      var pb = { min: [pc.c[0] - PEC.half, pc.c[1] - PEC.half, pc.c[2] - PEC.half], max: [pc.c[0] + PEC.half, pc.c[1] + PEC.half, pc.c[2] + PEC.half] };
      (ready && gw >= GRIP.piece - 0.01 ? tool : all).forEach(function (p) {
        if (inBox(p, pb, -3)) alarm = alarm || 'COLISÃO COM A PEÇA'; else if (distBox(p, pb) < 30) warn = warn || 'PERTO DA PEÇA';
      });
    } else {
      var P = pieceWorld(q, pc);
      [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { [-1, 1].forEach(function (c) {
        var p = add(P.c, mv(P.R, [a * PEC.half, b * PEC.half, c * PEC.half]));
        if (inBox(p, BENCH, 2)) alarm = alarm || 'COLISÃO DA PEÇA COM A BANCADA';
        if (p[2] < -1) alarm = alarm || 'COLISÃO DA PEÇA COM O PISO';
      }); }); });
    }
    return alarm ? { level: 2, msg: alarm } : warn ? { level: 1, msg: warn } : { level: 0, msg: '' };
  }
  /* demonstração automática (página inicial): pega a peça num ponto e leva ao outro, em linha reta */
  function Demo() {
    var Rd = fk(HOME).R, A = [560, 260], B = [560, 430], Z0 = 420, Z1 = 310;
    var d = { q: HOME.slice(), g: newGrip(), pc: newPiece(), pos: fk(HOME).tcp.slice(), seg: null, plan: null, i: 0, t: 0, p0: null, from: 0, fails: 0 };
    function plan() {
      var s = d.from ? B : A, e = d.from ? A : B; d.from = 1 - d.from;
      return [{ to: [s[0], s[1], Z0], dur: d.pc.c[0] === 0 ? 0.01 : 1.8 }, { to: [s[0], s[1], Z1], dur: 1.1 }, { grip: 1, wait: 0.9 }, { to: [s[0], s[1], Z0], dur: 1.0 },
        { to: [e[0], e[1], Z0], dur: 1.9 }, { to: [e[0], e[1], Z1], dur: 1.1 }, { grip: 0, wait: 0.9 }, { to: [e[0], e[1], Z0], dur: 1.0 }, { wait: 0.8 }];
    }
    d.step = function (dt) {
      if (!d.seg) {
        if (!d.plan || d.i >= d.plan.length) { d.plan = plan(); d.i = 0; }
        d.seg = d.plan[d.i++]; d.t = 0; d.p0 = d.pos.slice();
        if (d.seg.grip !== undefined) setGrip(d.g, d.seg.grip, d.pc, d.q);
      }
      var s = d.seg; d.t += dt;
      if (s.to) {
        var u = Math.min(1, d.t / s.dur), e = u * u * (3 - 2 * u);
        d.pos = [0, 1, 2].map(function (k) { return d.p0[k] + (s.to[k] - d.p0[k]) * e; });
        var r = ik(d.pos, Rd, d.q); if (r.q) d.q = r.q; else d.fails++;
        if (u >= 1) d.seg = null;
      } else if (d.t >= s.wait) d.seg = null;
      gripStep(d.g, dt, d.pc, d.q); pieceStep(d.pc, dt);
    };
    return d;
  }
  return { G: G, LIM: LIM, HOME: HOME, BENCH: BENCH, PEC: PEC, GRIP: GRIP, fk: fk, ik: ik, abc: abc, check: check, n180: n180,
    newPiece: newPiece, pieceWorld: pieceWorld, graspReady: graspReady, pieceStep: pieceStep, newGrip: newGrip, gripStep: gripStep, setGrip: setGrip, collide: collide, Demo: Demo };
});
