const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

// === Навигация ===

function setActiveButton(btn) {
    [homeBtn, aboutBtn].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function loadContent(page) {
    try {
        // Загружаем HTML фрагмент из папки content
        const response = await fetch(`/content/${page}.html`);
        if (!response.ok) throw new Error('Failed to load content');
        const html = await response.text();
        contentDiv.innerHTML = html;

        // Если загрузили главную страницу, инициализируем логику заметок
        if (page === 'home') {
            initNotesLogic();
        }
    } catch (err) {
        contentDiv.innerHTML = `<p style="color:red; text-align:center;">Ошибка загрузки: ${err.message}</p>`;
        console.error(err);
    }
}

homeBtn.addEventListener('click', () => {
    setActiveButton(homeBtn);
    loadContent('home');
});

aboutBtn.addEventListener('click', () => {
    setActiveButton(aboutBtn);
    loadContent('about');
});

// Загружаем главную страницу при старте
loadContent('home');


// === Логика заметок (работает только когда видна главная страница) ===

function initNotesLogic() {
    const input = document.getElementById('note-input');
    const addBtn = document.getElementById('add-btn');
    const list = document.getElementById('notes-list');

    // Загрузка из localStorage
    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem('myNotes')) || [];
        list.innerHTML = '';
        notes.forEach((note, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${note} <span class="delete-btn" data-index="${index}">×</span>`;
            list.appendChild(li);
        });

        // Обработчики удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                deleteNote(idx);
            });
        });
    }

    function addNote() {
        const text = input.value.trim();
        if (!text) return;
        const notes = JSON.parse(localStorage.getItem('myNotes')) || [];
        notes.push(text);
        localStorage.setItem('myNotes', JSON.stringify(notes));
        input.value = '';
        loadNotes();
    }

    function deleteNote(index) {
        const notes = JSON.parse(localStorage.getItem('myNotes')) || [];
        notes.splice(index, 1);
        localStorage.setItem('myNotes', JSON.stringify(notes));
        loadNotes();
    }

    addBtn.addEventListener('click', addNote);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNote();
    });

    loadNotes();
}

// === Регистрация Service Worker ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.error('SW registration failed:', err));
    });
}