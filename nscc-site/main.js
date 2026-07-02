/* ==========================================================================
   NSCC — main.js
   1. Binary Landmark — the interlocking NC dissolves and reassembles as the
      Old Well inside a reserved plate in the Mission section
   2. Events calendar (Google Calendar API)
   3. Masthead, reveals, smooth scroll
   ========================================================================== */

'use strict';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   1. BINARY LANDMARK
   Both landmarks are sampled from their real SVGs into normalized points.
   Shape A (the NC) is anchored to the hero, so it scrolls away with it;
   shape B (the Old Well) is anchored to the #wellStage plate reserved in the
   Mission layout, so it arrives *into* the page rather than on top of it.
   Scroll drives a row-staggered flight between the two anchors while the
   pointer scatter, ambient drift, and bit flicker keep running throughout.
   ========================================================================== */

const BinaryLandmark = (() => {
    const canvas = document.getElementById('binaryNC');
    const stage = document.getElementById('wellStage');
    const hero = document.querySelector('.hero');
    if (!canvas || !stage || !hero) return null;

    const ctx = canvas.getContext('2d', { alpha: true });
    const SHAPES = [
        { url: './assets/unc-nc.svg', classify: 'lum' },       // NC: real outline color in the SVG
        { url: './assets/old-well.svg', classify: 'boundary' } // Well: single-color, outline detected
    ];

    const COLOR_FILL = 'rgba(75, 156, 211, 0.78)';   // carolina
    const COLOR_EDGE = 'rgba(169, 205, 232, 0.92)';  // sky

    let particles = [];
    let dpr = 1, vw = 0, vh = 0;
    let fontPx = 10;
    let running = false, visible = true, rafId = null;
    let pointer = { x: -9999, y: -9999, active: false };
    let lastT = 0;
    let frameCount = 0, slowFrames = 0, degraded = false;
    let imgs = [], loaded = false;
    let morph = 0, targetMorph = 0, canvasAlpha = 1;
    let heroAnchor = { x: 0, y: 0, w: 1, h: 1 }; // page coords
    let wellAspect = 61 / 49;                    // corrected from the SVG once loaded
    let settled = false;

    const isMobile = () => window.innerWidth < 980;
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smoothstep = (t) => t * t * (3 - 2 * t);

    /* ---------- layout anchors ---------- */

    function ncLayout() {
        const ncAspect = imgs[0].naturalHeight / imgs[0].naturalWidth;
        let w, cx, cy;
        if (isMobile()) {
            w = Math.min(window.innerWidth * 0.64, 270);
            cx = vw / 2;
            cy = Math.min(vh * 0.31, 245);
        } else {
            w = Math.min(vw * 0.44, 620);
            cx = vw * 0.68;
            cy = hero.offsetHeight * 0.52;
        }
        const h = w * ncAspect;
        return { x: cx - w / 2, y: cy - h / 2, w, h };
    }

    // The Old Well's viewport rect: contain-fit inside the reserved plate
    function stageRect() {
        const r = stage.getBoundingClientRect();
        const inset = 0.08;
        const availW = r.width * (1 - inset * 2);
        const availH = r.height * (1 - inset * 2);
        let w = availW, h = w * wellAspect;
        if (h > availH) { h = availH; w = h / wellAspect; }
        return {
            x: r.left + (r.width - w) / 2,
            y: r.top + (r.height - h) / 2,
            w, h,
            top: r.top, bottom: r.bottom
        };
    }

    /* ---------- sampling ---------- */

    function sampleShape(index, targetW, step) {
        const img = imgs[index];
        const aspect = img.naturalHeight / img.naturalWidth;
        const w = Math.max(2, Math.ceil(targetW));
        const h = Math.max(2, Math.ceil(targetW * aspect));

        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.drawImage(img, 0, 0, w, h);
        const data = octx.getImageData(0, 0, w, h).data;

        const solid = (x, y) => {
            if (x < 0 || y < 0 || x >= w || y >= h) return false;
            const i = ((y | 0) * w + (x | 0)) * 4;
            if (data[i + 3] < 120) return false;
            const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
            return lum <= 0.86; // white counters read as empty
        };

        const points = [];
        for (let y = 0; y < h; y += step) {
            for (let x = 0; x < w; x += step) {
                if (!solid(x, y)) continue;

                let tone;
                if (SHAPES[index].classify === 'lum') {
                    const i = ((y | 0) * w + (x | 0)) * 4;
                    const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
                    tone = lum < 0.32 ? 'edge' : 'fill';
                } else {
                    // Single-color shape: points on the silhouette boundary become the outline
                    tone = (solid(x - step, y) && solid(x + step, y) && solid(x, y - step) && solid(x, y + step))
                        ? 'fill' : 'edge';
                }

                points.push({ nx: x / w, ny: y / h, row: (y / step) | 0, tone });
            }
        }

        // Row-major order on both shapes keeps the flight coherent: each
        // horizontal band of the NC becomes a horizontal band of the Well.
        points.sort((a, b) => (a.row - b.row) || (a.nx - b.nx));
        return points;
    }

    function build() {
        if (!loaded) return;
        const nc = ncLayout();
        const st = stageRect();
        const step = (isMobile() ? 11 : 12) * (degraded ? 1.35 : 1);

        const ptsA = sampleShape(0, nc.w, step);

        // Match the Well's particle count to the NC's so no glyphs stack or vanish
        let stepB = step;
        let ptsB = sampleShape(1, st.w, stepB);
        if (ptsA.length && ptsB.length) {
            const ratio = Math.sqrt(ptsB.length / ptsA.length);
            if (Math.abs(1 - ratio) > 0.06) {
                stepB = clamp(stepB * ratio, 4, 40);
                ptsB = sampleShape(1, st.w, stepB);
            }
        }

        const count = Math.max(ptsA.length, ptsB.length, 1);
        const pick = (pts, i) => pts[count <= 1 ? 0 : Math.floor((i / (count - 1)) * (pts.length - 1))] ||
            { nx: 0.5, ny: 0.5, tone: 'fill' };
        const old = particles;
        particles = [];

        for (let i = 0; i < count; i++) {
            const a = pick(ptsA, i);
            const b = pick(ptsB, i);
            const prev = old[i];
            particles.push({
                na: a, nb: b,
                jx: (Math.random() - 0.5) * step * 0.45,
                jy: (Math.random() - 0.5) * step * 0.45,
                delay: a.ny * 0.12 + Math.random() * 0.04,
                toneSwitch: 0.4 + Math.random() * 0.2,
                x: 0, y: 0,
                // Pointer-scatter offset (relaxes to zero); the home position
                // itself is followed rigidly so the structure can't wobble
                ox: prev ? prev.ox : 0, oy: prev ? prev.oy : 0,
                vx: prev ? prev.vx : 0, vy: prev ? prev.vy : 0,
                ch: prev ? prev.ch : (Math.random() < 0.5 ? '0' : '1'),
                flip: prev ? prev.flip : 1500 + Math.random() * 6000,
                phase: prev ? prev.phase : Math.random() * Math.PI * 2,
                speed: prev ? prev.speed : 0.4 + Math.random() * 0.5,
                amp: prev ? prev.amp : 1 + Math.random() * 1.6
            });
        }

        fontPx = Math.max(8, Math.round(step * 0.86));
    }

    /* ---------- scroll state ---------- */

    function updateScrollState() {
        const st = stageRect();

        // Morph tracks the whole scroll journey: 0 at the top of the page,
        // 1 when the plate settles into the upper-middle viewport. Tying it
        // to the full distance keeps the flight glued to the user's scroll
        // instead of snapping once a threshold is crossed.
        const scrollY = window.scrollY || 0;
        const settleDistance = Math.max(1, (st.top + scrollY) - vh * 0.45);
        targetMorph = clamp(scrollY / settleDistance, 0, 1);

        // Fade only once the plate itself is leaving the top of the screen
        canvasAlpha = clamp(st.bottom / (vh * 0.14), 0, 1);

        const heroVisible = scrollY < hero.offsetHeight;
        visible = (heroVisible || st.bottom > -80) && canvasAlpha > 0.01;
        canvas.parentElement.style.opacity = visible ? '1' : '0';

        const isSettled = targetMorph > 0.9;
        if (isSettled !== settled) {
            settled = isSettled;
            stage.classList.toggle('settled', settled);
        }

        if (REDUCED_MOTION) {
            drawStatic();
        } else if (visible) {
            start();
        } else {
            stop();
            ctx.clearRect(0, 0, vw, vh);
        }
    }

    /* ---------- drawing ---------- */

    function homes(eased) {
        // Per-frame anchors: NC rides with the hero, Well rides with its plate
        const s = window.scrollY || 0;
        const a = { x: heroAnchor.x, y: heroAnchor.y - s, w: heroAnchor.w, h: heroAnchor.h };
        const b = stageRect();
        return { a, b, eased };
    }

    function particleHome(p, H) {
        const pe = smoothstep(clamp((H.eased - p.delay) / Math.max(0.001, 1 - p.delay), 0, 1));
        const ax = H.a.x + p.na.nx * H.a.w + p.jx;
        const ay = H.a.y + p.na.ny * H.a.h + p.jy;
        const bx = H.b.x + p.nb.nx * H.b.w + p.jx;
        const by = H.b.y + p.nb.ny * H.b.h + p.jy;
        const flight = Math.sin(Math.PI * pe); // 0 at rest, 1 mid-flight
        return {
            x: lerp(ax, bx, pe),
            y: lerp(ay, by, pe) - flight * 26, // gentle arc while in transit
            pe, flight
        };
    }

    function drawFrame() {
        ctx.clearRect(0, 0, vw, vh);
        if (canvasAlpha <= 0.01) return;

        ctx.globalAlpha = canvasAlpha * (isMobile() ? 0.85 : 1);
        ctx.font = fontPx + "px 'Fragment Mono', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const tone of ['fill', 'edge']) {
            ctx.fillStyle = tone === 'fill' ? COLOR_FILL : COLOR_EDGE;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                if (p.tone !== tone) continue;
                ctx.fillText(p.ch, p.x, p.y);
            }
        }
        ctx.globalAlpha = 1;
    }

    function drawStatic() {
        morph = targetMorph;
        const H = homes(morph);
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const h = particleHome(p, H);
            p.x = h.x;
            p.y = h.y + (h.flight ? h.flight * 26 : 0); // no arc when static
            p.tone = h.pe < p.toneSwitch ? p.na.tone : p.nb.tone;
        }
        drawFrame();
    }

    function tick(t) {
        if (!running) return;
        rafId = requestAnimationFrame(tick);
        const dt = Math.min(t - lastT, 50);
        lastT = t;

        if (!degraded && frameCount < 240) {
            frameCount++;
            if (dt > 26) slowFrames++;
            if (slowFrames > 40) { degraded = true; build(); }
        }

        morph += (targetMorph - morph) * Math.min(1, dt / 80);
        if (Math.abs(targetMorph - morph) < 0.001) morph = targetMorph;

        const time = t * 0.001;
        const H = homes(morph); // linear in scroll; easing lives per-particle
        const px = pointer.x, py = pointer.y;
        const R = 110, R2 = R * R;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const home = particleHome(p, H);

            // Ambient drift belongs to the living NC only — it fades out over
            // the flight so the assembled Well holds perfectly still and rides
            // with its section instead of wobbling.
            const live = 1 - home.pe;
            const driftX = Math.cos(time * p.speed + p.phase) * p.amp * live;
            const driftY = Math.sin(time * p.speed * 0.8 + p.phase) * p.amp * live;

            // Pointer repulsion acts on a separate offset that springs back to
            // zero; the home itself is tracked rigidly (no lag, no overshoot).
            if (pointer.active) {
                const dx = (home.x + p.ox) - px, dy = (home.y + p.oy) - py;
                const d2 = dx * dx + dy * dy;
                if (d2 < R2 && d2 > 0.01) {
                    const d = Math.sqrt(d2);
                    const f = (1 - d / R) * 9;
                    p.vx += (dx / d) * f;
                    p.vy += (dy / d) * f;
                }
            }

            p.vx += -p.ox * 0.05;
            p.vy += -p.oy * 0.05;
            p.vx *= 0.85;
            p.vy *= 0.85;
            p.ox += p.vx;
            p.oy += p.vy;

            p.x = home.x + driftX + p.ox;
            p.y = home.y + driftY + p.oy;

            // Bits churn faster mid-flight
            p.flip -= dt * (1 + home.flight * 4);
            if (p.flip < 0) {
                p.ch = p.ch === '0' ? '1' : '0';
                p.flip = 1500 + Math.random() * 6000;
            }

            p.tone = home.pe < p.toneSwitch ? p.na.tone : p.nb.tone;
        }

        drawFrame();
    }

    /* ---------- lifecycle ---------- */

    function start() {
        if (running || REDUCED_MOTION || !loaded || !visible) return;
        running = true;
        lastT = performance.now();
        rafId = requestAnimationFrame(tick);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    }

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        vw = rect.width || window.innerWidth;
        vh = rect.height || window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (loaded) {
            heroAnchor = ncLayout();
            build();
            updateScrollState();
            if (REDUCED_MOTION) drawStatic();
        }
    }

    function init() {
        let remaining = SHAPES.length;
        imgs = SHAPES.map((shape) => {
            const img = new Image();
            img.onload = () => {
                if (--remaining === 0) {
                    wellAspect = imgs[1].naturalHeight / imgs[1].naturalWidth;
                    loaded = true;
                    resize();
                    if (!REDUCED_MOTION && visible) start();
                }
            };
            img.src = shape.url;
            return img;
        });

        window.addEventListener('resize', () => {
            clearTimeout(canvas._rt);
            canvas._rt = setTimeout(resize, 150);
        });

        window.addEventListener('scroll', updateScrollState, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else if (visible) start();
        });

        window.addEventListener('pointermove', (e) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.active = visible;
        }, { passive: true });

        document.addEventListener('pointerleave', () => {
            pointer.active = false;
            pointer.x = -9999;
        }, { passive: true });

        window.addEventListener('pointerdown', (e) => {
            // Tap ripple on touch: brief strong repulsion
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.active = visible;
            setTimeout(() => { if (e.pointerType !== 'mouse') pointer.active = false; }, 450);
        }, { passive: true });
    }

    init();
    return { start, stop };
})();

