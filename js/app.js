/* ========================================
   METAMORPHOSIS — APP
   Sistema de acceso + animaciones
   ======================================== */

// ========================================
// CONFIGURACIÓN
// ========================================

// Los 5 nodos de acceso. Cada uno se abre UNA vez por visitante.
// Si añades uno nuevo, basta con añadirlo aquí: el checklist se ajusta solo.
var ACCESS_NODES = [
    { id: 'A', url: 'https://cuty.io/gracias48765' },
    { id: 'B', url: 'https://cuty.io/gracias1548' },
    { id: 'C', url: 'https://cuty.io/gracias4879' },
    { id: 'D', url: 'https://cuty.io/gracias456' },
    { id: 'E', url: 'https://cuty.io/Jeanrox' }
];

var NODE_LABELS = [
    { name: 'NODO A', done: 'Revisado', pending: 'Pendiente', current: 'Abrir ahora' },
    { name: 'NODO B', done: 'Revisado', pending: 'Pendiente', current: 'Abrir ahora' },
    { name: 'NODO C', done: 'Revisado', pending: 'Pendiente', current: 'Abrir ahora' },
    { name: 'NODO D', done: 'Revisado', pending: 'Pendiente', current: 'Abrir ahora' },
    { name: 'NODO E', done: 'Revisado', pending: 'Pendiente', current: 'Abrir ahora' }
];

var STORAGE_KEY = 'metamorphosis_progress';

// El visitante tiene que recorrer los 5 nodos, uno detrás de otro.
// Con 5 nodos, el requisito es abrir los 5.
var CLICKS_REQUIRED = ACCESS_NODES.length;

var AD_NOTICE =
    'Cada nodo abre un enlace patrocinado que puede mostrar publicidad. ' +
    'Vuelve a esta pestaña tras abrirlo para marcarlo y seguir con el siguiente.';

// ========================================
// UTILIDADES
// ========================================

function getStorage() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : defaultState();
    } catch (e) {
        return defaultState();
    }
}

function setStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        return false;
    }
}

function defaultState() {
    return { done: [], unlocked: false };
}

// ========================================
// ESTADO
// ========================================

function getState() {
    var state = getStorage();

    // `done` es la lista de índices de nodos ya revisados por este visitante.
    // Se sanea por si alguien manipula localStorage: fuera de rango, duplicados
    // o un formato antiguo (que usaba `clicks`).
    var rawDone = Array.isArray(state.done) ? state.done : [];
    var done = [];

    for (var i = 0; i < rawDone.length; i++) {
        var n = rawDone[i];
        if (typeof n === 'number' && !isNaN(n) && n >= 0 &&
            n < ACCESS_NODES.length && done.indexOf(n) === -1) {
            done.push(n);
        }
    }

    done.sort(function (a, b) { return a - b; });
    state.done = done;
    state.clicks = done.length;

    // Con los 5 revisados se desbloquea. También se acepta `unlocked` previo
    // para no perderle el acceso a quien ya lo tenía.
    state.unlocked =
        state.unlocked === true || done.length >= CLICKS_REQUIRED;

    return state;
}

function setState(state) {
    return setStorage(state);
}

// ========================================
// CHECKLIST DE NODOS
// ========================================

function isDone(state, i) {
    return state.done.indexOf(i) !== -1;
}

// El siguiente nodo a abrir: el primero que falte, en orden.
function nextNodeIndex(state) {
    for (var i = 0; i < ACCESS_NODES.length; i++) {
        if (!isDone(state, i)) return i;
    }
    return -1;
}

function isUnlocked(state) {
    return state.unlocked === true || state.done.length >= CLICKS_REQUIRED;
}

// ========================================
// NAVBAR
// ========================================

