// === Логика приложения ===
const noteInput = document.getElementById('noteInput');
const addBtn = document.getElementById('addBtn');
const notesList = document.getElementById('notesList');
const statusDiv = document.getElementById('status');

// Загрузка заметок из localStorage
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('myNotes')) || [];
    renderNotes(notes);
}

// Отрисовка списка
function renderNotes(notes) {
    notesList.innerHTML = '';
    notes.forEach((note, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${note}</span>
            <span class="delete-btn" onclick="deleteNote(${index})">×</span>
        `;
        notesList.appendChild(li);
    });
}

// Добавление заметки
function addNote() {
    const text = noteInput.value.trim();
    if (!text) return;

    const notes = JSON.parse(localStorage.getItem('myNotes')) || [];
    notes.push(text);
    localStorage.setItem('myNotes', JSON.stringify(notes));
    
    noteInput.value = '';
    renderNotes(notes);
}

// Удаление заметки
window.deleteNote = function(index) {
    const notes = JSON.parse(localStorage.getItem('myNotes')) || [];
    notes.splice(index, 1);
    localStorage.setItem('myNotes', JSON.stringify(notes));
    renderNotes(notes);
};

// События
addBtn.addEventListener('click', addNote);
noteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNote();
});

// Статус сети
function updateOnlineStatus() {
    if (navigator.onLine) {
        statusDiv.textContent = '✅ Вы в сети';
        statusDiv.className = 'online';
    } else {
        statusDiv.textContent = '❌ Офлайн режим (работает через кэш)';
        statusDiv.className = 'offline';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

loadNotes();

// === Регистрация Service Worker ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW зарегистрирован:', reg.scope))
            .catch(err => console.error('Ошибка SW:', err));
    });
}