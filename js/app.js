/* ========================================
   METAMORPHOSIS — APP
   Sistema de acceso + animaciones
   ======================================== */

// ========================================
// ACCESO A LA GUÍA
// ========================================
function initNavbar() {
    var nav = document.getElementById('navbar');
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (nav) {
        var lastScroll = 0;
        window.addEventListener('scroll', function () {
            var currentScroll = window.scrollY;
            if (currentScroll > 120 && currentScroll > lastScroll) nav.classList.add('hidden');
            else nav.classList.remove('hidden');
            lastScroll = currentScroll;
        }, { passive: true });
    }
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = toggle.classList.toggle('active');
            links.classList.toggle('is-open', open);
            if (nav) nav.classList.remove('hidden');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                toggle.classList.remove('active'); links.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && links.classList.contains('is-open')) {
                toggle.classList.remove('active'); links.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}
function initSupportCopy() {
    var status = document.querySelector('.support-copy-status');
    document.querySelectorAll('[data-copy-value]').forEach(function (button) {
        button.addEventListener('click', function () {
            var value = button.getAttribute('data-copy-value');
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                if (status) status.textContent = 'Copia el dato directamente desde la tarjeta.';
                return;
            }
            navigator.clipboard.writeText(value).then(function () {
                if (status) status.textContent = 'Dato copiado.';
            }).catch(function () {
                if (status) status.textContent = 'No se pudo copiar. Selecciona el dato manualmente.';
            });
        });
    });
}
function initAccess() {
    document.querySelectorAll('[data-open-access]').forEach(function (control) {
        control.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = 'acceso.html';
        });
    });
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
    initSupportCopy();
    initReveal();
    initTutorial();
});