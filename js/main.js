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
            const response = await fetch('https://liturgia.up.railway.app/');
            if (!response.ok) throw new Error('Falha na API');
            
            const data = await response.json();
            
            // Populate data
            document.getElementById('liturgy-title').textContent = data.liturgia;
            document.getElementById('liturgy-color').textContent = `Cor Litúrgica: ${data.cor}`;
            
            // Primeira Leitura
            document.getElementById('pl-title').textContent = data.primeiraLeitura.titulo;
            document.getElementById('pl-ref').textContent = data.primeiraLeitura.referencia;
            document.getElementById('pl-text').textContent = data.primeiraLeitura.texto;
            
            // Salmo
            document.getElementById('slm-ref').textContent = data.salmo.referencia;
            document.getElementById('slm-refrao').textContent = data.salmo.refrao;
            document.getElementById('slm-text').innerHTML = data.salmo.texto.replace(/\n/g, '<br>');
            
            // Segunda Leitura
            const slContainer = document.getElementById('sl-container');
            if (typeof data.segundaLeitura === 'object') {
                slContainer.style.display = 'block';
                document.getElementById('sl-title').textContent = data.segundaLeitura.titulo;
                document.getElementById('sl-ref').textContent = data.segundaLeitura.referencia;
                document.getElementById('sl-text').textContent = data.segundaLeitura.texto;
            } else {
                slContainer.style.display = 'none';
            }
            
            // Evangelho
            document.getElementById('ev-title').textContent = data.evangelho.titulo;
            document.getElementById('ev-ref').textContent = data.evangelho.referencia;
            document.getElementById('ev-text').textContent = data.evangelho.texto;

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
        let storyTimer;
        const STORY_DURATION = 5000; // 5 segundos por imagem
        
        function updateStory() {
            storyImage.src = stories[currentStory];
            
            // Atualiza barrinhas
            progressFills.forEach((fill, index) => {
                fill.classList.remove('active', 'completed');
                fill.style.transitionDuration = '0s'; // reseta transição
                
                if (index < currentStory) {
                    fill.classList.add('completed');
                } else if (index === currentStory) {
                    // Pequeno delay para a transição funcionar após remover a classe
                    setTimeout(() => {
                        fill.style.transitionDuration = `${STORY_DURATION}ms`;
                        fill.classList.add('active');
                    }, 50);
                }
            });
            
            clearTimeout(storyTimer);
            storyTimer = setTimeout(nextStory, STORY_DURATION);
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
            clearTimeout(storyTimer);
            
            // Limpa as barrinhas
            progressFills.forEach(fill => {
                fill.classList.remove('active', 'completed');
                fill.style.transitionDuration = '0s';
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

});
