/* SanaBowl · Bewegung, erster Blick, Leiste, Zahl, Fenster
   Bewegung aus der Vorlage Bareiss (bareiss.js Teil 1–3, abgenommen 13.11.2026): jedes Stück einzeln von unten, Foto zoomt in den Rahmen,
   Überschriften zeilenweise aus dem Schlitz. Eigene Idee des Hauses: In jeder Bowl-Karte legen sich die Toppings nacheinander auf die Base.
   Nur transform und opacity, nativer Scroll. */
(function () {
  var D = document, H = D.documentElement, ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  H.classList.add('js');

  /* 1 Erster Blick: Seite bleibt verdeckt, bis Bilder im ersten Bildschirm und beide Schriften fertig sind */
  function imBild(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 2; }
  var schrift = !(D.fonts && D.fonts.load), bilderFertig = false;
  if (!schrift) Promise.all([D.fonts.load('500 1em Rund'), D.fonts.load('400 1em Karte')]).then(function () { return D.fonts.ready; }, function () {}).then(function () { schrift = true; if (bilderFertig) zeigen(); });
  function zeigen() {
    bilderFertig = true; if (!schrift) return;
    if (H.classList.contains('bereit')) return;
    H.classList.add('bereit'); H.classList.remove('laed');
    D.dispatchEvent(new Event('sana:bereit'));
  }
  function warten() {
    var erste = [].slice.call(D.querySelectorAll('img')).filter(imBild);
    erste.forEach(function (i) { i.loading = 'eager'; i.decoding = 'sync'; });
    var offen = erste.filter(function (i) { return !(i.complete && i.naturalWidth); }).length;
    if (!offen) return zeigen();
    erste.forEach(function (i) {
      if (i.complete && i.naturalWidth) return;
      var f = function () { if (--offen <= 0) zeigen(); };
      i.addEventListener('load', f, { once: true }); i.addEventListener('error', f, { once: true });
    });
    setTimeout(zeigen, 6000);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', warten); else warten();

  /* 2 Überschriften in Zeilen für den Schlitz */
  function zeilen(h) {
    if (h.dataset.z) return; h.dataset.z = '1';
    var woerter = [];
    h.textContent.split(/\s+/).forEach(function (w) { if (w) woerter.push(w); });
    h.textContent = '';
    var spans = woerter.map(function (w) { var s = D.createElement('span'); s.textContent = w; s.style.whiteSpace = 'nowrap'; h.appendChild(s); h.appendChild(D.createTextNode(' ')); return s; });
    var rows = [], top = null;
    spans.forEach(function (s, i) { var t = s.offsetTop; if (top === null || Math.abs(t - top) > 4) { top = t; rows.push([]); } rows[rows.length - 1].push(woerter[i]); });
    h.textContent = '';
    rows.forEach(function (r, i) {
      var z = D.createElement('span'); z.className = 'zl';
      var inn = D.createElement('span'); inn.className = 'zi'; inn.style.setProperty('--z', i); inn.textContent = r.join(' ');
      z.appendChild(inn); h.appendChild(z);
    });
  }

  /* 3 Auftritte: Stück für Stück, erst mit fertigem Bild */
  function bereit(el, dann) {
    var ims = [].filter.call(el.tagName === 'IMG' ? [el] : el.querySelectorAll('img'), function (im) { return im.offsetParent !== null; });
    var n = ims.length, los = false, fertig = function () { if (!los) { los = true; dann(); } };
    if (!n) return fertig();
    var eins = function () { if (--n <= 0) fertig(); };
    ims.forEach(function (im) {
      var ent = function () { (im.decode ? im.decode() : Promise.resolve()).then(eins, eins); };
      if (im.complete && im.naturalWidth > 1) return ent();
      im.loading = 'eager'; im.addEventListener('load', ent, { once: true }); im.addEventListener('error', eins, { once: true });
    });
    setTimeout(fertig, 2500);
  }
  function sichtbar(e) { return !!(e.offsetParent || e.getClientRects().length); }
  var STUECK = '.rahmen, .fkarte, h3, p, ul, dl, .liste, blockquote, .knoepfe, .bowl, .stimme, .zahl, .extras, .gruppe__tafel>small';
  var EIGEN = '.auftakt, .skopf, .fenster, .fuss, .leiste, .fkarte, .bowl, .stimme, .extras, .zahl';
  function markieren() {
    D.querySelectorAll('main section:not(.fenster):not(.auftakt):not(.skopf)').forEach(function (sek) {
      sek.querySelectorAll('h2').forEach(function (h) { h.setAttribute('data-schlitz', ''); });
      sek.querySelectorAll(STUECK).forEach(function (e) {
        if (e.parentElement.closest(EIGEN) || e.closest('[data-schlitz]')) return;
        if (e.parentElement.closest('.liste,ul,dl,blockquote')) return;
        if (!sichtbar(e)) return;
        /* Längere Sätze rollen Zeile für Zeile aus dem Schlitz (Vorlage Bareiss, Robert 23.11.2026) */
        if (e.tagName === 'P' && e.textContent.trim().length >= 30 && !e.children.length && !(e.previousElementSibling && /^H[34]$/.test(e.previousElementSibling.tagName))) { e.setAttribute('data-schlitz', ''); return; }
        e.setAttribute('data-r', e.matches('.rahmen, .fkarte') ? 'b' : 't');
        var i = 0, v = e.previousElementSibling; while (v && i < 5) { if (v.hasAttribute('data-r')) i++; v = v.previousElementSibling; }
        if (i) e.style.setProperty('--i', i);
      });
    });
    /* Bowl-Brett: Reihe für Reihe von links nach rechts */
    D.querySelectorAll('.bowl__belag').forEach(function (b) { [].forEach.call(b.children, function (s, k) { s.style.setProperty('--k', k); }); });
  }
  function auftritte() {
    if (ruhig) { D.querySelectorAll('[data-r],[data-schlitz],.bowl').forEach(function (e) { e.classList.add('da'); }); return; }
    markieren();
    D.querySelectorAll('[data-schlitz]').forEach(function (h) { if (sichtbar(h)) zeilen(h); });
    var vor = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; vor.unobserve(e.target); var im = e.target; im.loading = 'eager'; if (im.decode) im.decode().catch(function () {}); });
    }, { rootMargin: '0px 0px 250% 0px' });  /* Bilder zweieinhalb Bildschirme vorher holen und entpacken, damit kein Auftritt auf das Laden wartet */
    D.querySelectorAll('main img[loading="lazy"]').forEach(function (im) { vor.observe(im); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        bereit(e.target, function () { e.target.classList.add('da'); if (e.target.classList.contains('zahl')) zaehlen(e.target); });
      });
    }, { rootMargin: '0px 0px 12% 0px' });
    /* Bowl-Fotos wie das Bilder-Brett beim Hotel Bareiss (bareiss.js, iof): knapp vor dem Rand, ohne Staffelung, beim Hereinkommen sichtbar hoch (Robert 23.11.2026) */
    var FRUEH = '.brett>[data-r], .formen__raster>[data-r]';
    var iof = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting && e.boundingClientRect.bottom >= 0) return; iof.unobserve(e.target); bereit(e.target, function () { e.target.classList.add('da'); }); });
    }, { rootMargin: '0px 0px 6% 0px', threshold: 0 });
    D.querySelectorAll('[data-r],[data-schlitz]').forEach(function (e) { if (e.matches(FRUEH)) { e.style.setProperty('--i', 0); iof.observe(e); } else io.observe(e); });
  }
  D.addEventListener('sana:bereit', function () { if (D.fonts) D.fonts.ready.then(auftritte); else auftritte(); });
  /* 3c Gleiten (Vorlage Bareiss): jedes Foto wandert beim Scrollen sacht in seinem Rahmen, im Takt des Scrollens (Scroll-Zeitachse) */
  if (!ruhig && window.CSS && CSS.supports('animation-timeline: view()')) {
    D.querySelectorAll('main .rahmen').forEach(function (f) {
      if (f.closest('.fenster, .auftakt, .tl, .tlk') || f.querySelectorAll('img').length !== 1) return;
      f.classList.add('gl');
      for (var e = f.parentElement; e && e !== D.body; e = e.parentElement) { var cs = getComputedStyle(e); if (cs.overflowX === 'hidden' || cs.overflowY === 'hidden') e.classList.add('gl-clip'); }
    });
  }
  /* 3b Fenster (Vorlage Bareiss): der Satz rollt aus dem Schlitz, sobald das Fenster gut im Bild ist */
  function fensterSaetze() {
    var fs = D.querySelectorAll('.fenster'); if (!fs.length) return;
    fs.forEach(function (f) { f.querySelectorAll('.fenster__satz p').forEach(function (p) { p.setAttribute('data-schlitz', ''); if (!ruhig) zeilen(p); else p.classList.add('da'); }); });
    if (ruhig) return;
    var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.querySelectorAll('[data-schlitz]').forEach(function (z) { z.classList.add('da'); }); sio.unobserve(e.target); } }); }, { rootMargin: '0px 0px -55% 0px' });
    fs.forEach(function (f) { sio.observe(f); });
  }
  D.addEventListener('sana:bereit', function () { if (D.fonts) D.fonts.ready.then(fensterSaetze); else fensterSaetze(); });

  /* 4 Grosse Zahl zählt hoch (Google-Bewertung) */
  function zaehlen(el) {
    var b = el.querySelector('b'); if (!b || ruhig) return;
    var ziel = parseFloat(b.dataset.ziel), stellen = (b.dataset.ziel.split('.')[1] || '').length, t0 = null, dauer = 1400;
    function schritt(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dauer), e = 1 - Math.pow(1 - p, 3); b.textContent = (ziel * e).toFixed(stellen); if (p < 1) requestAnimationFrame(schritt); }
    b.textContent = (0).toFixed(stellen); requestAnimationFrame(schritt);
  }

  /* 5 Leiste: weg beim Hinunterscrollen, zurück beim Hinaufscrollen, spätestens am Ende des Auftakts */
  var leiste = D.querySelector('.leiste'), letzt = scrollY, tick = false;
  if (leiste) addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var y = scrollY, kopf = D.querySelector('.auftakt,.skopf'), ende = kopf ? kopf.offsetHeight - 80 : 400;
      leiste.classList.toggle('fest', y > ende);
      if (y > letzt + 2 && y > 8) leiste.classList.add('weg'); else if (y < letzt - 4 || y < 8) leiste.classList.remove('weg');
      letzt = y; tick = false;
    });
  }, { passive: true });

  /* 6 Umschalter: ein Knopf wechselt alle Preise der Tafel (Hot/Iced, Bowl/Shake) */
  function setzen(box, w) {
    box.setAttribute('data-modus', w);
    box.querySelectorAll('.wahl button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.wahl === w ? 'true' : 'false'); });
  }
  D.querySelectorAll('.umschalt').forEach(function (box) {
    box.querySelectorAll('.wahl button').forEach(function (b) { b.addEventListener('click', function () { setzen(box, b.dataset.wahl); }); });
  });
  /* Sprung aus der Leiste: #smoothie-shakes / #protein-shakes stellen die Form gleich richtig ein */
  function ausAnker() {
    var f = D.querySelector('.formen'); if (!f) return;
    var m = { '#smoothie-bowls': 'bowl', '#smoothie-shakes': 'smoothie', '#protein-shakes': 'protein' }[location.hash];
    if (m) setzen(f, m);
  }
  ausAnker(); addEventListener('hashchange', ausAnker);

  /* 7 Hero Teller: jede Bowl dreht von selbst (16 Grad je Sekunde), Nachbarspalten gegenläufig.
     Scrollen in jede Richtung gibt Schwung dazu, die Drehung läuft nie rückwärts (Robert 23.11.2026: ruhig beim Hin- und Herscrollen).
     Ein Takt, nur transform, läuft nur, solange der Hero sichtbar ist. */
  var tl = D.querySelector('.tl');
  if (tl && !ruhig) {
    tl.classList.add('tl--js');
    var winkel = 0, schwung = 0, letztY = scrollY, letztT = 0, laeuft = false, sicht = true;
    addEventListener('scroll', function () {
      var y = scrollY; schwung += Math.min(Math.abs(y - letztY), 120) * 0.12; letztY = y;
    }, { passive: true });
    function takt(t) {
      if (!sicht || D.hidden) { laeuft = false; letztT = 0; return; }
      var dt = letztT ? Math.min(t - letztT, 50) / 1000 : 0; letztT = t;
      var teil = schwung * (1 - Math.pow(0.004, dt));   /* Schwung klingt weich ab, ca. 0,4 s */
      schwung -= teil;
      winkel = (winkel + 16 * dt + teil) % 3600;
      tl.style.setProperty('--dreh', winkel.toFixed(2) + 'deg');
      requestAnimationFrame(takt);
    }
    function start() { if (!laeuft && sicht && !D.hidden) { laeuft = true; requestAnimationFrame(takt); } }
    new IntersectionObserver(function (es) { sicht = es[0].isIntersecting; start(); }).observe(tl);
    D.addEventListener('visibilitychange', start);
    start();
  }
})();
