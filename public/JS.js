document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Переключение страниц по клику на меню и кнопки (data-target)
    const navTargets = document.querySelectorAll('[data-target]');
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('nav a');

    navTargets.forEach(target => {
        target.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = target.getAttribute('data-target');
            
            // Переключаем активный раздел
            pages.forEach(page => {
                if (page.id === `page-${targetId}`) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });

            // Подсвечиваем пункт меню
            navLinks.forEach(link => {
                if (link.getAttribute('data-target') === targetId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // 2. Открытие календаря турниров
    const btnCalendar = document.getElementById('btn-toggle-calendar');
    const scheduleBox = document.getElementById('schedule-box');
    if (btnCalendar && scheduleBox) {
        btnCalendar.addEventListener('click', () => {
            const isHidden = scheduleBox.style.display === 'none' || scheduleBox.style.display === '';
            scheduleBox.style.display = isHidden ? 'block' : 'none';
        });
    }

    // 3. Отображение сохраненного пользователя в профиле
    const currentUser = localStorage.getItem('loggedInUser');
    if (currentUser) {
        const userProfileName = document.querySelector('#profile-username'); 
        if (userProfileName) userProfileName.textContent = currentUser;
    }

    // 4. Универсальная отправка форм
    const handleFormSubmit = (formSelector) => {
        const form = document.querySelector(formSelector);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(result.message);
                    form.reset();
                } else {
                    alert(result.message || 'Ошибка выполнения действия.');
                }
            } catch (error) {
                console.error('Ошибка отправки:', error);
                alert('Не удалось связаться с сервером.');
            }
        });
    };

    handleFormSubmit('form[action="/register"]');
    handleFormSubmit('form[action="/join-tournament"]');

    // 5. Форма входа
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('loggedInUser', result.nickname);
                    alert(result.message);
                    loginForm.reset();
                    
                    const userProfileName = document.querySelector('#profile-username');
                    if (userProfileName) userProfileName.textContent = result.nickname;
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Ошибка входа:', error);
                alert('Не удалось войти. Проверьте сервер.');
            }
        });
    }
});

// --- ГЛОБАЛЬНЫЕ ФУНКЦИИ (ДЛЯ ONCLICK В HTML) ---

// Раскрытие пунктов регламента
function toggleRule(headerElement) {
    const content = headerElement.nextElementSibling;
    if (content) {
        content.classList.toggle('show');
    }
}

// Добавление игрока в ростер команды
function draftPlayer(rowElement) {
    const myTeamList = document.getElementById('my-team-list');
    const emptyMsg = document.getElementById('empty-roster-msg');
    
    if (emptyMsg) emptyMsg.style.display = 'none';

    const name = rowElement.cells[0].innerText;
    const role = rowElement.cells[1].innerHTML;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${name}</td>
        <td>${role}</td>
        <td><button onclick="this.closest('tr').remove()" style="background: transparent; color: var(--red-main); border: none; cursor: pointer;">✕ Удалить</button></td>
    `;

    myTeamList.appendChild(newRow);
    rowElement.style.opacity = '0.4';
    rowElement.style.pointerEvents = 'none';
}