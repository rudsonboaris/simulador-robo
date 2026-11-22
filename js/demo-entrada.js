/* Demonstração 3D da tela de entrada (robô pegando e levando a peça, sozinho).
   Carrega o Three.js só depois da página, para o texto aparecer primeiro. */
(function () {
  'use strict';
  var box = document.getElementById('demoBox'), cv = document.getElementById('demoCv'), fb = document.getElementById('demoFb');
  if (!box || !cv) return;
  var base = new URL('./', document.currentScript.src).href;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fallback(e) { if (e) console.warn(e); cv.hidden = true; if (fb) fb.hidden = false; box.classList.add('nogl'); }
  function load(list, done) {
    var i = 0;
    (function next() {
      if (i >= list.length) return done();
      var s = document.createElement('script'); s.src = base + list[i++]; s.onload = next; s.onerror = function () { fallback('falha ao carregar ' + s.src); };
      document.head.appendChild(s);
    })();
  }
  function start() {
    var K = window.RoboCin, S0, S;
    try { S0 = RoboModelo.cena({ labels: false, axes: false }); S = RoboModelo.render(cv, S0, { controls: false, pixelMax: 1.75 }); }
    catch (e) { return fallback(e); }
    var D = K.Demo(), M = S0.model, t0 = performance.now(), last = t0, visible = true, raf = 0;
    function draw(now) {
      var a = 0.9 + 0.65 * Math.sin((now - t0) / 1000 * 0.16);
      S.cam.position.set(.4 + 2.35 * Math.cos(a), 1.3, -.2 + 2.35 * Math.sin(a));
      S.cam.lookAt(.4, .5, -.2);
      RoboModelo.aplicar(M, D.q, D.g.gw, D.pc);
      S.render();
    }
    box.classList.add('ready');
    if (reduce) { for (var k = 0; k < 360; k++) D.step(1 / 60); draw(t0); window.addEventListener('resize', function () { draw(t0); }); return; }
    function frame(now) {
      raf = 0; var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (visible && !document.hidden) { D.step(dt); draw(now); }
      raf = requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(box);
    raf = requestAnimationFrame(frame);
  }
  function go() { load(['vendor/three.min.js', 'robo-cinematica.js', 'robo-modelo.js'], start); }
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