function initNavbar() {
    var nav = document.getElementById('navbar');
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');

    if (nav) {
        var lastScroll = 0;

        window.addEventListener(
            'scroll',
            function () {
                var currentScroll = window.scrollY;

                if (currentScroll > 120 && currentScroll > lastScroll) {
                    nav.classList.add('hidden');
                } else {
                    nav.classList.remove('hidden');
                }

                lastScroll = currentScroll;
            },
            { passive: true }
        );
    }

    // Menú móvil: el toggle solo giraba las rayas, no.abría nada
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = toggle.classList.toggle('active');
            links.classList.toggle('is-open', open);
            nav.classList.remove('hidden');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                toggle.classList.remove('active');
                links.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && links.classList.contains('is-open')) {
                toggle.classList.remove('active');
                links.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// ========================================
// SISTEMA DE ACCESO
// ========================================

function initAccess() {
    var overlay = document.getElementById('accessOverlay');
    var nodesGrid = document.getElementById('accessNodes');
    var openers = document.querySelectorAll('[data-open-access]');
    var note = document.getElementById('accessNotice');
    var counter = document.getElementById('currentOption');
    var progressText = document.getElementById('accessProgressText');
    var closeBtn = document.getElementById('accessClose');
    var continueBtn = document.getElementById('accessContinue');
    var retryBtn = document.getElementById('accessRetry');
    var adLine = document.getElementById('adNotice');

    if (!overlay || !nodesGrid) return;

    var pendingWindow = null;
    var unlockWatcher = null;
    var lastFocusBeforeOverlay = null;

    if (note) note.textContent = AD_NOTICE;
    if (adLine) adLine.textContent = AD_NOTICE;

    function renderCounter(state) {
        var doneCount = state.done.length;
        var pending = nextNodeIndex(state);

        if (counter) {
            counter.textContent = doneCount < CLICKS_REQUIRED
                ? String(pending + 1)
                : String(CLICKS_REQUIRED);
        }
        if (progressText) {
            progressText.textContent = doneCount < CLICKS_REQUIRED
                ? doneCount + ' de ' + CLICKS_REQUIRED + ' nodos revisados'
                : 'Acceso completado · ' + CLICKS_REQUIRED + ' de ' + CLICKS_REQUIRED;
        }
    }

    function renderNodes(state) {
        nodesGrid.innerHTML = '';
        var pending = nextNodeIndex(state);

        ACCESS_NODES.forEach(function (node, i) {
            var meta = NODE_LABELS[i] || {
                name: 'NODO',
                done: 'Revisado',
                pending: 'Pendiente',
                current: 'Abrir ahora'
            };

            var reviewed = isDone(state, i);
            var isNext = i === pending && !reviewed;

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'access-node';

            // ya revisado -> marcado y fuera; el siguiente -> pulsable;
            // los siguientes -> bloqueados hasta llegar su turno
            if (reviewed) btn.classList.add('is-done');
            else if (isNext) btn.classList.add('is-current');
            else btn.classList.add('is-locked');

            btn.disabled = !isNext;
            btn.setAttribute('aria-pressed', reviewed ? 'true' : 'false');
            btn.setAttribute(
                'aria-label',
                meta.name + ' — ' +
                    (reviewed ? meta.done : isNext ? meta.current : meta.pending)
            );

            var hint = reviewed ? meta.done : isNext ? meta.current : meta.pending;

            btn.innerHTML =
                '<span class="node-check" aria-hidden="true">' +
                    (reviewed ? '&#10003;' : '') +
                '</span>' +
                '<span class="node-id">' + meta.name + '</span>' +
                '<span class="node-hint">' + hint + '</span>' +
                '<span class="node-dot"></span>';

            // Solo el nodo pendiente abre el enlace. Los ya revisados no se
            // vuelven a pedir, que es justo lo que evita el molestar.
            btn.addEventListener('click', function () {
                if (!isNext || isUnlocked(getState())) return;

                // Si el popup se abre, el clic es real: lo marcamos.
                var w = window.open(
                    node.url,
                    '_blank',
                    'noopener,noreferrer'
                );

                if (!w) {
                    // Popup bloqueado: NO cuenta como clic, porque la página
                    // del anuncio nunca llegó a cargarse. Se ofrece el enlace
                    // directo, que sí lo registrará al pulsarse.
                    showFallback(node.url);
                    return;
                }

                markDone();
                showWaiting();
            });

            nodesGrid.appendChild(btn);
        });
    }

    // Marca el nodo que toca como revisado.
    function markDone() {
        var state = getState();
        var pending = nextNodeIndex(state);

        if (pending === -1) return state;

        state.done.push(pending);
        state.done.sort(function (a, b) { return a - b; });
        state.clicks = state.done.length;
        state.unlocked = state.done.length >= CLICKS_REQUIRED;

        setState(state);
        return state;
    }

    function showWaiting() {
        overlay.classList.remove('is-error');
        overlay.classList.add('is-waiting');
        renderCounter(getState());
        renderNodes(getState());

        clearTimeout(pendingWindow);
        clearInterval(unlockWatcher);

        var state = getState();

        // Ya está todo revisado: se ofrece el acceso al instante.
        if (isUnlocked(state)) {
            showUnlocked();
            return;
        }

        // Aún quedan nodos: se espera a que el visitante vuelva de la
        // pestaña del acortador y después se le habilita el siguiente.
        var waited = 0;
        unlockWatcher = setInterval(function () {
            waited += 500;
            if (isUnlocked(getState())) {
                clearInterval(unlockWatcher);
                showUnlocked();
            }
        }, 500);

        pendingWindow = setTimeout(function () {
            clearInterval(unlockWatcher);
            overlay.classList.remove('is-waiting');
            renderCounter(getState());
            renderNodes(getState());
        }, 12000);
    }

    function showFallback(url) {
        overlay.classList.add('is-error');

        var link = document.getElementById('accessErrorLink');
        if (!link) return;

        link.href = url;

        // el enlace directo sí marca el nodo
        link.onclick = function () {
            markDone();
            overlay.classList.remove('is-error');
            showWaiting();
        };
    }

    function showUnlocked() {
        clearInterval(unlockWatcher);
        overlay.classList.remove('is-waiting');

        var state = getState();

        // comprobar ANTES de marcar, si no se muestra el botón de
        // continuar con el acceso sin completar
        if (!isUnlocked(state)) {
            overlay.classList.remove('is-unlocked');
            overlay.classList.add('is-error');

            var remaining = Math.max(0, CLICKS_REQUIRED - state.done.length);
            var pendingNode = nextNodeIndex(state);
            var msg = document.getElementById('accessErrorText');
            if (msg) {
                msg.textContent = pendingNode === -1
                    ? 'Abre los 5 nodos para completar el acceso.'
                    : 'Aún te falta ' + remaining + ' ' +
                      (remaining === 1 ? 'nodo' : 'nodos') +
                      '. Continúa por el ' +
                      (ACCESS_NODES[pendingNode].id) + '.';
            }

            var link = document.getElementById('accessErrorLink');
            if (link) link.href = ACCESS_NODES[nextNodeIndex(state)].url;
            return;
        }

        overlay.classList.remove('is-error');
        overlay.classList.add('is-unlocked');

        if (continueBtn) {
            continueBtn.href = 'acceso.html';
            continueBtn.focus();
        }
    }

    function openOverlay() {
        lastFocusBeforeOverlay = document.activeElement;

        // limpio: si se cerró a medias, no arrastra el aviso de espera
        // ni el de popup bloqueado.
        overlay.classList.remove('is-waiting');
        overlay.classList.remove('is-error');
        overlay.classList.remove('is-unlocked');

        overlay.classList.add('is-active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-locked');

        var state = getState();
        renderCounter(state);
        renderNodes(state);

        if (isUnlocked(state)) {
            overlay.classList.add('is-unlocked');
        }

        // los nodos ya revisados y los bloqueados no admiten foco:
        // hay que enfocar el que toca
        var focusTarget =
            overlay.querySelector('.access-node:not(:disabled)') ||
            overlay.querySelector('button');
        if (focusTarget) focusTarget.focus();
    }

    function closeOverlay() {
        overlay.classList.remove('is-active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-locked');
        clearTimeout(pendingWindow);
        clearInterval(unlockWatcher);
        if (lastFocusBeforeOverlay && lastFocusBeforeOverlay.focus) {
            lastFocusBeforeOverlay.focus();
        }
    }

    var lastFocusBeforeOverlay = null;

    // todos los CTA de la página abren el panel de acceso
    openers.forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
            ev.preventDefault();
            openOverlay();
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (retryBtn) retryBtn.addEventListener('click', openOverlay);

    // al volver de la pestaña del acortador, comprobar si ya desbloqueó
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && overlay.classList.contains('is-active')) {
            if (isUnlocked(getState())) {
                showUnlocked();
            }
        }
    });

    overlay.addEventListener('click', function (ev) {
        if (ev.target === overlay) closeOverlay();
    });

    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && overlay.classList.contains('is-active')) {
            closeOverlay();
        }
    });

    renderCounter(getState());
}

