document.addEventListener('DOMContentLoaded', () => {
    
    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const header = document.querySelector('.header');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });

                // Efeito "Suco" (Juice) - Destacar Botões do WhatsApp
                if (targetId === '#contato') {
                    // Esperar o scroll terminar aproximadamente
                    setTimeout(() => {
                        const footerBtn = document.getElementById('footer-whatsapp-btn');
                        const floatBtn = document.querySelector('.whatsapp-float');
                        
                        // Reseta a animação para permitir toques múltiplos
                        if (footerBtn) {
                            footerBtn.classList.remove('juice-highlight');
                            void footerBtn.offsetWidth; // forçar reflow
                            footerBtn.classList.add('juice-highlight');
                        }
                        
                        if (floatBtn) {
                            floatBtn.classList.remove('juice-highlight');
                            void floatBtn.offsetWidth;
                            floatBtn.classList.add('juice-highlight');
                        }
                    }, 600); // 600ms é o tempo médio da rolagem
                }
            }
        });
    });
    
    // Initialize AOS Animation Library (if present in HTML)
    if(typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }

    // Liturgy Modal Logic
    const liturgyBtn = document.getElementById('open-liturgy-btn');
    const liturgyModal = document.getElementById('liturgyModal');
    
    if (liturgyBtn && liturgyModal) {
        const closeModal = liturgyModal.querySelector('.close-modal');
        
        liturgyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            liturgyModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // prevent background scrolling
            fetchLiturgy();
        });

        closeModal.addEventListener('click', () => {
            liturgyModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        });

        window.addEventListener('click', (e) => {
            if (e.target === liturgyModal) {
                liturgyModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function formatVerses(str) {
        if (!str) return '';
        const escaped = escapeHTML(str);
        // Formata números (geralmente versículos) com uma classe específica e um espaço após,
        // mas ignora entidades HTML como &#39; para evitar bugs de caracteres
        return escaped.replace(/&#\d+;|(\b\d+)/g, (match, p1) => {
            if (p1) {
                return `<strong class="liturgy-verse-num">${p1}</strong>&nbsp;`;
            }
            return match;
        });
    }

    async function fetchLiturgy() {
        const loading = document.getElementById('liturgy-loading');
        const dataContainer = document.getElementById('liturgy-data');
        const errorContainer = document.getElementById('liturgy-error');

        // Only fetch if data is not already loaded
        if (dataContainer.style.display === 'block') return;

        loading.style.display = 'block';
        dataContainer.style.display = 'none';
        errorContainer.style.display = 'none';

        try {
            // Buscando diretamente da Canção Nova usando o proxy de CORS do CodeTabs
            const response = await fetch('https://api.codetabs.com/v1/proxy?quest=https://liturgia.cancaonova.com/pb/');
            if (!response.ok) throw new Error('Falha ao buscar liturgia');
            
            const htmlText = await response.text();
            
            // Parser do HTML utilizando DOMParser nativo do navegador
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            // 1. Título principal
            const titleText = doc.querySelector('.entry-title')?.textContent.trim() || 'Liturgia Diária';
            document.getElementById('liturgy-title').textContent = titleText;
            
            // 2. Cor Litúrgica
            let cor = 'Branco';
            const bodyClass = doc.body.className || '';
            if (bodyClass.includes('verde')) cor = 'Verde';
            else if (bodyClass.includes('vermelha') || bodyClass.includes('vermelho')) cor = 'Vermelho';
            else if (bodyClass.includes('roxa') || bodyClass.includes('roxo')) cor = 'Roxo';
            else if (bodyClass.includes('branca') || bodyClass.includes('branco')) cor = 'Branco';
            else if (bodyClass.includes('rosa')) cor = 'Rosa';
            else if (bodyClass.includes('preta') || bodyClass.includes('preto')) cor = 'Preto';
            
            document.getElementById('liturgy-color').textContent = `Cor Litúrgica: ${cor}`;

            // Helper para formatar versículos e limpar conteúdo
            function parseReading(paneId) {
                const pane = doc.getElementById(paneId);
                if (!pane) return null;
                const clone = pane.cloneNode(true);
                
                // Remover áudios/iframes
                const embeds = clone.querySelectorAll('iframe, .embeds-audio');
                embeds.forEach(e => e.remove());

                // Adicionar classe liturgy-verse-num nos versículos
                clone.querySelectorAll('strong').forEach(el => {
                    const txt = el.textContent.trim();
                    if (/^\d+[a-z]?$/i.test(txt)) {
                        el.className = 'liturgy-verse-num';
                    }
                });

                const paragraphs = Array.from(clone.querySelectorAll('p')).filter(p => p.textContent.trim().length > 0);
                if (paragraphs.length === 0) return null;

                let title = '';
                let ref = '';
                let headerParaIdx = -1;

                for (let i = 0; i < paragraphs.length; i++) {
                    const text = paragraphs[i].textContent.trim();
                    if (text.includes("Leitura") || text.includes("Evangelho")) {
                        headerParaIdx = i;
                        const match = text.match(/(.*?)\((.*?)\)/);
                        if (match) {
                            title = match[1].trim();
                            ref = match[2].trim();
                        } else {
                            title = text;
                        }
                        break;
                    }
                }

                if (headerParaIdx !== -1) {
                    paragraphs.splice(headerParaIdx, 1);
                }

                const textHTML = paragraphs.map(p => p.outerHTML).join('\n');
                return { title, ref, text: textHTML };
            }

            function parseSalmo(paneId) {
                const pane = doc.getElementById(paneId);
                if (!pane) return null;
                const clone = pane.cloneNode(true);
                const embeds = clone.querySelectorAll('iframe, .embeds-audio');
                embeds.forEach(e => e.remove());

                clone.querySelectorAll('strong').forEach(el => {
                    const txt = el.textContent.trim();
                    if (/^\d+[a-z]?$/i.test(txt)) {
                        el.className = 'liturgy-verse-num';
                    }
                });

                const paragraphs = Array.from(clone.querySelectorAll('p')).filter(p => p.textContent.trim().length > 0);
                if (paragraphs.length < 2) return null;

                const refText = paragraphs[0].textContent.trim();
                const refraoText = paragraphs[1].textContent.trim();
                const versesParagraphs = paragraphs.slice(2);
                const textHTML = versesParagraphs.map(p => p.outerHTML).join('\n');

                return {
                    ref: refText,
                    refrao: refraoText,
                    text: textHTML
                };
            }

            // Primeira Leitura
            const pl = parseReading("liturgia-1");
            if (pl) {
                document.getElementById('pl-title').textContent = pl.title || 'Primeira Leitura';
                document.getElementById('pl-ref').textContent = pl.ref || '';
                document.getElementById('pl-text').innerHTML = pl.text;
            }
            
            // Salmo
            const salmo = parseSalmo("liturgia-2");
            if (salmo) {
                document.getElementById('slm-ref').textContent = salmo.ref || '';
                document.getElementById('slm-refrao').textContent = salmo.refrao || '';
                document.getElementById('slm-text').innerHTML = salmo.text;
            } else {
                document.getElementById('slm-text').textContent = '';
            }
            
            // Segunda Leitura
            const slContainer = document.getElementById('sl-container');
            const sl = parseReading("liturgia-3");
            if (sl && sl.text) {
                slContainer.style.display = 'block';
                document.getElementById('sl-title').textContent = sl.title || 'Segunda Leitura';
                document.getElementById('sl-ref').textContent = sl.ref || '';
                document.getElementById('sl-text').innerHTML = sl.text;
            } else {
                slContainer.style.display = 'none';
            }
            
            // Evangelho
            const gospel = parseReading("liturgia-4");
            if (gospel) {
                document.getElementById('ev-title').textContent = gospel.title || 'Evangelho';
                document.getElementById('ev-ref').textContent = gospel.ref || '';
                document.getElementById('ev-text').innerHTML = gospel.text;
            }

            loading.style.display = 'none';
            dataContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Erro ao buscar liturgia:', error);
            loading.style.display = 'none';
            errorContainer.style.display = 'block';
        }
    }

    // ==========================================
    // WEB STORIES LOGIC
    // ==========================================
    const storyModal = document.getElementById('story-modal');
    const openStoryBtn = document.getElementById('open-story-btn');
    const closeStoryBtn = document.getElementById('close-story');
    const storyImage = document.getElementById('story-image');
    const storyNext = document.getElementById('story-next');
    const storyPrev = document.getElementById('story-prev');
    const progressFills = document.querySelectorAll('.story-progress-fill');
    
    if (storyModal && openStoryBtn) {
        const stories = ['img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/5.jpg', 'img/6.jpg'];
        let currentStory = 0;
        
        function updateStory() {
            storyImage.src = stories[currentStory];
            
            // Atualiza barrinhas (manual)
            progressFills.forEach((fill, index) => {
                fill.classList.remove('active', 'completed');
                fill.style.transitionDuration = '0s'; // sem transição
                
                if (index <= currentStory) {
                    fill.classList.add('completed');
                }
            });
        }
        
        function nextStory() {
            if (currentStory < stories.length - 1) {
                currentStory++;
                updateStory();
            } else {
                closeStory();
            }
        }
        
        function prevStory() {
            if (currentStory > 0) {
                currentStory--;
                updateStory();
            } else {
                // Se voltar do primeiro, reseta ele mesmo
                updateStory();
            }
        }
        
        function closeStory() {
            storyModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Limpa as barrinhas
            progressFills.forEach(fill => {
                fill.classList.remove('active', 'completed');
            });
        }
        
        openStoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentStory = 0;
            storyModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Evita scroll do site por trás
            updateStory();
        });
        
        closeStoryBtn.addEventListener('click', closeStory);
        storyNext.addEventListener('click', nextStory);
        storyPrev.addEventListener('click', prevStory);
        
        // Fechar ao clicar fora do container
        storyModal.addEventListener('click', (e) => {
            if(e.target === storyModal) {
                closeStory();
            }
        });
    }

    // ==========================================
    // DIZIMO - COPY PIX LOGIC
    // ==========================================
    const copyPixBtn = document.getElementById('copy-pix-btn');
    const pixPayload = document.getElementById('pix-payload');
    const copyFeedback = document.getElementById('copy-feedback');

    if (copyPixBtn && pixPayload && copyFeedback) {
        copyPixBtn.addEventListener('click', () => {
            // Select the text field
            pixPayload.select();
            pixPayload.setSelectionRange(0, 99999); // For mobile devices

            // Copy the text inside the text field
            navigator.clipboard.writeText(pixPayload.value).then(() => {
                // Show feedback
                copyFeedback.style.display = 'block';
                copyPixBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 5px;"></i> Copiado';
                
                // Hide feedback after 3 seconds
                setTimeout(() => {
                    copyFeedback.style.display = 'none';
                    copyPixBtn.innerHTML = '<i class="far fa-copy" style="margin-right: 5px;"></i> Copiar';
                }, 3000);
            }).catch(err => {
                console.error('Falha ao copiar texto: ', err);
                copyFeedback.textContent = 'Erro ao copiar.';
                copyFeedback.style.color = '#dc3545';
                copyFeedback.style.display = 'block';
            });
        });
    }

});
