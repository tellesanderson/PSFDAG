document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const booksListAT = document.getElementById('books-list-at');
    const booksListNT = document.getElementById('books-list-nt');
    const searchInput = document.getElementById('bible-search');
    
    const locationBook = document.getElementById('location-book');
    const locationChapter = document.getElementById('location-chapter');
    const bibleTextContainer = document.getElementById('bible-text');
    
    // Setting Controls
    const fontToggle = document.getElementById('font-toggle');
    const sizeDecrease = document.getElementById('size-decrease');
    const sizeIncrease = document.getElementById('size-increase');
    
    // Navigation Buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Chapter selector overlays/grids
    const chapterSelectorArea = document.getElementById('chapter-selector-area');
    const readingArea = document.getElementById('reading-area');
    const chapterGrid = document.getElementById('chapter-grid');
    
    // State variables
    let booksIndex = [];
    let currentBook = null;
    let currentBookId = parseInt(localStorage.getItem('bible_current_book_id')) || 1;
    let currentChapter = parseInt(localStorage.getItem('bible_current_chapter')) || 1;
    
    // User Settings state
    let activeFont = localStorage.getItem('bible_font') || 'serif'; // 'serif' or 'sans'
    let activeSize = localStorage.getItem('bible_font_size') || 'md'; // 'sm', 'md', 'lg', 'xl'
    
    const sizeClasses = ['size-sm', 'size-md', 'size-lg', 'size-xl'];
    
    // Initialize UI Settings
    applySettings();
    
    // Load Book Index
    fetchIndex();

    // Event Listeners for Settings
    fontToggle.addEventListener('click', () => {
        activeFont = activeFont === 'serif' ? 'sans' : 'serif';
        localStorage.setItem('bible_font', activeFont);
        applySettings();
    });
    
    sizeDecrease.addEventListener('click', () => {
        changeFontSize(-1);
    });
    
    sizeIncrease.addEventListener('click', () => {
        changeFontSize(1);
    });
    
    // Search filter for books
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        filterBooks(query);
    });
    
    // Nav Buttons
    prevBtn.addEventListener('click', navigatePrevious);
    nextBtn.addEventListener('click', navigateNext);
    
    // Click on location title opens the chapter grid selection again
    document.querySelector('.current-location').addEventListener('click', () => {
        if (currentBook) {
            showChapterSelector(currentBook);
        }
    });

    async function fetchIndex() {
        try {
            const response = await fetch('data/bible/index.json');
            if (!response.ok) throw new Error('Falha ao carregar índice da Bíblia');
            booksIndex = await response.json();
            
            renderBooksList(booksIndex);
            
            // Auto load saved state
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

    function renderBooksList(books) {
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
                // Remove active class from all
                document.querySelectorAll('.book-item').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                
                loadBook(book.id);
            });
            
            if (book.testament === 'AT') {
                booksListAT.appendChild(li);
            } else {
                booksListNT.appendChild(li);
            }
        });
    }

    function filterBooks(query) {
        document.querySelectorAll('.book-item').forEach(item => {
            const bookName = item.querySelector('span').textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            if (bookName.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async function loadBook(bookId) {
        const bookMeta = booksIndex.find(b => b.id === bookId);
        if (!bookMeta) return;
        
        // Highlight active book in list
        document.querySelectorAll('.book-item').forEach(item => {
            if (parseInt(item.dataset.id) === bookId) {
                item.classList.add('active');
                // Scroll list into view if needed
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('active');
            }
        });
        
        showChapterSelector(bookMeta);
    }

    function showChapterSelector(book) {
        currentBook = book;
        currentBookId = book.id;
        localStorage.setItem('bible_current_book_id', currentBookId);
        
        locationBook.textContent = book.name;
        locationChapter.textContent = 'Escolha o Capítulo';
        
        chapterGrid.innerHTML = '';
        
        for (let i = 1; i <= book.chapters; i++) {
            const btn = document.createElement('button');
            btn.className = `chapter-btn ${i === currentChapter ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => {
                loadBookAndChapter(book.id, i);
            });
            chapterGrid.appendChild(btn);
        }
        
        readingArea.style.display = 'none';
        chapterSelectorArea.style.display = 'block';
    }

    async function loadBookAndChapter(bookId, chapterNum) {
        const bookMeta = booksIndex.find(b => b.id === bookId);
        if (!bookMeta) return;
        
        // Ensure chapter index is valid
        if (chapterNum < 1) chapterNum = 1;
        if (chapterNum > bookMeta.chapters) chapterNum = bookMeta.chapters;
        
        currentBook = bookMeta;
        currentBookId = bookId;
        currentChapter = chapterNum;
        
        // Highlight correct book in list
        document.querySelectorAll('.book-item').forEach(item => {
            if (parseInt(item.dataset.id) === bookId) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('active');
            }
        });

        // Save State
        localStorage.setItem('bible_current_book_id', currentBookId);
        localStorage.setItem('bible_current_chapter', currentChapter);
        
        locationBook.textContent = bookMeta.name;
        locationChapter.textContent = `Capítulo ${chapterNum}`;
        
        // Show loading
        bibleTextContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--color-secondary); margin-bottom: 1rem;"></i>
                <p>Buscando as Escrituras Sagradas...</p>
            </div>
        `;
        
        readingArea.style.display = 'block';
        chapterSelectorArea.style.display = 'none';
        
        try {
            const response = await fetch(`data/bible/books/${bookId}.json`);
            if (!response.ok) throw new Error('Erro ao carregar texto da Escritura');
            const bookData = await response.json();
            
            renderChapter(bookData.chapters[chapterNum - 1]);
            updateNavigationButtons();
            
            // Scroll reader back to top
            document.querySelector('.bible-reader').scrollTop = 0;
            
        } catch (error) {
            console.error(error);
            bibleTextContainer.innerHTML = `<div class="error-msg" style="text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--color-accent); margin-bottom: 1rem;"></i>
                <p>Falha ao carregar o capítulo. Verifique sua conexão.</p>
                <button class="btn btn-outline" id="retry-chapter-btn" style="margin-top: 1rem;">Tentar Novamente</button>
            </div>`;
            document.getElementById('retry-chapter-btn').addEventListener('click', () => loadBookAndChapter(bookId, chapterNum));
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
            
            // Escape the text to prevent XSS
            const cleanText = escapeHTML(verseText);
            
            verseDiv.innerHTML = `
                <span class="verse-num">${verseNum}</span><span>${cleanText}</span>
            `;
            
            // Add click to highlight/copy verse helper
            verseDiv.addEventListener('click', () => {
                toggleHighlightVerse(verseDiv, currentBook.name, currentChapter, verseNum, verseText);
            });
            
            bibleTextContainer.appendChild(verseDiv);
        });
    }

    function toggleHighlightVerse(element, bookName, chapter, verseNum, text) {
        const alreadyHighlighted = element.classList.contains('highlighted');
        
        // Remove highlight from all other verses
        document.querySelectorAll('.verse-row').forEach(row => row.classList.remove('highlighted'));
        
        if (!alreadyHighlighted) {
            element.classList.add('highlighted');
            
            // Offer instant copy to clipboard
            const cite = `(${bookName} ${chapter}, ${verseNum})`;
            const textToCopy = `"${text}" ${cite}`;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`Versículo copiado: ${cite}`);
            }).catch(err => {
                console.error('Falha ao copiar:', err);
            });
        }
    }

    function updateNavigationButtons() {
        // Prev button disable check
        prevBtn.disabled = (currentBookId === 1 && currentChapter === 1);
        
        // Next button disable check
        const isLastBook = currentBookId === 73;
        const isLastChapter = currentBook && currentChapter === currentBook.chapters;
        nextBtn.disabled = (isLastBook && isLastChapter);
    }

    function navigatePrevious() {
        if (currentChapter > 1) {
            // Load previous chapter of same book
            loadBookAndChapter(currentBookId, currentChapter - 1);
        } else if (currentBookId > 1) {
            // Load previous book last chapter
            const prevBookMeta = booksIndex.find(b => b.id === currentBookId - 1);
            if (prevBookMeta) {
                loadBookAndChapter(prevBookMeta.id, prevBookMeta.chapters);
            }
        }
    }

    function navigateNext() {
        if (currentBook && currentChapter < currentBook.chapters) {
            // Load next chapter of same book
            loadBookAndChapter(currentBookId, currentChapter + 1);
        } else if (currentBookId < 73) {
            // Load next book first chapter
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
        }
    }

    function applySettings() {
        // Clear old classes
        bibleTextContainer.classList.remove('font-serif', 'font-sans', ...sizeClasses);
        
        // Apply font
        const fontClass = activeFont === 'serif' ? 'font-serif' : 'font-sans';
        bibleTextContainer.classList.add(fontClass);
        fontToggle.textContent = activeFont === 'serif' ? 'Fonte: Serifada' : 'Fonte: Sem Serifa';
        
        // Apply size
        bibleTextContainer.classList.add(`size-${activeSize}`);
    }

    // Helper to escape HTML characters
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

    // Toast message helper
    function showToast(message) {
        let toast = document.getElementById('bible-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'bible-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(60, 42, 33, 0.9)';
            toast.style.color = '#fff';
            toast.style.padding = '0.8rem 1.5rem';
            toast.style.borderRadius = '30px';
            toast.style.fontFamily = 'var(--font-body)';
            toast.style.fontSize = '0.9rem';
            toast.style.zIndex = '3000';
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.opacity = '0';
            toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2500);
    }
});
