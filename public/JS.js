document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Проверяем, заходил ли пользователь раньше, и меняем "Гость" в профиле на его ник
    const currentUser = localStorage.getItem('loggedInUser');
    if (currentUser) {
        // Исправлен селектор для точного попадания в профиль (id="profile-username" из HTML)
        const userProfileName = document.querySelector('#profile-username'); 
        if (userProfileName) {
            userProfileName.textContent = currentUser;
        }
    }

    // 2. Универсальная функция для отправки форм без перезагрузки
    const handleFormSubmit = (formSelector, successCallback) => {
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
                    if (successCallback) successCallback(result);
                } else {
                    alert(result.message || 'Ошибка выполнения действия.');
                }
            } catch (error) {
                console.error('Ошибка отправки:', error);
                alert('Не удалось связаться с сервером.');
            }
        });
    };

    // Подключаем форму регистрации аккаунта
    handleFormSubmit('form[action="/register"]');

    // Подключаем форму регистрации на турнир
    handleFormSubmit('form[action="/join-tournament"]');

    // Подключаем форму входа (логина) со специфическим действием при успехе
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
                    // Сохраняем ник в памяти браузера
                    localStorage.setItem('loggedInUser', result.nickname);
                    alert(result.message);
                    loginForm.reset();
                    
                    // Сразу меняем статус "Гость" в профиле без перезагрузки
                    const userProfileName = document.querySelector('#profile-username');
                    if (userProfileName) {
                        userProfileName.textContent = result.nickname;
                    }
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