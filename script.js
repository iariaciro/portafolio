/* ===== Menú móvil ===== */
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', false);
}));

document.addEventListener('click', e => { if (!nav.contains(e.target) && !menuBtn.contains(e.target)) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });
addEventListener('keydown', e => { if (e.key === 'Escape') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });

/* ===== Header: refuerza el fondo al hacer scroll ===== */
const header = document.getElementById('header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 40), { passive: true });

/* ===== Animaciones de entrada con Intersection Observer ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target); // se anima una sola vez
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 90}ms`; // escalonado sutil
  io.observe(el);
});

/* ===== Trío del hero: cada miniatura abre el video de su tarjeta del portafolio ===== */
document.querySelectorAll('.stack-card').forEach(btn => btn.addEventListener('click', () => {
  const target = [...document.querySelectorAll('.card')].find(c => c.dataset.video === btn.dataset.video);
  if (target) target.click();
}));

/* ===== Rutas: codifica espacios y acentos de los nombres de archivo ===== */
const media = (name) => 'media/' + encodeURIComponent(name);

/* ===== Tarjetas: vista previa muda en hover + modal con sonido al hacer clic ===== */
const modal = document.getElementById('modal');
const modalVideo = document.getElementById('modalVideo');
const modalLoading = document.getElementById('modalLoading');
const heroBg = document.getElementById('heroBg');

document.querySelectorAll('.card').forEach(card => {
  const src = media(card.dataset.video);
  let preview = null;
  // Invitación visual a hacer clic: botón de play + texto
  card.insertAdjacentHTML('beforeend', '<div class="play-badge" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></div>');
  card.querySelector('.card-info').insertAdjacentHTML('beforeend', '<em class="cta-hint">Ver completo</em>');

  card.addEventListener('mouseenter', () => {
    if (!matchMedia('(hover:hover)').matches || modal.open) return;
    if (!preview) {
      preview = document.createElement('video');
      preview.preload = 'metadata'; preview.src = src; preview.muted = true; preview.loop = true; preview.playsInline = true;
      card.prepend(preview);
    }
    preview.play().catch(() => {});
  });
  card.addEventListener('mouseleave', () => { if (preview) { preview.pause(); preview.currentTime = 0; } });

  const open = () => {
    // Libera recursos: pausa todo lo demás para que el modal fluya
    document.querySelectorAll('.card video').forEach(v => v.pause());
    heroBg.pause(); document.getElementById('timeline').pause();
    modalLoading.hidden = false;
    modalVideo.src = src;
    modal.showModal();
    modalVideo.play().catch(() => {});
  };
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});
modalVideo.addEventListener('playing', () => modalLoading.hidden = true);
const closeModal = () => { if (modal.open) modal.close(); };
modal.addEventListener('close', () => {
  modalVideo.pause(); modalVideo.removeAttribute('src'); modalVideo.load();
});
document.getElementById('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); }); // clic fuera

/* ===== Video de la timeline: carga y reproduce solo al entrar en pantalla ===== */
const tl = document.getElementById('timeline');
const soundBtn = document.getElementById('soundBtn');
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) {
    if (!tl.src) tl.src = tl.dataset.src; // carga diferida (el archivo pesa ~38 MB)
    tl.play().catch(() => {});
  } else tl.pause();
}, { threshold: 0.4 }).observe(tl);
soundBtn.addEventListener('click', () => {
  tl.muted = !tl.muted;
  soundBtn.setAttribute('aria-pressed', !tl.muted);
  soundBtn.textContent = tl.muted ? 'Activar sonido' : 'Silenciar';
});

/* ===== Calendario de reservas =====
   Google Calendar > Crear > Programación de citas. Al publicarla, copiá el enlace
   (el de "insertar en tu sitio web" o el enlace público) y pegalo acá. */
const CALENDAR_URL = ''; // ej: 'https://calendar.google.com/calendar/appointments/schedules/XXXX?gv=true'
if (/^https:\/\//.test(CALENDAR_URL)) { // solo acepta enlaces https
  const f = document.createElement('iframe');
  f.src = CALENDAR_URL; f.title = 'Agendar llamada'; f.loading = 'lazy';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  f.style.cssText = 'border:0;width:100%;height:100%;min-height:620px';
  document.getElementById('bookingFrame').replaceChildren(f);
}

/* ===== Email de contacto: no está escrito en el HTML, se arma acá (evita bots que recolectan correos) ===== */
const CONTACT_EMAIL = ''; // ej: 'hola@tudominio.com'
const mailLink = document.getElementById('mailLink');
if (CONTACT_EMAIL) { mailLink.href = 'mailto:' + CONTACT_EMAIL; mailLink.textContent = CONTACT_EMAIL; mailLink.hidden = false; }

/* ===== Titulares: aparecen palabra por palabra (conserva la palabra de acento <em>) ===== */
function splitWords(el) {
  let i = 0;
  const wrap = (txt, tag) => txt.trim().split(/\s+/).filter(Boolean).map(w =>
    `<span class="w"><span style="--i:${i++}">${tag ? `<${tag}>${w}</${tag}>` : w}</span></span>`).join(' ');
  el.innerHTML = [...el.childNodes].map(n => n.nodeType === 3 ? wrap(n.textContent) : wrap(n.textContent, n.tagName.toLowerCase())).filter(Boolean).join(' ');
}
document.querySelectorAll('.split').forEach(splitWords);
// Los títulos de sección se animan al entrar en pantalla
const splitIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); splitIO.unobserve(e.target); }
}), { threshold: 0.4 });
document.querySelectorAll('.section-head h2, .process-text h2').forEach(el => { el.classList.add('split-h'); splitWords(el); splitIO.observe(el); });

