document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Desktop Sidebar & Reading Pane
    const booksListAT = document.getElementById('books-list-at');
    const booksListNT = document.getElementById('books-list-nt');
    const sidebarSearchInput = document.getElementById('bible-search');
    
    const locationBook = document.getElementById('location-book');
    const locationChapter = document.getElementById('location-chapter');
    const fontLabel = document.getElementById('font-label');
    const bibleTextContainer = document.getElementById('bible-text');
    
    // Setting Controls
    const fontToggle = document.getElementById('font-toggle');
    const sizeDecrease = document.getElementById('size-decrease');
    const sizeIncrease = document.getElementById('size-increase');
    
    // Navigation Buttons (Desktop & Mobile)
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const mobilePrevBtn = document.getElementById('mobile-prev-btn');
    const mobileNextBtn = document.getElementById('mobile-next-btn');
    const mobileSelectorBtn = document.getElementById('mobile-selector-btn');
    const mobileLocationText = document.getElementById('mobile-location-text');
    const mobileFontBtn = document.getElementById('mobile-font-btn');
    
    // Trigger button in top toolbar
    const openSelectorBtn = document.getElementById('open-selector-btn');
    
    // Inline chapter selector (Desktop fallback)
    const chapterSelectorArea = document.getElementById('chapter-selector-area');
    const inlineChapterTitle = document.getElementById('inline-chapter-title');
    const closeInlineChapterBtn = document.getElementById('close-inline-chapter-btn');
    const readingArea = document.getElementById('reading-area');
    const chapterGrid = document.getElementById('chapter-grid');
    
    // Modal Selector Elements
    const selectorModal = document.getElementById('bible-selector-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBackBtn = document.getElementById('modal-back-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    
    const selectorBooksView = document.getElementById('selector-books-view');
    const selectorChaptersView = document.getElementById('selector-chapters-view');
    
    const modalSearchInput = document.getElementById('bible-modal-search');
    const modalSearchClear = document.getElementById('modal-search-clear');
    const filterChips = document.querySelectorAll('.filter-chip');
    const modalBooksList = document.getElementById('modal-books-list');
    
    const bannerBookTag = document.getElementById('banner-book-tag');
    const bannerBookName = document.getElementById('banner-book-name');
    const bannerBookTotal = document.getElementById('banner-book-total');
    const changeBookBtn = document.getElementById('change-book-btn');
    const modalChaptersGrid = document.getElementById('modal-chapters-grid');
    
    // State variables
    let booksIndex = [];
    let currentBook = null;
    let tempSelectedBook = null; // Book being selected in modal before confirming chapter
    let currentBookId = parseInt(localStorage.getItem('bible_current_book_id')) || 1;
    let currentChapter = parseInt(localStorage.getItem('bible_current_chapter')) || 1;
    
    let activeFilter = 'ALL';
    let currentSearchQuery = '';
    
    // User Settings state
    let activeFont = localStorage.getItem('bible_font') || 'serif'; // 'serif' or 'sans'
    let activeSize = localStorage.getItem('bible_font_size') || 'md'; // 'sm', 'md', 'lg', 'xl'
    
    const sizeClasses = ['size-sm', 'size-md', 'size-lg', 'size-xl'];
    const sizeLabels = { 'sm': 'Pequena', 'md': 'Média', 'lg': 'Grande', 'xl': 'Muito Grande' };
    
    // Initialize UI Settings
    applySettings();
    
    // Load Book Index
    fetchIndex();

    // =========================================================================
    // EVENT LISTENERS - SETTINGS & CONTROLS
    // =========================================================================
    if (fontToggle) {
        fontToggle.addEventListener('click', () => {
            activeFont = activeFont === 'serif' ? 'sans' : 'serif';
            localStorage.setItem('bible_font', activeFont);
            applySettings();
            showToast(`Fonte: ${activeFont === 'serif' ? 'Serifada (Clássica)' : 'Sem Serifa (Moderna)'}`);
        });
    }
    
    if (sizeDecrease) {
        sizeDecrease.addEventListener('click', () => changeFontSize(-1));
    }
    
    if (sizeIncrease) {
        sizeIncrease.addEventListener('click', () => changeFontSize(1));
    }
    
    if (mobileFontBtn) {
        mobileFontBtn.addEventListener('click', () => {
            const nextMap = { 'sm': 'md', 'md': 'lg', 'lg': 'xl', 'xl': 'sm' };
            activeSize = nextMap[activeSize] || 'md';
            localStorage.setItem('bible_font_size', activeSize);
            applySettings();
            showToast(`Tamanho da letra: ${sizeLabels[activeSize] || activeSize}`);
        });
    }
    
    // Search filter for desktop sidebar
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', (e) => {
            const query = normalizeText(e.target.value);
            filterSidebarBooks(query);
        });
    }
    
    // Navigation Buttons
    if (prevBtn) prevBtn.addEventListener('click', navigatePrevious);
    if (nextBtn) nextBtn.addEventListener('click', navigateNext);
    if (mobilePrevBtn) mobilePrevBtn.addEventListener('click', navigatePrevious);
    if (mobileNextBtn) mobileNextBtn.addEventListener('click', navigateNext);
    
    // Open Selector Modal triggers
    if (openSelectorBtn) {
        openSelectorBtn.addEventListener('click', () => openModal('books'));
    }
    if (mobileSelectorBtn) {
        mobileSelectorBtn.addEventListener('click', () => openModal('books'));
    }
    
    // Close Inline Chapter fallback button
    if (closeInlineChapterBtn) {
        closeInlineChapterBtn.addEventListener('click', () => {
            if (chapterSelectorArea) chapterSelectorArea.style.display = 'none';
            if (readingArea) readingArea.style.display = 'block';
        });
    }

    // =========================================================================
    // MODAL EVENT LISTENERS
    // =========================================================================
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    
    if (modalBackBtn) {
        modalBackBtn.addEventListener('click', () => {
            switchModalView('books');
        });
    }
    
    if (changeBookBtn) {
        changeBookBtn.addEventListener('click', () => {
            switchModalView('books');
        });
    }
    
    // Modal Search Input
    if (modalSearchInput) {
        modalSearchInput.addEventListener('input', (e) => {
            currentSearchQuery = normalizeText(e.target.value);
            if (modalSearchClear) {
                modalSearchClear.style.display = currentSearchQuery ? 'block' : 'none';
            }
            filterModalBooks();
            
            // Auto scroll results to the very top so they are instantly visible above the virtual keyboard
            const scrollContainer = document.querySelector('.modal-books-scroll');
            if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }
        });

        // When focusing search input on mobile, ensure smooth viewport positioning
        modalSearchInput.addEventListener('focus', () => {
            const scrollContainer = document.querySelector('.modal-books-scroll');
            if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }
            if (window.innerWidth <= 768) {
                updateModalViewportHeight();
            }
        });
    }
    
    if (modalSearchClear) {
        modalSearchClear.addEventListener('click', () => {
            modalSearchInput.value = '';
            currentSearchQuery = '';
            modalSearchClear.style.display = 'none';
            filterModalBooks();
            modalSearchInput.focus();
            
            const scrollContainer = document.querySelector('.modal-books-scroll');
            if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }
        });
    }
    
    // Filter Category Chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.filter || 'ALL';
            filterModalBooks();
            
            const scrollContainer = document.querySelector('.modal-books-scroll');
            if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }
        });
    });
    
    // Dynamic Visual Viewport support for mobile virtual keyboard
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateModalViewportHeight);
        window.visualViewport.addEventListener('scroll', updateModalViewportHeight);
    }

    function updateModalViewportHeight() {
        if (selectorModal && selectorModal.classList.contains('open') && window.innerWidth <= 768) {
            const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const dialog = selectorModal.querySelector('.bible-modal-dialog');
            if (dialog) {
                dialog.style.height = `${viewportHeight}px`;
                dialog.style.maxHeight = `${viewportHeight}px`;
            }
        }
    }
    
    // Keyboard shortcut - Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selectorModal && selectorModal.classList.contains('open')) {
            closeModal();
        }
    });

    // =========================================================================
    // FETCH & DATA INITIALIZATION
    // =========================================================================
    async function fetchIndex() {
        try {
            const response = await fetch('data/bible/index.json');
            if (!response.ok) throw new Error('Falha ao carregar índice da Bíblia');
            booksIndex = await response.json();
            
            renderDesktopSidebarList(booksIndex);
            renderModalBooks(booksIndex);
            
            // Auto load saved book and chapter
            loadBookAndChapter(currentBookId, currentChapter);
        } catch (error) {
            console.error(error);
            bibleTextContainer.innerHTML = `<div class="error-msg" style="text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--color-accent); margin-bottom: 1rem;"></i>
                <p>Desculpe, não conseguimos carregar o índice da Bíblia neste momento. Por favor, tente novamente.</p>
                <button class="btn btn-outline" onclick="location.reload()" style="margin-top: 1rem;">Recarregar</button>
            </div>`;
        }
    }

    // =========================================================================
    // RENDER FUNCTIONS - DESKTOP SIDEBAR
    // =========================================================================
    function renderDesktopSidebarList(books) {
        if (!booksListAT || !booksListNT) return;
        booksListAT.innerHTML = '';
        booksListNT.innerHTML = '';
        
        books.forEach(book => {
            const li = document.createElement('li');
            li.className = 'book-item';
            li.dataset.id = book.id;
            li.innerHTML = `
                <span>${book.name}</span>
                <span class="book-chapters-count">${book.chapters} cap.</span>
            `;
            
            li.addEventListener('click', () => {
                document.querySelectorAll('.book-item').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                
                // Open modal chapter view or load first chapter
                selectBookInModal(book);
                openModal('chapters');
            });
            
            if (book.testament === 'AT') {
                booksListAT.appendChild(li);
            } else {
                booksListNT.appendChild(li);
            }
        });
    }

    function filterSidebarBooks(query) {
        document.querySelectorAll('.book-item').forEach(item => {
            const bookName = normalizeText(item.querySelector('span').textContent);
            if (bookName.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // =========================================================================
    // RENDER FUNCTIONS - MODAL SELECTOR
    // =========================================================================
    function renderModalBooks(books) {
        if (!modalBooksList) return;
        modalBooksList.innerHTML = '';
        
        books.forEach(book => {
            const catInfo = getBookCategoryInfo(book);
            const card = document.createElement('div');
            card.className = `modal-book-card ${book.id === currentBookId ? 'active' : ''}`;
            card.dataset.id = book.id;
            card.dataset.category = catInfo.code;
            card.dataset.testament = book.testament;
            card.dataset.name = normalizeText(book.name);
            card.dataset.abbrev = normalizeText(book.abbrev);
            
            card.innerHTML = `
                <div class="book-card-left">
                    <div class="book-abbrev-badge">${book.abbrev}</div>
                    <div class="book-card-info">
                        <span class="book-card-name">${book.name}</span>
                        <span class="book-card-category">${catInfo.label} • ${book.testament === 'AT' ? 'Antigo' : 'Novo'} Testamento</span>
                    </div>
                </div>
                <div class="book-card-right">
                    <span>${book.chapters} cap.</span>
                    <i class="fas fa-chevron-right" style="font-size: 0.75rem; color: var(--color-secondary);"></i>
                </div>
            `;
            
            card.addEventListener('click', () => {
                selectBookInModal(book);
                switchModalView('chapters');
            });
            
            modalBooksList.appendChild(card);
        });
    }

    function filterModalBooks() {
        const cards = modalBooksList.querySelectorAll('.modal-book-card');
        let visibleCount = 0;
        
        cards.forEach(card => {
            const bookId = parseInt(card.dataset.id);
            const testament = card.dataset.testament;
            const category = card.dataset.category;
            const bookName = card.dataset.name;
            const bookAbbrev = card.dataset.abbrev;
            
            // Check Category Filter
            let matchesCategory = true;
            if (activeFilter === 'EV') {
                matchesCategory = (bookId >= 47 && bookId <= 50);
            } else if (activeFilter === 'NT') {
                matchesCategory = (testament === 'NT');
            } else if (activeFilter === 'AT') {
                matchesCategory = (testament === 'AT');
            } else if (activeFilter === 'PENT') {
                matchesCategory = (bookId >= 1 && bookId <= 5);
            } else if (activeFilter === 'HIST') {
                matchesCategory = (bookId >= 6 && bookId <= 19) || bookId === 22 || bookId === 23 || bookId === 51;
            } else if (activeFilter === 'SAP') {
                matchesCategory = (bookId >= 20 && bookId <= 21) || (bookId >= 24 && bookId <= 28);
            } else if (activeFilter === 'PROF') {
                matchesCategory = (bookId >= 29 && bookId <= 46) || bookId === 73;
            } else if (activeFilter === 'CART') {
                matchesCategory = (bookId >= 52 && bookId <= 72);
            }
            
            // Check Search Query (matches name, abbreviation, or cleaned terms)
            let matchesSearch = true;
            if (currentSearchQuery) {
                const q = currentSearchQuery;
                matchesSearch = bookName.includes(q) || 
                                bookAbbrev.startsWith(q) || 
                                bookAbbrev.includes(q) ||
                                (q === 'evangelho' && (bookId >= 47 && bookId <= 50)) ||
                                (q === 'salmo' && bookId === 21) ||
                                (q === 'salmos' && bookId === 21) ||
                                (q === 'lucas' && bookId === 49) ||
                                (q === 'mateus' && bookId === 47) ||
                                (q === 'marcos' && bookId === 48) ||
                                (q === 'joao' && (bookId === 50 || (bookId >= 69 && bookId <= 71)));
            }
            
            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Empty state check
        let noResults = document.getElementById('modal-no-results');
        if (visibleCount === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'modal-no-results';
                noResults.style.cssText = 'text-align: center; padding: 2.5rem 1rem; color: var(--color-text-main); grid-column: 1 / -1;';
                noResults.innerHTML = `
                    <i class="fas fa-search" style="font-size: 2rem; color: var(--color-secondary); opacity: 0.5; margin-bottom: 0.8rem; display: block;"></i>
                    <p style="font-weight: 600; margin-bottom: 0.4rem;">Nenhum livro encontrado</p>
                    <p style="font-size: 0.85rem; opacity: 0.7;">Tente pesquisar por outra sigla ou nome (ex: Mt, Salmos, Lc, Gn).</p>
                `;
                modalBooksList.appendChild(noResults);
            }
            noResults.style.display = 'block';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    }

    function selectBookInModal(book) {
        tempSelectedBook = book;
        
        if (bannerBookTag) {
            bannerBookTag.textContent = book.abbrev || (book.testament === 'AT' ? 'AT' : 'NT');
        }
        if (bannerBookName) {
            bannerBookName.textContent = book.name;
        }
        if (bannerBookTotal) {
            const catInfo = getBookCategoryInfo(book);
            bannerBookTotal.textContent = `${book.chapters} capítulos • ${catInfo.label}`;
        }
        
        // Render Chapter buttons in modal grid
        if (modalChaptersGrid) {
            modalChaptersGrid.innerHTML = '';
            for (let i = 1; i <= book.chapters; i++) {
                const btn = document.createElement('button');
                btn.className = `modal-chapter-btn ${(book.id === currentBookId && i === currentChapter) ? 'active' : ''}`;
                btn.textContent = i;
                btn.setAttribute('aria-label', `${book.name}, Capítulo ${i}`);
                
                btn.addEventListener('click', () => {
                    loadBookAndChapter(book.id, i);
                    closeModal();
                });
                
                modalChaptersGrid.appendChild(btn);
            }
        }
    }

    function switchModalView(view) {
        if (view === 'books') {
            if (selectorBooksView) selectorBooksView.style.display = 'flex';
            if (selectorChaptersView) selectorChaptersView.style.display = 'none';
            if (modalBackBtn) modalBackBtn.style.display = 'none';
            if (modalTitle) modalTitle.textContent = 'Escolha o Livro';
            if (modalSubtitle) modalSubtitle.textContent = '73 livros da Bíblia Sagrada Ave Maria';
            
            // Highlight active book card
            document.querySelectorAll('.modal-book-card').forEach(card => {
                if (parseInt(card.dataset.id) === currentBookId) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        } else if (view === 'chapters') {
            if (selectorBooksView) selectorBooksView.style.display = 'none';
            if (selectorChaptersView) selectorChaptersView.style.display = 'flex';
            if (modalBackBtn) modalBackBtn.style.display = 'flex';
            if (modalTitle && tempSelectedBook) modalTitle.textContent = tempSelectedBook.name;
            if (modalSubtitle) modalSubtitle.textContent = 'Escolha o Capítulo';
            
            // Scroll chapter grid to top
            const chaptersScroll = document.querySelector('.modal-chapters-scroll');
            if (chaptersScroll) chaptersScroll.scrollTop = 0;
        }
    }

    function openModal(targetView = 'books') {
        if (!selectorModal) return;
        
        selectorModal.classList.add('open');
        selectorModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        updateModalViewportHeight();
        
        if (targetView === 'chapters' && currentBook) {
            selectBookInModal(currentBook);
            switchModalView('chapters');
        } else {
            if (currentBook) {
                selectBookInModal(currentBook);
            }
            switchModalView('books');
            
            // Auto focus search input on desktop
            if (window.innerWidth > 768 && modalSearchInput) {
                setTimeout(() => modalSearchInput.focus(), 150);
            }
        }
    }

    function closeModal() {
        if (!selectorModal) return;
        
        selectorModal.classList.remove('open');
        selectorModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        const dialog = selectorModal.querySelector('.bible-modal-dialog');
        if (dialog) {
            dialog.style.height = '';
            dialog.style.maxHeight = '';
        }
        if (modalSearchInput) {
            modalSearchInput.blur();
        }
    }

    // =========================================================================
    // LOAD BOOK & CHAPTER (CORE READING ENGINE)
    // =========================================================================
    async function loadBookAndChapter(bookId, chapterNum) {
        const bookMeta = booksIndex.find(b => b.id === bookId);
        if (!bookMeta) return;
        
        // Validate chapter bounds
        if (chapterNum < 1) chapterNum = 1;
        if (chapterNum > bookMeta.chapters) chapterNum = bookMeta.chapters;
        
        currentBook = bookMeta;
        currentBookId = bookId;
        currentChapter = chapterNum;
        
        // Save State to LocalStorage
        localStorage.setItem('bible_current_book_id', currentBookId);
        localStorage.setItem('bible_current_chapter', currentChapter);
        
        // Update Top Toolbar UI
        if (locationBook) locationBook.textContent = bookMeta.name;
        if (locationChapter) locationChapter.textContent = `Capítulo ${chapterNum}`;
        
        // Update Mobile Sticky Bottom Bar UI
        if (mobileLocationText) {
            mobileLocationText.textContent = `${bookMeta.name} ${chapterNum}`;
        }
        
        // Update Desktop Sidebar Active Item
        document.querySelectorAll('.book-item').forEach(item => {
            if (parseInt(item.dataset.id) === bookId) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('active');
            }
        });

        // Update Modal Books List Active Card
        document.querySelectorAll('.modal-book-card').forEach(card => {
            if (parseInt(card.dataset.id) === bookId) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        // Hide inline chapter picker if open
        if (chapterSelectorArea) chapterSelectorArea.style.display = 'none';
        if (readingArea) readingArea.style.display = 'block';
        
        // Show loading state
        bibleTextContainer.innerHTML = `
            <div style="text-align: center; padding: 3.5rem 1rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2.2rem; color: var(--color-secondary); margin-bottom: 1rem; display: block;"></i>
                <p style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--color-primary);">Carregando as Sagradas Escrituras...</p>
                <span style="font-size: 0.85rem; opacity: 0.7;">${bookMeta.name}, Capítulo ${chapterNum}</span>
            </div>
        `;
        
        try {
            const response = await fetch(`data/bible/books/${bookId}.json`);
            if (!response.ok) throw new Error('Erro ao carregar texto da Escritura');
            const bookData = await response.json();
            
            renderChapter(bookData.chapters[chapterNum - 1]);
            updateNavigationButtons();
            
            // Scroll reader back to top smoothly
            const readerPanel = document.querySelector('.bible-reader');
            if (readerPanel) {
                readerPanel.scrollTop = 0;
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error(error);
            bibleTextContainer.innerHTML = `<div class="error-msg" style="text-align: center; padding: 2.5rem 1rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--color-accent); margin-bottom: 1rem; display: block;"></i>
                <p style="font-weight: 600; margin-bottom: 0.5rem;">Falha ao carregar o capítulo.</p>
                <p style="font-size: 0.9rem; opacity: 0.75; margin-bottom: 1.2rem;">Verifique sua conexão com a internet.</p>
                <button class="btn btn-outline" id="retry-chapter-btn">Tentar Novamente</button>
            </div>`;
            const retryBtn = document.getElementById('retry-chapter-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadBookAndChapter(bookId, chapterNum));
            }
        }
    }

    function renderChapter(verses) {
        bibleTextContainer.innerHTML = '';
        
        if (!verses || verses.length === 0) {
            bibleTextContainer.textContent = 'Capítulo vazio ou não encontrado.';
            return;
        }
        
        verses.forEach((verseText, index) => {
            const verseNum = index + 1;
            const verseDiv = document.createElement('div');
            verseDiv.className = 'verse-row';
            
            const cleanText = escapeHTML(verseText);
            
            verseDiv.innerHTML = `
                <span class="verse-num">${verseNum}</span><span>${cleanText}</span>
            `;
            
            // Click on verse to highlight & copy
            verseDiv.addEventListener('click', () => {
                toggleHighlightVerse(verseDiv, currentBook.name, currentChapter, verseNum, verseText);
            });
            
            bibleTextContainer.appendChild(verseDiv);
        });
    }

    function toggleHighlightVerse(element, bookName, chapter, verseNum, text) {
        const alreadyHighlighted = element.classList.contains('highlighted');
        
        document.querySelectorAll('.verse-row').forEach(row => row.classList.remove('highlighted'));
        
        if (!alreadyHighlighted) {
            element.classList.add('highlighted');
            
            const cite = `(${bookName} ${chapter}, ${verseNum})`;
            const textToCopy = `"${text}" ${cite}`;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast(`Versículo copiado: ${cite}`);
                }).catch(() => {
                    showToast(`Versículo selecionado: ${cite}`);
                });
            } else {
                showToast(`Versículo selecionado: ${cite}`);
            }
        }
    }

    function updateNavigationButtons() {
        const isFirst = (currentBookId === 1 && currentChapter === 1);
        const isLastBook = (currentBookId === 73);
        const isLastChapter = currentBook && (currentChapter === currentBook.chapters);
        const isLast = (isLastBook && isLastChapter);
        
        if (prevBtn) prevBtn.disabled = isFirst;
        if (nextBtn) nextBtn.disabled = isLast;
        if (mobilePrevBtn) mobilePrevBtn.disabled = isFirst;
        if (mobileNextBtn) mobileNextBtn.disabled = isLast;
    }

    function navigatePrevious() {
        if (currentChapter > 1) {
            loadBookAndChapter(currentBookId, currentChapter - 1);
        } else if (currentBookId > 1) {
            const prevBookMeta = booksIndex.find(b => b.id === currentBookId - 1);
            if (prevBookMeta) {
                loadBookAndChapter(prevBookMeta.id, prevBookMeta.chapters);
            }
        }
    }

    function navigateNext() {
        if (currentBook && currentChapter < currentBook.chapters) {
            loadBookAndChapter(currentBookId, currentChapter + 1);
        } else if (currentBookId < 73) {
            loadBookAndChapter(currentBookId + 1, 1);
        }
    }

    function changeFontSize(direction) {
        const currentIndex = sizeClasses.indexOf(`size-${activeSize}`);
        let newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < sizeClasses.length) {
            activeSize = sizeClasses[newIndex].replace('size-', '');
            localStorage.setItem('bible_font_size', activeSize);
            applySettings();
            showToast(`Tamanho da letra: ${sizeLabels[activeSize] || activeSize}`);
        }
    }

    function applySettings() {
        if (!bibleTextContainer) return;
        
        bibleTextContainer.classList.remove('font-serif', 'font-sans', ...sizeClasses);
        
        const fontClass = activeFont === 'serif' ? 'font-serif' : 'font-sans';
        bibleTextContainer.classList.add(fontClass);
        if (fontLabel) {
            fontLabel.textContent = activeFont === 'serif' ? 'Serifada' : 'Sem Serifa';
        }
        
        bibleTextContainer.classList.add(`size-${activeSize}`);
    }

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================
    function getBookCategoryInfo(book) {
        const id = book.id;
        if (id >= 1 && id <= 5) return { code: 'PENT', label: 'Pentateuco', testament: 'AT' };
        if (id >= 47 && id <= 50) return { code: 'EV', label: 'Evangelho', testament: 'NT' };
        if ((id >= 6 && id <= 19) || id === 22 || id === 23) return { code: 'HIST', label: 'Histórico', testament: 'AT' };
        if (id === 51) return { code: 'HIST', label: 'Histórico NT', testament: 'NT' };
        if ((id >= 20 && id <= 21) || (id >= 24 && id <= 28)) return { code: 'SAP', label: 'Sapiencial', testament: 'AT' };
        if (id >= 29 && id <= 46) return { code: 'PROF', label: 'Profeta', testament: 'AT' };
        if (id >= 52 && id <= 72) return { code: 'CART', label: 'Carta Apostólica', testament: 'NT' };
        if (id === 73) return { code: 'PROF', label: 'Profético NT', testament: 'NT' };
        return { code: book.testament, label: book.testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento', testament: book.testament };
    }

    function normalizeText(str) {
        if (!str) return '';
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").trim();
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

    function showToast(message) {
        let toast = document.getElementById('bible-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'bible-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(58, 25, 30, 0.95);
                color: #ffffff;
                padding: 0.75rem 1.4rem;
                border-radius: 30px;
                font-family: var(--font-body);
                font-size: 0.88rem;
                font-weight: 500;
                z-index: 3000;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                box-shadow: 0 8px 25px rgba(0,0,0,0.35);
                border: 1px solid rgba(197, 160, 89, 0.4);
                pointer-events: none;
                text-align: center;
                max-width: 90%;
            `;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        
        if (window._bibleToastTimeout) {
            clearTimeout(window._bibleToastTimeout);
        }
        
        window._bibleToastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
        }, 2600);
    }
});
