/* ========================================
   METAMORPHOSIS — VISOR DE GUÍA
   acceso.html · visor de 67 páginas
   ======================================== */

(function () {
    'use strict';

    var STORAGE_KEY = 'metamorphosis_progress';
    var PRELOAD_AHEAD = 2;
    // Un enlace en los bloques 1, 2, 6 y 7; dos enlaces en los bloques 3, 4 y 5.
    var SECTION_GATES = [
        { id: '5-10', from: 5, to: 10, urls: ['https://cuty.io/Jeanrox'] },
        { id: '11-20', from: 11, to: 20, urls: ['https://cuty.io/gracias456'] },
        { id: '21-27', from: 21, to: 27, urls: ['https://cuty.io/gracias4879', 'https://cuty.io/gracias1548'] },
        { id: '28-31', from: 28, to: 31, urls: ['https://cuty.io/gracias48765', 'https://cuty.io/gracias97946'] },
        { id: '32-38', from: 32, to: 38, urls: ['https://cuty.io/gracias14785', 'https://cuty.io/gracias74125'] },
        { id: '39-45', from: 39, to: 45, urls: ['https://cuty.io/gracias36985'] },
        { id: '46-52', from: 46, to: 52, urls: ['https://cuty.io/gracias10000'] }
    ];

    // Debe coincidir con guia-pages/index.json. Si añades o quitas páginas,
    // regenera con: node js/extract-pages.js
    var TOTAL_PAGES = 67;

    var el = {};
    var current = 1;
    var zoom = 1;
    var lastFocus = null;
    var touchStartX = 0;
    var touchStartY = 0;
    var booted = false;

    function dismissBoot() {
        if (booted || !el.boot) return;
        booted = true;
        el.boot.classList.add('is-done');
    }

    /* ========================================
       ALMACENAMIENTO
       ======================================== */

    function getStorage() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function setStorage(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            /* modo privado: el visor funciona igual, solo no recuerda la página */
        }
    }

    /* ========================================
       PÁGINAS
       ======================================== */

    function gateFor(page) {
        for (var i = 0; i < SECTION_GATES.length; i++) if (page >= SECTION_GATES[i].from && page <= SECTION_GATES[i].to) return SECTION_GATES[i];
        return null;
    }
    function gateIsOpen(gate) {
        var ranges = getStorage().unlockedRanges;
        return !gate || (Array.isArray(ranges) && ranges.indexOf(gate.id) !== -1);
    }
    function showGate(gate) {
        var box = document.getElementById('sectionGate');
        if (!box) {
            box = document.createElement('div');
            box.id = 'sectionGate';
            box.className = 'section-gate';
            box.innerHTML = '<div class="section-gate-card"><span class="section-gate-kicker">METAMORPHOSIS · ACCESO</span><h2></h2><p class="section-gate-progress"></p><div class="section-gate-links"></div><button type="button" class="section-gate-close">VOLVER A LA GUÍA</button></div>';
            document.body.appendChild(box);
            box.addEventListener('click', function (event) { if (event.target === box) box.classList.remove('is-open'); });
        }
        var close = box.querySelector('.section-gate-close');
        box.querySelector('h2').textContent = 'Páginas ' + gate.from + '–' + gate.to;
        var state = getStorage();
        state.openedGateLinks = state.openedGateLinks || {};
        var opened = Array.isArray(state.openedGateLinks[gate.id]) ? state.openedGateLinks[gate.id] : [];
        var list = box.querySelector('.section-gate-links');
        var progress = box.querySelector('.section-gate-progress');
        list.textContent = '';
        function updateProgress() {
            progress.textContent = gateIsOpen(gate)
                ? 'Bloque desbloqueado. Ya puedes continuar.'
                : 'Abre los ' + gate.urls.length + ' ' + (gate.urls.length === 1 ? 'enlace' : 'enlaces') + ' para desbloquear este bloque (' + opened.length + ' de ' + gate.urls.length + ').';
            close.textContent = gateIsOpen(gate) ? 'ENTRAR AL BLOQUE →' : 'VOLVER A LA GUÍA';
        }
        gate.urls.forEach(function (url, index) {
            var link = document.createElement('a');
            link.className = 'section-gate-link';
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = opened.indexOf(index) !== -1 ? 'ENLACE ' + (index + 1) + ' · ABIERTO ✓' : 'ABRIR ENLACE ' + (index + 1) + ' ↗';
            if (opened.indexOf(index) !== -1) {
                link.classList.add('is-done');
                link.setAttribute('aria-disabled', 'true');
            }
            link.addEventListener('click', function (event) {
                if (opened.indexOf(index) !== -1) { event.preventDefault(); return; }
                opened.push(index);
                state.openedGateLinks[gate.id] = opened;
                if (opened.length >= gate.urls.length) {
                    state.unlockedRanges = Array.isArray(state.unlockedRanges) ? state.unlockedRanges : [];
                    if (state.unlockedRanges.indexOf(gate.id) === -1) state.unlockedRanges.push(gate.id);
                }
                setStorage(state);
                link.textContent = 'ENLACE ' + (index + 1) + ' · ABIERTO ✓';
                link.classList.add('is-done');
                link.setAttribute('aria-disabled', 'true');
                updateProgress();
                if (gateIsOpen(gate)) setTimeout(function () { box.classList.remove('is-open'); goTo(gate.from); }, 300);
            });
            list.appendChild(link);
        });
        close.onclick = function () {
            box.classList.remove('is-open');
            if (gateIsOpen(gate)) goTo(gate.from);
        };
        updateProgress();
        box.classList.add('is-open');
    }
    function pageUrl(page) {
        return 'guia-pages/page-' + String(page).padStart(3, '0') + '.jpg';
    }

    function buildStage() {
        var frag = document.createDocumentFragment();

        for (var i = 1; i <= TOTAL_PAGES; i++) {
            var figure = document.createElement('figure');
            figure.className = 'guide-page';
            figure.setAttribute('data-page', i);
            figure.setAttribute('aria-label', 'Página ' + i + ' de ' + TOTAL_PAGES);

            var img = document.createElement('img');
            img.className = 'guide-img';
            img.alt = 'Guía Metamorphosis — página ' + i;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.draggable = false;
            img.setAttribute(
                'data-src',
                pageUrl(i)
            );

            var caption = document.createElement('figcaption');
            caption.className = 'guide-caption';
            caption.textContent = i + ' / ' + TOTAL_PAGES;

            figure.appendChild(img);
            figure.appendChild(caption);
            frag.appendChild(figure);
        }

        el.stage.appendChild(frag);
        el.pages = Array.prototype.slice.call(
            el.stage.querySelectorAll('.guide-page')
        );
    }

    function loadPage(i) {
        var figure = el.pages[i - 1];
        if (!figure) return;
        var gate = gateFor(i);
        if (!gateIsOpen(gate)) return;

        var img = figure.querySelector('.guide-img');
        if (!img || img.getAttribute('src')) return;

        img.src = img.getAttribute('data-src');
        img.classList.add('is-loading');

        img.addEventListener(
            'load',
            function () {
                img.classList.remove('is-loading');
                figure.classList.add('is-loaded');
                dismissBoot();
            },
            { once: true }
        );

        img.addEventListener(
            'error',
            function () {
                img.classList.remove('is-loading');
                figure.classList.add('is-error');
                dismissBoot();
            },
            { once: true }
        );
    }

    function loadWindow(center) {
        var from = Math.max(1, center - PRELOAD_AHEAD);
        var to = Math.min(TOTAL_PAGES, center + PRELOAD_AHEAD);

        for (var i = from; i <= to; i++) {
            loadPage(i);
        }
    }

    /* ========================================
       NAVEGACIÓN
       ======================================== */

    function goTo(page, behavior) {
        var target = Math.min(TOTAL_PAGES, Math.max(1, page));
        var requestedGate = gateFor(target);
        if (!gateIsOpen(requestedGate)) { showGate(requestedGate); return; }

        if (target === current && el.pages[target - 1]) {
            el.pages[target - 1].scrollIntoView({ block: 'start', behavior: behavior || 'auto' });
            return;
        }

        current = target;
        loadWindow(current);

        var figure = el.pages[current - 1];
        if (figure) {
            figure.scrollIntoView({
                block: 'start',
                behavior: behavior || 'smooth'
            });
        }

        updateChrome();

        var state = getStorage();
        state.lastPage = current;
        setStorage(state);
    }

    function updateChrome() {
        el.counter.textContent = String(current);
        el.total.textContent = String(TOTAL_PAGES);

        var pct = TOTAL_PAGES > 1
            ? ((current - 1) / (TOTAL_PAGES - 1)) * 100
            : 0;

        el.bar.style.width = pct.toFixed(2) + '%';
        el.bar.setAttribute('aria-valuenow', String(Math.round(pct)));

        el.prev.disabled = current <= 1;
        el.next.disabled = current >= TOTAL_PAGES;

        if (current >= TOTAL_PAGES) {
            el.finish.hidden = false;
        } else {
            el.finish.hidden = true;
        }
    }

    function next() {
        if (current < TOTAL_PAGES) goTo(current + 1);
    }

    function prev() {
        if (current > 1) goTo(current - 1);
    }

    /* ========================================
       ZOOM
       ======================================== */

    // Las páginas están a 1200 px de ancho. Por encima del 200% la imagen
// solo se estira y se ve borrosa, así que ahí se para el zoom.
var ZOOM_STEPS = [1, 1.5, 2];

    function setZoom(level) {
        zoom = level;
        el.stage.style.setProperty('--zoom', String(zoom));
        el.stage.classList.toggle('is-zoomed', zoom > 1);
        el.zoomLabel.textContent = Math.round(zoom * 100) + '%';
        el.zoomOut.disabled = zoom <= ZOOM_STEPS[0];
        el.zoomIn.disabled = zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1];
        el.viewport.classList.toggle('is-zoomed', zoom > 1);
    }

    function zoomIn() {
        var idx = ZOOM_STEPS.indexOf(zoom);
        var nextIdx = Math.min(ZOOM_STEPS.length - 1, (idx === -1 ? 0 : idx) + 1);
        setZoom(ZOOM_STEPS[nextIdx]);
    }

    function zoomOut() {
        var idx = ZOOM_STEPS.indexOf(zoom);
        var prevIdx = Math.max(0, (idx === -1 ? 0 : idx) - 1);
        setZoom(ZOOM_STEPS[prevIdx]);
    }

    /* ========================================
       UI
       ======================================== */

    function openPanel() {
        lastFocus = document.activeElement;
        el.panel.classList.add('is-open');
        el.panel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-locked');
        el.panelsBtn.setAttribute('aria-expanded', 'true');
        var firstLink = el.panel.querySelector('a, button');
        if (firstLink) firstLink.focus();
    }

    function closePanel() {
        el.panel.classList.remove('is-open');
        el.panel.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-locked');
        el.panelsBtn.setAttribute('aria-expanded', 'false');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function toggleChrome() {
        el.chrome.classList.toggle('is-hidden');
    }

    function onScroll() {
        var viewportTop = el.viewport.getBoundingClientRect().top;
        var figures = el.pages;

        for (var i = 0; i < figures.length; i++) {
            var rect = figures[i].getBoundingClientRect();
            if (rect.bottom > viewportTop + 40 && rect.top < viewportTop + el.viewport.clientHeight - 40) {
                var pageNum = i + 1;
                var gate = gateFor(pageNum);
                if (!gateIsOpen(gate)) {
                    el.pages[gate.from - 1].scrollIntoView({ block: 'start', behavior: 'auto' });
                    showGate(gate);
                    return;
                }
                if (pageNum !== current) {
                    current = pageNum;
                    loadWindow(current);
                    updateChrome();
                }
                return;
            }
        }
    }

    /* ========================================
       EVENTOS
       ======================================== */

    function bind() {
        el.prev.addEventListener('click', prev);
        el.next.addEventListener('click', next);
        el.zoomIn.addEventListener('click', zoomIn);
        el.zoomOut.addEventListener('click', zoomOut);

        el.toggle.addEventListener('click', toggleChrome);
        el.panelsBtn.addEventListener('click', openPanel);
        el.closePanel.addEventListener('click', closePanel);

        el.back.addEventListener('click', function (ev) {
            if (history.length > 1) {
                history.back();
            } else {
                window.location.href = 'index.html';
            }
        });

        // saltos desde el panel lateral
        el.panel.querySelectorAll('[data-jump]').forEach(function (link) {
            link.addEventListener('click', function (ev) {
                ev.preventDefault();
                var page = parseInt(link.getAttribute('data-jump'), 10);
                if (!isNaN(page)) {
                    setZoom(1);
                    goTo(page);
                }
                closePanel();
            });
        });

        el.stage.addEventListener('contextmenu', function (event) {
            if (event.target.closest && event.target.closest('.guide-img')) event.preventDefault();
        });
        el.stage.addEventListener('dragstart', function (event) {
            if (event.target.closest && event.target.closest('.guide-img')) event.preventDefault();
        });
        el.stage.addEventListener('copy', function (event) { event.preventDefault(); });

        var scrollEl = el.viewport;
        scrollEl.addEventListener('scroll', onScroll, { passive: true });

        document.addEventListener('keydown', function (ev) {
            if ((ev.ctrlKey || ev.metaKey) && ['s', 'u'].indexOf(ev.key.toLowerCase()) !== -1) {
                ev.preventDefault();
                return;
            }
            if (ev.key === 'Escape' && el.panel.classList.contains('is-open')) {
                closePanel();
                return;
            }

            if (el.panel.classList.contains('is-open')) return;

            switch (ev.key) {
                case 'ArrowRight':
                case 'PageDown':
                    ev.preventDefault();
                    next();
                    break;
                case 'ArrowLeft':
                case 'PageUp':
                    ev.preventDefault();
                    prev();
                    break;
                case 'Home':
                    ev.preventDefault();
                    goTo(1);
                    break;
                case 'End':
                    ev.preventDefault();
                    goTo(TOTAL_PAGES);
                    break;
                case '+':
                case '=':
                    ev.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    ev.preventDefault();
                    zoomOut();
                    break;
                case 'Escape':
                    toggleChrome();
                    break;
            }
        });

        // swipe horizontal para pasar de página
        scrollEl.addEventListener('touchstart', function (ev) {
            if (ev.touches.length !== 1) return;
            touchStartX = ev.touches[0].clientX;
            touchStartY = ev.touches[0].clientY;
        }, { passive: true });

        scrollEl.addEventListener('touchend', function (ev) {
            if (!ev.changedTouches.length) return;
            if (zoom > 1) return;

            var dx = ev.changedTouches[0].clientX - touchStartX;
            var dy = ev.changedTouches[0].clientY - touchStartY;

            if (Math.abs(dx) < 55) return;
            if (Math.abs(dx) < Math.abs(dy)) return;

            if (dx < 0) next();
            else prev();
        }, { passive: true });
    }

    /* ========================================
       INIT
       ======================================== */

    /* ========================================
   CONTROL DE ACCESO POR BLOQUES
   Las páginas abiertas no requieren enlace.
   ======================================== */

function requireAccess() { return true; }

    function init() {
        if (!requireAccess()) return;

        el.viewport = document.getElementById('guideViewport');
        el.stage = document.getElementById('guideStage');
        el.boot = document.getElementById('guideBoot');
        el.chrome = document.getElementById('guideChrome');
        el.counter = document.getElementById('guideCounter');
        el.total = document.getElementById('guideTotal');
        el.bar = document.getElementById('guideBar');
        el.prev = document.getElementById('guidePrev');
        el.next = document.getElementById('guideNext');
        el.zoomIn = document.getElementById('guideZoomIn');
        el.zoomOut = document.getElementById('guideZoomOut');
        el.zoomLabel = document.getElementById('guideZoomLabel');
        el.finish = document.getElementById('guideFinish');
        el.nav = document.getElementById('guideNav');
        el.toggle = document.getElementById('guideToggleChrome');
        el.panel = document.getElementById('guidePanel');
        el.panelsBtn = document.getElementById('guidePanelsBtn');
        el.closePanel = document.getElementById('guideClosePanel');
        el.back = document.getElementById('guideBack');

        buildStage();

        el.total.textContent = String(TOTAL_PAGES);

        var state = getStorage();
        var startAt = parseInt(state.lastPage, 10);
        current = isNaN(startAt) ? 1 : Math.min(TOTAL_PAGES, Math.max(1, startAt));
        var savedGate = gateFor(current);
        if (!gateIsOpen(savedGate)) current = 1;

        loadWindow(current);
        setZoom(1);
        goTo(current, 'auto');
        bind();

        // red lenta o imagen bloqueada: no dejar el overlay pegado
        setTimeout(dismissBoot, 6000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();