/* ===== Barra de progreso de scroll ===== */
const bar = document.getElementById('progress');
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}, { passive: true });

/* ===== Contadores animados en las métricas ===== */
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const counter = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target, end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  counter.unobserve(el);
  if (reduce) return;
  const t0 = performance.now(), dur = 1500;
  (function tick(t) {
    const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + Math.round(end * eased) + suf;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}), { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => counter.observe(el));

/* ===== Luz que sigue al cursor dentro de las tarjetas ===== */
document.querySelectorAll('.service, .testi, .booking-info li').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

/* ===== Inclinación 3D suave en el reel y el video de proceso ===== */
if (!reduce && matchMedia('(hover:hover)').matches) {
  document.querySelectorAll('.process-video').forEach(el => {
    el.addEventListener('animationend', () => el.style.animation = 'none');
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });
}

/* ===== Galería de diseño: visor ampliado ===== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
document.querySelectorAll('.shot').forEach(btn => btn.addEventListener('click', () => {
  const img = btn.querySelector('img');
  lightboxImg.src = img.src; lightboxImg.alt = img.alt;
  lightbox.showModal();
}));
lightbox.addEventListener('click', () => lightbox.close()); // clic en cualquier parte cierra

/* ===== WhatsApp: número y mensaje inicial =====
   Formato internacional, solo dígitos, sin "+", espacios ni guiones. */
const WHATSAPP_NUMBER = ''; // ej: '5491123456789'
const WHATSAPP_MESSAGE = 'Hola Ciro, vi tu portafolio y quiero consultarte por un proyecto.';
if (WHATSAPP_NUMBER) {
  document.getElementById('waBtn').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
} else {
  document.getElementById('waBtn').removeAttribute('target'); // sin número: lleva al calendario
}

/* ===== Video de fondo del hero =====
   Es decorativo, mudo y lento, así que se reproduce siempre. Solo se pausa fuera de pantalla (ahorra batería y datos). */
const playHero = () => heroBg.play().catch(() => {});
new IntersectionObserver(([e]) => { e.isIntersecting ? playHero() : heroBg.pause(); }, { threshold: 0.1 })
  .observe(document.getElementById('inicio'));
heroBg.addEventListener('loadeddata', playHero);
['pointerdown', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, () => { if (heroBg.paused && !modal.open) playHero(); }, { once: true, passive: true })); // por si el navegador bloquea el autoplay
heroBg.addEventListener('error', () => console.warn('No se pudo cargar el video de fondo (revisá media/web_vid2.mp4 y que esté en H.264).'));

/* ===== Intro: una vez por sesión, y nunca con "reducir movimiento" ===== */
const introEl = document.getElementById('intro');
let introSeen = false;
try { introSeen = !!sessionStorage.getItem('introSeen'); } catch (e) {}
if (introSeen || reduce) introEl.remove();
else {
  document.documentElement.classList.add('intro-on');
  try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
  setTimeout(() => introEl.remove(), 2900);
}

/* ===== Tipografía cinética: se desplaza sola y acelera con la velocidad del scroll ===== */
const kinetic = document.getElementById('kinetic');
const kRows = [...kinetic.querySelectorAll('.k-row')].map(row => {
  const t = row.firstElementChild;
  t.innerHTML = t.innerHTML.repeat(4);                // se repite para que el bucle no tenga huecos
  return { t, dir: +row.dataset.dir, x: 0, init: false };
});
let kActive = false, lastY = scrollY, boost = 0;
new IntersectionObserver(([e]) => kActive = e.isIntersecting).observe(kinetic);
(function kTick() {
  const dv = scrollY - lastY; lastY = scrollY;
  boost = boost * 0.9 + Math.min(Math.abs(dv), 60) * 0.1;
  if (kActive && !reduce) kRows.forEach(r => {
    const w = r.t.scrollWidth / 4;
    if (!r.init) { r.x = -w / 2; r.init = true; }
    r.x += r.dir * (0.6 + boost);
    if (r.x > 0) r.x -= w; else if (r.x < -w) r.x += w;
    r.t.style.transform = `translate3d(${r.x}px,0,0)`;
  });
  requestAnimationFrame(kTick);
})();

/* ===== Cursor propio y botones magnéticos (solo con mouse) ===== */
if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const cur = document.createElement('div');
  cur.className = 'cursor'; document.body.appendChild(cur);
  let tx = -100, ty = -100, cx = tx, cy = ty;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); }, { passive: true });
  document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('.card, .stack-card, .shot'), a = e.target.closest('a, button, summary');
    cur.classList.toggle('view', !!t); cur.classList.toggle('link', !t && !!a);
    cur.dataset.label = t ? (t.classList.contains('shot') ? 'Ampliar' : 'Ver') : '';
  });
  (function loop() { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();

  document.querySelectorAll('.btn, .wa').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
    });
    el.addEventListener('pointerleave', () => el.style.translate = '');
  });
}

/* ===== Año del footer ===== */
document.getElementById('year').textContent = new Date().getFullYear();
