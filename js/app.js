/* ========================================
   METAMORPHOSIS — APP
   Sistema de monetización con acortadores
   ======================================== */

// ========================================
// CONFIGURACIÓN
// ========================================

const SHORTENER_URLS = [
    "https://cuty.io/Jeanrox",
    "https://cuty.io/gracias48765",
    "https://cuty.io/gracias456",
    "https://cuty.io/gracias4879",
    "https://cuty.io/gracias1548"
];

const STORAGE_KEY = 'metamorphosis_sponsors';
const WAIT_TIME = 3000; // 3 segundos de espera por patrocinador

// ========================================
// UTILIDADES
// ========================================

function getStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : { completed: [] };
    } catch (e) {
        return { completed: [] };
    }
}

function setStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Error guardando en localStorage:', e);
    }
}

function isCompleted(index) {
    const state = getStorage();
    return state.completed.includes(index);
}

function markCompleted(index) {
    const state = getStorage();
    if (!state.completed.includes(index)) {
        state.completed.push(index);
        setStorage(state);
    }
}

function getCompletedCount() {
    return getStorage().completed.length;
}

function allCompleted() {
    return getCompletedCount() === SHORTENER_URLS.length;
}

// ========================================
// NAVBAR - HIDE ON SCROLL
// ========================================

function initNavbar() {
    const nav = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');

    if (!nav) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 100 && currentScroll > lastScroll) {
            nav.classList.add('hidden');
        } else {
            nav.classList.remove('hidden');
        }

        lastScroll = currentScroll;
    }, { passive: true });

    if (toggle) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
        });
    }
}

// ========================================
// SISTEMA DE MONETIZACIÓN
// ========================================

function initMonetization() {
    const btn = document.getElementById('unlockBtn');
    const overlay = document.getElementById('accessOverlay');
    const optionsContainer = document.getElementById('accessOptions');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (!btn || !overlay || !optionsContainer || !progressFill || !progressText) return;

    function updateProgress() {
        const completed = getCompletedCount();
        const total = SHORTENER_URLS.length;
        const percentage = (completed / total) * 100;

        progressFill.style.width = percentage + '%';
        progressText.textContent = `${completed} / ${total}`;

        if (allCompleted()) {
            btn.innerHTML = '📖 ENTRAR A LA GUÍA';
            btn.classList.add('unlocked');
        }
    }

    function renderOptions() {
        optionsContainer.innerHTML = '';

        SHORTENER_URLS.forEach((url, index) => {
            const completed = isCompleted(index);
            
            const option = document.createElement('a');
            option.href = url;
            option.target = '_blank';
            option.className = 'overlay-option' + (completed ? ' completed' : '');
            option.dataset.index = index;
            
            option.innerHTML = `
                <span>🔗 PATROCINADOR ${index + 1}</span>
                <span class="status">${completed ? '✓ COMPLETADO' : '→ VISITAR'}</span>
            `;

            if (!completed) {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleSponsorClick(index, url, option);
                });
            }

            optionsContainer.appendChild(option);
        });
    }

    function handleSponsorClick(index, url, element) {
        // Abrir en nueva pestaña
        window.open(url, '_blank');

        // Deshabilitar el elemento visualmente
        element.style.opacity = '0.5';
        element.style.pointerEvents = 'none';
        element.querySelector('.status').textContent = '⏳ ESPERANDO...';

        // Marcar como completado después del tiempo de espera
        setTimeout(() => {
            markCompleted(index);
            renderOptions();
            updateProgress();

            // Si es el último, mostrar mensaje especial
            if (allCompleted()) {
                showUnlockMessage();
            }
        }, WAIT_TIME);
    }

    function showUnlockMessage() {
        const card = document.querySelector('.overlay-card');
        if (card) {
            card.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                card.style.animation = '';
            }, 500);
        }
    }

    // Inicializar
    renderOptions();
    updateProgress();

    // Botón de acceso (ENTRAR A LA GUÍA)
    const accessBtn = document.querySelector('.btn-access');
    if (accessBtn) {
        accessBtn.addEventListener('click', () => {
            overlay.classList.add('active');
            renderOptions();
            updateProgress();
        });
    }

    // Botón de desbloqueo
    btn.addEventListener('click', () => {
        if (allCompleted()) {
            // Pedir nombre del usuario para la marca de agua
            const userName = prompt('¡Felicidades! 🎉\n\nIngresa tu nombre para personalizar tu guía:');
            if (userName && userName.trim()) {
                // Generar token único
                const token = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
                const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
                
                // Guardar token en localStorage
                localStorage.setItem('guide_token', JSON.stringify({ token, expiry }));
                
                overlay.classList.remove('active');
                // Redirigir a la guía con token y nombre
                window.location.href = 'Guia Lookmacxing.html?user=' + encodeURIComponent(userName.trim()) + '&token=' + token;
            }
        }
    });
}

// ========================================
// REVEAL ON SCROLL
// ========================================

function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.process-step').forEach(el => observer.observe(el));

    const motivacionTitle = document.querySelector('.motivacion-title');
    const motivacionSub = document.querySelector('.motivacion-sub');
    if (motivacionTitle) observer.observe(motivacionTitle);
    if (motivacionSub) observer.observe(motivacionSub);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMonetization();
    initReveal();
});