/* ==========================================================================
   2. EVENTS CALENDAR — Google Calendar public feed
   ========================================================================== */

const GOOGLE_CALENDAR_API_KEY = 'AIzaSyDTeopE_3cX7jZlpaLY8nXK2DVOS2rn1Yo';
const GOOGLE_CALENDAR_ID = 'info.uncnscc@gmail.com';

let calendarDate = new Date();
let calendarEvents = [];
let selectedDay = null;

async function fetchCalendarEvents() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        calendarEvents = (data.items || []).map(ev => ({
            title: ev.summary || 'Untitled event',
            description: ev.description || '',
            start: ev.start.dateTime || ev.start.date,
            location: ev.location || ''
        }));
    } catch (err) {
        calendarEvents = [];
    }
    return calendarEvents;
}

function getEventsForDay(day) {
    const target = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toDateString();
    return calendarEvents.filter(ev => new Date(ev.start).toDateString() === target);
}

function escapeHTML(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function showEventDetails(day) {
    const el = document.getElementById('eventDetails');
    if (!el) return;
    const events = getEventsForDay(day);
    selectedDay = day;

    document.querySelectorAll('.sig-day.selected').forEach(d => d.classList.remove('selected'));
    const cell = document.querySelector(`.sig-day[data-day="${day}"]`);
    if (cell) cell.classList.add('selected');

    if (!events.length) {
        el.innerHTML = '<p class="cal-empty mono">No events scheduled for this day.</p>';
    } else {
        el.innerHTML = events.map(ev => {
            const start = new Date(ev.start);
            const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return `<div class="cal-event">
                <div class="cal-event-title">${escapeHTML(ev.title)}</div>
                <div class="cal-event-meta mono">${time}${ev.location ? ' · ' + escapeHTML(ev.location) : ''}</div>
                ${ev.description ? `<div class="cal-event-desc">${escapeHTML(ev.description)}</div>` : ''}
            </div>`;
        }).join('');
    }
    el.hidden = false;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function monthEventTotal() {
    return calendarEvents.length;
}

function defaultReadout() {
    const total = monthEventTotal();
    return total
        ? `${MONTH_NAMES[calendarDate.getMonth()].toUpperCase()} · ${total} EVENT${total === 1 ? '' : 'S'} LOGGED · SCAN THE TRACE`
        : 'NO SIGNAL — INSTRUMENT IDLE';
}

function dayReadout(day) {
    const events = getEventsForDay(day);
    const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    const stamp = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    if (!events.length) return `${stamp} · NO EVENTS`;
    const first = new Date(events[0].start);
    const time = first.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${stamp} · ${events.length} EVENT${events.length === 1 ? '' : 'S'} · ${events[0].title.toUpperCase()} ${time}`;
}

async function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const head = document.getElementById('calendarMonthYear');
    if (head) head.textContent = `${MONTH_NAMES[month]} ${year}`;

    await fetchCalendarEvents();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const strip = document.getElementById('signalStrip');
    const axis = document.getElementById('signalAxis');
    const readout = document.getElementById('signalReadout');
    if (!strip) return;

    let html = '<span class="signal-cursor" id="signalCursor" aria-hidden="true"></span>';
    for (let day = 1; day <= daysInMonth; day++) {
        const count = getEventsForDay(day).length;
        const density = Math.min(count, 3);
        const height = count ? 22 + (density / 3) * 74 : 4; // % of strip height
        const isToday = isCurrentMonth && day === today.getDate();
        const label = `${MONTH_NAMES[month]} ${day}: ${count} event${count === 1 ? '' : 's'}`;
        html += `<${count ? 'button type="button"' : 'div'} class="sig-day${count ? ` has-events d${density}` : ''}${isToday ? ' today' : ''}"
            data-day="${day}" aria-label="${label}">
            <span class="sig-bar" style="--h:${height}%"></span>
        </${count ? 'button' : 'div'}>`;
    }
    strip.innerHTML = html;

    if (axis) {
        const ticks = [1, 8, 15, 22, daysInMonth];
        axis.innerHTML = ticks.map(d => `<span>${String(d).padStart(2, '0')}</span>`).join('');
    }
    if (readout) readout.textContent = defaultReadout();

    const details = document.getElementById('eventDetails');
    if (details) { details.hidden = true; details.innerHTML = ''; }
    selectedDay = null;
}

function initCalendar() {
    const strip = document.getElementById('signalStrip');
    if (!strip) return;
    const readout = document.getElementById('signalReadout');

    // Scope crosshair: pointer position maps to a day bin
    strip.addEventListener('pointermove', (e) => {
        const rect = strip.getBoundingClientRect();
        const days = strip.querySelectorAll('.sig-day').length;
        if (!days) return;
        const idx = Math.min(days - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * days)));
        const day = idx + 1;

        const cursor = document.getElementById('signalCursor');
        if (cursor) cursor.style.left = `${((idx + 0.5) / days) * 100}%`;

        strip.querySelectorAll('.sig-day.scan').forEach(d => d.classList.remove('scan'));
        const cell = strip.querySelector(`.sig-day[data-day="${day}"]`);
        if (cell) cell.classList.add('scan');
        if (readout) readout.textContent = dayReadout(day);
    }, { passive: true });

    strip.addEventListener('pointerleave', () => {
        strip.querySelectorAll('.sig-day.scan').forEach(d => d.classList.remove('scan'));
        if (readout) readout.textContent = defaultReadout();
    });

    strip.addEventListener('click', (e) => {
        const cell = e.target.closest('.sig-day.has-events');
        if (cell) showEventDetails(parseInt(cell.dataset.day, 10));
    });

    // Keyboard: buttons are natively focusable/activatable; sync the readout
    strip.addEventListener('focusin', (e) => {
        const cell = e.target.closest('.sig-day.has-events');
        if (cell && readout) readout.textContent = dayReadout(parseInt(cell.dataset.day, 10));
    });

    const prev = document.getElementById('prevMonth');
    const next = document.getElementById('nextMonth');
    if (prev) prev.onclick = () => { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); };
    if (next) next.onclick = () => { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); };

    renderCalendar();
}

/* ==========================================================================
   3. MASTHEAD, REVEALS, SMOOTH SCROLL, DETAILS
   ========================================================================== */

function initMasthead() {
    const masthead = document.getElementById('masthead');
    const onScroll = () => masthead.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const toggle = document.getElementById('navToggle');
    toggle.addEventListener('click', () => {
        const open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open);
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    document.querySelectorAll('.masthead-nav a').forEach(a => {
        a.addEventListener('click', () => {
            document.body.classList.remove('nav-open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

function initReveals() {
    if (REDUCED_MOTION || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal').forEach(el => {
        gsap.from(el, {
            opacity: 0,
            y: 26,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });
}

function initLenis() {
    if (REDUCED_MOTION || !window.Lenis) return;
    if (!window.matchMedia('(pointer: fine)').matches) return; // native scroll on touch

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    } else {
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
    }
}

function initBinStream() {
    const el = document.getElementById('binStream');
    if (!el || REDUCED_MOTION) return;
    setInterval(() => {
        let s = '';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 8; j++) s += Math.random() < 0.5 ? '0' : '1';
            s += ' ';
        }
        el.textContent = s.trim();
    }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    initMasthead();
    initCalendar();
    initReveals();
    initLenis();
    initBinStream();
});
