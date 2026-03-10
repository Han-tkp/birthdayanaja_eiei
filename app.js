window.addEventListener('DOMContentLoaded', () => {
    const { createApp, ref, computed, onMounted } = Vue;

    // --- DATA ---
    const birthdayStages = [
        { txt: '-ขอให้มีความสุข อะไรที่ทำให้รอยยิ้มเธอหาย ก็ขอให้ฮีลใจได้เร็วๆ', src: 'pictures/ฉากอวยพรแรก.jpeg', isVideo: false },
        { txt: '-ขอให้เธอสมหวังในสิ่งที่เธอปรารถนาทุกสิ่ง', src: 'pictures/13395.jpeg', isVideo: false },
        { txt: '-ขอให้เจอคนที่เข้ามาในชีวิตเธอ ไม่ทำร้ายเธอ ใจดีกับเธอ', src: 'video/13397.mp4', isVideo: true },
        { txt: '-ขอให้เจอคนที่พร้อมจะรับเธอได้ จริงใจ ไม่ทำให้เธอมีน้ำตา ไม่ทำร้ายเธอ', src: 'pictures/13396.jpeg', isVideo: false },
        { txt: '-ขอให้สิ่งที่เธอกังวล หรือไม่สบายใจค่อยๆหายไป', src: 'video/13398.mp4', isVideo: true },
        { txt: '-ขอให้ได้ไปจีน ไปดูหิมะกับฉัน55555', src: 'video/13399.mp4', isVideo: true },
        { txt: 'ขอบคุณที่เติบโตมาอย่างดีนะ ยัยเด่กพลังบวกของเจ้', src: 'video/13400.mp4', isVideo: true },
        { txt: 'ขอให้ปีนี้เป็นปีที่ใจดีกับเธอที่สุดเลยนะ ✨', src: 'video/13401.mp4', isVideo: true },
        { txt: 'สุดท้ายขอให้ยังสนิทกันเหมือนเดิมและตลอดไป ไม่มีใครคนใดคนหนึ่งหายไปจากชีวิตใครก่อน อยู่เป็นพลังบวกให้กันก่อน อยู่ดูฉันแต่งงานก่อน อยู่ดูฉันมีลูกก่อน แน่นอนว่าฉันก็จะอยู่ดูเธอเหมือนกันน่ะยัยเด่กก เลิปยูวยัยเด่กกก💗🤏🏻', src: 'pictures/ฉากสุดท้าย.jpeg', isVideo: false }
    ];

    const fullEnvelopeText = `หว๊าาา โตขึ้นอีกปีแล้วน่ะ ก็ไม่มีอะไรมาก
แค่อยากบอกว่ามีความสุขเยอะๆน่ะ ให้เยอะกว่าปีก่อน แล้วก็ปีต่อๆไปก็ขอให้เยอะขึ้นไปอีก เพราะเธอมันเหมาะกับรอยยิ้มที่สุดแล้ว จะบอกว่าดีใจมากๆที่ได้รู้จักกัน ยัยเด่กพลังบวก ยัยบื้อ ยัยซน ของเจ้ 
ไม่เคยเสียดายหรือเสียใจเลยที่ได้รู้จักเธอ จะไม่ขออะไรมากเลยย`;

    // --- APP ---
    createApp({
        setup() {
            // Scene Management
            const state = ref('scene0');
            const threeReady = ref(false);
            const zooming = ref(false);

            // Scene 2: Envelope
            const displayedEnvelopeText = ref('');
            const envelopeDone = ref(false);
            let typewriterTimer = null;

            // Scene 3: Interactive
            const stageIndex = ref(0);
            const yesBtnSize = ref(16);
            const yesBtnPaddingX = ref(28);
            const yesBtnPaddingY = ref(12);
            
            // "No" Button Escaping Logic
            const noBtnPosition = ref({ x: 0, y: 0 });
            const noBtnEscaping = ref(false);

            // Audio Logic
            const isPlaying = ref(false);
            const audio = ref(null);

            onMounted(() => {
                audio.value = document.getElementById('bg-music');
                generateCatParts();
            });

            // Wait for Three.js
            document.addEventListener('threeReady', () => { threeReady.value = true; });
            setTimeout(() => { threeReady.value = true; }, 1500);

            // --- Methods ---

            function toggleMusic() {
                if (!audio.value) return;
                if (isPlaying.value) {
                    audio.value.pause();
                } else {
                    audio.value.play().catch(e => console.log("Audio play blocked", e));
                }
                isPlaying.value = !isPlaying.value;
            }

            function startDoorScene() {
                state.value = 'scene1';
                // Try to play music on first interaction
                if (!isPlaying.value && audio.value) {
                    audio.value.play().then(() => isPlaying.value = true).catch(() => {});
                }
            }

            function enterDoor() {
                if (zooming.value) return;
                zooming.value = true;

                const ts = window.threeScene;
                if (ts && ts.enterDoor) {
                    ts.enterDoor(() => {
                        state.value = 'scene2';
                        zooming.value = false;
                        startTypewriter();
                    });
                } else {
                    state.value = 'scene2';
                    zooming.value = false;
                    startTypewriter();
                }
            }

            function startTypewriter() {
                let i = 0;
                displayedEnvelopeText.value = '';
                envelopeDone.value = false;

                if (window.threeScene?.showEnvelope) window.threeScene.showEnvelope();

                typewriterTimer = setInterval(() => {
                    if (i <= fullEnvelopeText.length) {
                        const currentText = fullEnvelopeText.substring(0, i);
                        displayedEnvelopeText.value = currentText + '<span class="animate-pulse font-bold text-pink-deep">|</span>';
                        i++;
                    } else {
                        clearInterval(typewriterTimer);
                        displayedEnvelopeText.value = fullEnvelopeText;
                        envelopeDone.value = true;
                    }
                }, 40);
            }

            function skipTypewriter() {
                if (typewriterTimer) clearInterval(typewriterTimer);
                displayedEnvelopeText.value = fullEnvelopeText;
                envelopeDone.value = true;
                if (window.threeScene?.fastForwardEnvelope) window.threeScene.fastForwardEnvelope();
            }

            function goInteractiveScene() {
                state.value = 'scene3';
                if (window.threeScene?.hideEnvelope) window.threeScene.hideEnvelope();
            }

            function handleNoHover() {
                // Make the button jump to a random position
                noBtnEscaping.value = true;
                const containerWidth = 300; // rough estimate of container width
                const containerHeight = 150;
                
                // Random position within a reasonable range
                const newX = (Math.random() - 0.5) * containerWidth;
                const newY = (Math.random() - 0.5) * containerHeight;
                
                noBtnPosition.value = { x: newX, y: newY };
            }

            function answerClick(isYes) {
                if (!isYes) {
                    yesBtnSize.value += 12; // Grow faster for more fun
                    yesBtnPaddingX.value += 10;
                    yesBtnPaddingY.value += 4;
                    handleNoHover(); // Jump away on click too
                    return;
                }

                if (stageIndex.value < birthdayStages.length - 1) {
                    stageIndex.value++;
                    // Reset NO button for next stage
                    noBtnEscaping.value = false;
                    noBtnPosition.value = { x: 0, y: 0 };
                }
            }

            function startCelebrate() {
                state.value = 'scene4';
                if (window.threeScene?.showCelebrate) window.threeScene.showCelebrate();
                setTimeout(spawnConfetti, 150);
                spawnHearts();
            }

            function goHome() { window.location.reload(); }

            // Helper to generate nested structures for the cat (CSS dependent)
            function generateCatParts() {
                const legContainers = document.querySelectorAll('.leg-left, .leg-right');
                const tailContainer = document.querySelector('.cat-tail-wrap');

                const createSegments = (parent, count, className) => {
                    let current = parent;
                    for (let i = 0; i < count; i++) {
                        const div = document.createElement('div');
                        div.className = className;
                        if (i === count - 1 && className.includes('leg')) {
                           const paw = document.createElement('div');
                           paw.className = 'cat-paw';
                           div.appendChild(paw);
                        }
                        if (i === count - 1 && className.includes('tail')) {
                           div.classList.add('-end');
                        }
                        current.appendChild(div);
                        current = div;
                    }
                };

                legContainers.forEach(container => createSegments(container, 15, 'cat-leg'));
                if (tailContainer) createSegments(tailContainer, 15, 'cat-tail');
            }

            // --- Computed ---
            const currentStage = computed(() => birthdayStages[stageIndex.value]);
            const isFinalStage = computed(() => stageIndex.value === birthdayStages.length - 1);
            const yesBtnPadding = computed(() => `${yesBtnPaddingY.value}px ${yesBtnPaddingX.value}px`);
            const noBtnStyle = computed(() => {
                if (!noBtnEscaping.value) return { padding: '12px 24px' };
                return {
                    position: 'absolute',
                    left: `calc(50% + ${noBtnPosition.value.x}px)`,
                    top: `calc(50% + ${noBtnPosition.value.y}px)`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                    padding: '12px 24px'
                };
            });

            // --- Decor ---
            function spawnConfetti() {
                const c = document.getElementById('confetti-container');
                if (!c) return;
                const cols = ['#ff69b4', '#ffb6c1', '#e91e8c', '#ff85c2', '#ffd700', '#fff'];
                for (let i = 0; i < 90; i++) {
                    const el = document.createElement('div');
                    el.className = 'absolute rounded-sm animate-[confettiFall_linear_forwards]';
                    el.style.left = Math.random() * 100 + '%';
                    el.style.top = '-10px';
                    el.style.backgroundColor = cols[Math.floor(Math.random() * cols.length)];
                    el.style.width = (Math.random() * 8 + 5) + 'px';
                    el.style.height = (Math.random() * 8 + 5) + 'px';
                    el.style.borderRadius = Math.random() > .5 ? '50%' : '3px';
                    el.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
                    el.style.animationDelay = (Math.random()) + 's';
                    c.appendChild(el);
                    setTimeout(() => el.remove(), 4500);
                }
            }

            function spawnHearts() {
                const c = document.getElementById('hearts-container');
                if (!c) return;
                const emojis = ['💕', '💖', '💗', '💓', '🌸', '✨', '🎀'];
                for (let i = 0; i < 22; i++) {
                    const h = document.createElement('div');
                    h.className = 'absolute -top-10 animate-[floatHeart_linear_infinite]';
                    h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                    h.style.left = Math.random() * 100 + '%';
                    h.style.fontSize = (Math.random() * .9 + .7) + 'rem';
                    h.style.animationDuration = (Math.random() * 3 + 4) + 's';
                    h.style.animationDelay = (Math.random() * 1.5) + 's';
                    c.appendChild(h);
                    setTimeout(() => h.remove(), 8000);
                }
            }

            setInterval(() => {
                const c = document.getElementById('hearts-container');
                if (!c || state.value === 'scene0') return;
                const emojis = ['💕', '🌸', '✨', '💖'];
                const h = document.createElement('div');
                h.className = 'absolute -top-10 animate-[floatHeart_linear_infinite] opacity-40';
                h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                h.style.left = Math.random() * 100 + '%';
                h.style.fontSize = (Math.random() * .4 + .55) + 'rem';
                h.style.animationDuration = (Math.random() * 4 + 7) + 's';
                c.appendChild(h);
                setTimeout(() => h.remove(), 11000);
            }, 1400);

            return {
                state, threeReady, zooming,
                displayedEnvelopeText, envelopeDone,
                stageIndex, currentStage, isFinalStage, yesBtnSize, yesBtnPadding,
                noBtnStyle, noBtnEscaping,
                isPlaying, toggleMusic,
                startDoorScene, enterDoor, goInteractiveScene, answerClick, startCelebrate, goHome,
                skipTypewriter, handleNoHover
            };
        },
    }).mount('#app');
});
