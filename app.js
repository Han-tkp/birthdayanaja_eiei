window.addEventListener('DOMContentLoaded', () => {
    const { createApp, ref, computed } = Vue;

    const birthdayStages = [
        { txt: '-ขอให้มีความสุข อะไรที่ทำให้รอยยิ้มเธอหาย ก็ขอให้ฮีลใจได้เร็วๆ', img: 'pictures/ฉากอวยพรแรก.jpeg' },
        { txt: '-ขอให้เธอสมหวังในสิ่งที่เธอปรารถนาทุกสิ่ง', img: 'pictures/ฉากอวยพรแรก.jpeg' },
        { txt: '-ขอให้เจอคนที่เข้ามาในชีวิตเธอ ไม่ทำร้ายเธอ ใจดีกับเธอ', img: 'pictures/ฉากอวยพรแรก.jpeg' },
        { txt: '-ขอให้เจอคนที่พร้อมจะรับเธอได้ จริงใจ ไม่ทำให้เธอมีน้ำตา ไม่ทำร้ายเธอ', img: 'pictures/ฉากอวยพร.jpeg' },
        { txt: '-ขอให้สิ่งที่เธอกังวล หรือไม่สบายใจค่อยๆหายไป', img: 'pictures/ฉากอวยพร.jpeg' },
        { txt: '-ขอให้ได้ไปจีน ไปดูหิมะกับฉัน55555', img: 'pictures/ฉากอวยพร.jpeg' },
        { txt: 'สุดท้ายขอให้ยังสนิทกันเหมือนเดิมและตลอดไป ไม่มีใครคนใดคนหนึ่งหายไปจากชีวิตใครก่อน อยู่เป็นพลังบวกให้กันก่อน อยู่ดูฉันแต่งงานก่อน อยู่ดูฉันมีลูกก่อน แน่นอนว่าฉันก็จะอยู่ดูเธอเหมือนกันน่ะยัยเด่กก เลิปยูวยัยเด่กกก💗🤏🏻', img: 'pictures/ฉากสุดท้าย.jpeg' }
    ];

    const fullEnvelopeText = `หว๊าาา โตขึ้นอีกปีแล้วน่ะ ก็ไม่มีอะไรมาก
แค่อยากบอกว่ามีความสุขเยอะๆน่ะ ให้เยอะกว่าปีก่อน แล้วก็ปีต่อๆไปก็ขอให้เยอะขึ้นไปอีก เพราะเธอมันเหมาะกับรอยยิ้มที่สุดแล้ว จะบอกว่าดีใจมากๆที่ได้รู้จักกัน ยัยเด่กพลังบวก ยัยบื้อ ยัยซน ของเจ้ 
ไม่เคยเสียดายหรือเสียใจเลยที่ได้รู้จักเธอ จะไม่ขออะไรมากเลยย`;

    createApp({
        setup() {
            // Scene Management
            // scene0: Intro -> scene1: Door -> scene2: Envelope -> scene3: Interactive -> scene4: Celebrate
            const state = ref('scene0');

            const threeReady = ref(false);
            const zooming = ref(false);

            // Scene 2 references
            const displayedEnvelopeText = ref('');
            const envelopeDone = ref(false);
            let typewriterTimer = null;

            // Scene 3 references
            const stageIndex = ref(0);
            const yesBtnSize = ref(16);
            const yesBtnPaddingX = ref(28);
            const yesBtnPaddingY = ref(12);

            // Wait for Three.js (Cat or Room loaded)
            document.addEventListener('threeReady', () => { threeReady.value = true; });
            setTimeout(() => { threeReady.value = true; }, 1500); // Safety fallback

            // --- Scene Actions ---

            function startDoorScene() {
                state.value = 'scene1';
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
                    // Fallback if Three.js fails
                    state.value = 'scene2';
                    zooming.value = false;
                    startTypewriter();
                }
            }

            function startTypewriter() {
                let i = 0;
                displayedEnvelopeText.value = '';
                envelopeDone.value = false;

                // Show Envelope in 3D scene
                if (window.threeScene?.showEnvelope) {
                    window.threeScene.showEnvelope();
                }

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
                }, 40); // Speed of typing
            }

            function skipTypewriter() {
                if (typewriterTimer) clearInterval(typewriterTimer);
                displayedEnvelopeText.value = fullEnvelopeText;
                envelopeDone.value = true;

                // Fast forward the 3D envelope to its final typing phase position if needed
                if (window.threeScene?.fastForwardEnvelope) {
                    window.threeScene.fastForwardEnvelope();
                }
            }

            function goInteractiveScene() {
                state.value = 'scene3';
                if (window.threeScene?.hideEnvelope) {
                    window.threeScene.hideEnvelope();
                }
            }

            function answerClick(isYes) {
                // If they click No (isYes=false) or even Yes, we progress either way to show all messages
                // But if No, the Yes button grows larger
                if (!isYes) {
                    yesBtnSize.value += 4;
                    yesBtnPaddingX.value += 6;
                    yesBtnPaddingY.value += 2;
                } else {
                    // Optionally do something if Yes is clicked
                }

                if (stageIndex.value < birthdayStages.length - 1) {
                    stageIndex.value++;
                }
            }

            function startCelebrate() {
                state.value = 'scene4';
                if (window.threeScene?.showCelebrate) {
                    window.threeScene.showCelebrate();
                }
                setTimeout(spawnConfetti, 150);
                spawnHearts();
            }

            function goHome() { window.location.reload(); }

            // --- Computeds ---

            const currentStage = computed(() => birthdayStages[stageIndex.value]);
            const isFinalStage = computed(() => stageIndex.value === birthdayStages.length - 1);
            const yesBtnPadding = computed(() => `${yesBtnPaddingY.value}px ${yesBtnPaddingX.value}px`);

            // --- Decor & Effects ---

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

            // Ambient background hearts
            setInterval(() => {
                const c = document.getElementById('hearts-container');
                if (!c) return;
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
                startDoorScene, enterDoor, goInteractiveScene, answerClick, startCelebrate, goHome,
                skipTypewriter
            };
        },
    }).mount('#app');
});
