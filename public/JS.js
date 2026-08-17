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
// --- Аккордеон регламента ---
function toggleRule(headerElem) {
    const content = headerElem.nextElementSibling;
    const isVisible = content.classList.contains('show');
    
    // Закрываем все открытые вкладки в данном аккордеоне
    const accordionContainer = headerElem.closest('.rules-accordion');
    accordionContainer.querySelectorAll('.rules-content').forEach(c => c.classList.remove('show'));
    
    // Если кликнутая вкладка была закрыта — открываем её
    if (!isVisible) {
        content.classList.add('show');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-login-btn');
    const closeBtn = document.getElementById('close-login-btn');
    const modal = document.getElementById('login-modal');

    // Открытие окна
    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }

    // Закрытие по крестику
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Закрытие при клике мимо формы
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const joinButtons = document.querySelectorAll('.join-btn');
    const formContainer = document.getElementById('registration-form-container');
    const placeholder = document.getElementById('registration-placeholder');
    const eventDisplay = document.getElementById('selected-event-display');
    const eventInput = document.getElementById('side_tournament_name');

    // Обработка клика на кнопку "Присоединяйся" внутри постера
    joinButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Предотвращаем срабатывание клика по самому календарю (если есть другие события)
            e.stopPropagation(); 
            
            // Получаем название эвента из атрибута кнопки
            const eventName = btn.getAttribute('data-event');
            
            // Обновляем текст и скрытый инпут
            eventDisplay.textContent = eventName;
            eventInput.value = eventName;
            
            // Меняем видимость колонок справа
            placeholder.style.display = 'none';
            formContainer.style.display = 'block';
            
            // Добавляем небольшую анимацию появления формы (опционально)
            formContainer.style.opacity = 0;
            setTimeout(() => {
                formContainer.style.transition = 'opacity 0.3s ease';
                formContainer.style.opacity = 1;
            }, 10);
        });
    });
});

// Функция для переключения на вкладку с регламентом
function openRulesTab(event) {
    event.preventDefault(); // Чтобы страница не прыгала вверх
    
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показываем страницу регламента (убедитесь, что ID совпадает с вашим HTML)
    const rulesPage = document.getElementById('page-rules');
    if (rulesPage) {
        rulesPage.classList.add('active');
        // Опционально: скролл наверх страницы
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
// Функция проверки прав админа при загрузке страницы
async function checkAdminStatus() {
    try {
        const res = await fetch('/api/check-admin');
        const data = await res.json();

        if (data.isAdmin) {
            // Показываем элементы админа (например, добавляем класс к body)
            document.body.classList.add('is-admin');
            console.log('Админ-режим активен');
        } else {
            document.body.classList.remove('is-admin');
        }
    } catch (err) {
        console.error('Ошибка проверки прав:', err);
    }
}

// Запускаем проверку после загрузки страницы
document.addEventListener('DOMContentLoaded', checkAdminStatus);

// Функция для выхода из аккаунта
async function adminLogout() {
    const res = await fetch('/api/logout', { method: 'POST' });
    if (res.ok) {
        window.location.reload(); // Перезагружаем страницу после выхода
    }
}