// ========================================
// REVEAL ON SCROLL
// ========================================

function initReveal() {
    var targets = document.querySelectorAll(
        '.process-step, .motivacion-title, .motivacion-sub, .reveal, ' +
        '.area-item, .detail-row, .data-item, .idea-text, .hero-content'
    );

    if (!('IntersectionObserver' in window)) {
        targets.forEach(function (el) { el.classList.add('visible'); });
        return;
    }

    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        }
    );

    targets.forEach(function (el) { observer.observe(el); });
}

// ========================================
// TUTORIAL
// ========================================

function initTutorial() {
    var btn = document.getElementById('tutorialBtn');
    var modal = document.getElementById('tutorialModal');
    var close = document.getElementById('tutorialClose');

    if (!btn || !modal) return;

    function open() {
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-locked');
    }

    function hide() {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-locked');
    }

    btn.addEventListener('click', open);
    if (close) close.addEventListener('click', hide);

    modal.querySelectorAll('[data-close-tutorial]').forEach(function (el) {
        el.addEventListener('click', hide);
    });

    modal.addEventListener('click', function (ev) {
        if (ev.target === modal) hide();
    });

    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && modal.classList.contains('is-active')) {
            hide();
        }
    });
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initNavbar();
    initAccess();
    initReveal();
    initTutorial();
});