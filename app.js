/* ─── app.js – Vue 3 (CDN global build) ─── */
(function () {
    'use strict';

    // ── Config – แก้ชื่อได้ที่นี่ ──────────────────────────────────────
    const CONFIG = {
        recipientName: 'Happy Birthday',  // ชื่อผู้รับ
        senderName: 'คนที่รักเธอ',
    };

    const { createApp, ref, computed, onMounted } = Vue;

    createApp({
        setup() {
            const nameChars = computed(() => CONFIG.recipientName.split(''));

            const gifs = [
                'https://media.tenor.com/76BaX0eo304AAAAj/kitty-kitty-heart.gif',
                'https://media1.tenor.com/m/wVAjxnPa81IAAAAd/cat-cat-gif.gif',
                'https://media1.tenor.com/m/f6ts3WWJa-8AAAAC/funny-cats-funny.gif',
                'https://media1.tenor.com/m/kEZzd8WrRpAAAAAC/peach-peach-and-goma.gif',
                'https://media.tenor.com/C35t4Pf5GlgAAAAi/peach-and-goma-cute.gif',
            ];
            const celebGif = 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif';

            const noCount = ref(0);
            const yesBtnSize = ref(18);
            const currentGif = ref(gifs[0]);
            const answered = ref(false);

            function yesClick() {
                answered.value = true;
                setTimeout(spawnConfetti, 100);
            }

            function noClick() {
                if (noCount.value < gifs.length - 1) {
                    noCount.value++;
                    currentGif.value = gifs[noCount.value];
                }
                yesBtnSize.value += 8;
            }

            function resetApp() {
                noCount.value = 0;
                yesBtnSize.value = 18;
                currentGif.value = gifs[0];
                answered.value = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            function spawnConfetti() {
                const container = document.getElementById('confetti-container');
                if (!container) return;
                const colors = ['#e91e8c', '#ff85c2', '#9c27b0', '#ce93d8', '#ffd700', '#fff'];
                for (let i = 0; i < 90; i++) {
                    const el = document.createElement('div');
                    el.className = 'confetti-piece';
                    el.style.left = Math.random() * 100 + '%';
                    el.style.top = '-10px';
                    el.style.background = colors[Math.floor(Math.random() * colors.length)];
                    el.style.width = (Math.random() * 8 + 5) + 'px';
                    el.style.height = (Math.random() * 8 + 5) + 'px';
                    el.style.borderRadius = Math.random() > .5 ? '50%' : '3px';
                    el.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
                    el.style.animationDelay = (Math.random() * 1.2) + 's';
                    container.appendChild(el);
                    setTimeout(() => el.remove(), 5000);
                }
            }

            onMounted(() => {
                initParticleCanvas();
                initPetals();
                initBentoReveal();
                initCardMouse();
            });

            return { nameChars, currentGif, celebGif, noCount, yesBtnSize, answered, yesClick, noClick, resetApp };
        },
    }).mount('#app');

    /* ── 2D Particle Canvas (background stars) ─────────────────────── */
    function initParticleCanvas() {
        const cv = document.getElementById('particle-canvas');
        if (!cv) return;
        const ctx = cv.getContext('2d');
        const setSize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
        setSize();
        window.addEventListener('resize', setSize);

        const stars = Array.from({ length: 80 }, () => ({
            x: Math.random() * cv.width,
            y: Math.random() * cv.height,
            r: Math.random() * 1.8 + .3,
            dx: (Math.random() - .5) * .3,
            dy: (Math.random() - .5) * .3,
            op: Math.random() * .5 + .2,
            col: ['#ff85c2', '#ce93d8', '#ffd700', '#fff', '#ffb3d9'][Math.floor(Math.random() * 5)],
        }));

        (function draw() {
            ctx.clearRect(0, 0, cv.width, cv.height);
            stars.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = s.col;
                ctx.globalAlpha = s.op;
                ctx.fill();
                s.x += s.dx; s.y += s.dy;
                if (s.x < 0 || s.x > cv.width) s.dx *= -1;
                if (s.y < 0 || s.y > cv.height) s.dy *= -1;
            });
            requestAnimationFrame(draw);
        })();
    }

    /* ── Floating Petals ────────────────────────────────────────────── */
    function initPetals() {
        const container = document.getElementById('petals-container');
        if (!container) return;
        const colors = ['#ff85c2', '#ce93d8', '#ff4081', '#ffb3d9', '#ffd7ec'];
        for (let i = 0; i < 18; i++) {
            const p = document.createElement('div');
            p.className = 'petal';
            const size = Math.random() * 10 + 6;
            p.style.left = Math.random() * 100 + '%';
            p.style.width = p.style.height = size + 'px';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDuration = (Math.random() * 8 + 7) + 's';
            p.style.animationDelay = (Math.random() * 8) + 's';
            p.style.opacity = (Math.random() * .4 + .3).toString();
            container.appendChild(p);
        }
    }

    /* ── Bento Reveal via IntersectionObserver ──────────────────────── */
    function initBentoReveal() {
        const cards = document.querySelectorAll('[data-reveal]');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e, i) => {
                if (e.isIntersecting) {
                    setTimeout(() => e.target.classList.add('revealed'), i * 110);
                }
            });
        }, { threshold: .15 });
        cards.forEach(c => obs.observe(c));
    }

    /* ── Mouse Parallax Glow on Cards ──────────────────────────────── */
    function initCardMouse() {
        document.querySelectorAll('.bento-card').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
                card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
            });
        });
    }

})();
