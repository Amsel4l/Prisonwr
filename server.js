require('dotenv').config(); // Подключение переменных окружения (секретов)
const express = require('express');
const session = require('express-session'); // Модуль для сессий
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// --- НАСТРОЙКИ СЕРВЕРА И МИДЛВАРЫ ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Настройка сессий (печенек) для админки — ВАЖНО: должно быть ДО роутов
app.use(session({
    secret: process.env.SESSION_SECRET || 'prison-secret-key-2026', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true, 
        maxAge: 1000 * 60 * 60 * 24 // Сессия живет 24 часа
    }
}));

// Функция-охранник: пропускает только админа
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Доступ запрещен' });
    }
}

// --- ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ---
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite (database.db)');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT UNIQUE,
        contact TEXT,
        password TEXT,
        registeredAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regType TEXT,
        nickname TEXT,
        roles TEXT,
        rank TEXT,
        guild TEXT,
        appliedAt TEXT
    )`);
});

// ==========================================
// --- 👑 АДМИНСКИЕ МАРШРУТЫ (Управление сайтом) ---
// ==========================================

// Логин для администратора
app.post('/api/admin-login', (req, res) => {
    const { password } = req.body;
    // Берем пароль из файла .env или используем стандартный
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'твой_супер_пароль'; 

    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true; // Выдаем админскую печеньку
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
});

// Проверка статуса (для показа скрытых вкладок)
app.get('/api/check-admin', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// Выход из админки
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Ошибка при выходе' });
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});
// Защищенный маршрут: отдаем HTML-файл админки ТОЛЬКО если есть сессия
app.get('/admin-panel', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// Пример: Защищенный маршрут (доступен только админу).
// Позже ты можешь использовать его, чтобы выводить список заявок в админ-панель
app.get('/api/admin/tournaments', requireAdmin, (req, res) => {
    db.all(`SELECT * FROM tournaments`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// ==========================================
// --- 🎮 ПОЛЬЗОВАТЕЛЬСКИЕ МАРШРУТЫ (Публичные) ---
// ==========================================

// 1. Регистрация игроков на платформе
app.post('/register', (req, res) => {
    const { nickname, contact, password } = req.body;
    const registeredAt = new Date().toLocaleString('ru-RU');

    const query = `INSERT INTO users (nickname, contact, password, registeredAt) VALUES (?, ?, ?, ?)`;
    
    db.run(query, [nickname, contact, password, registeredAt], function(err) {
        if (err) {
            console.error('Ошибка регистрации:', err.message);
            return res.json({ success: false, message: 'Такой Riot ID уже зарегистрирован!' });
        }
        
        console.log(`Новый профиль сохранен в SQLite: ${nickname}`);
        res.json({ success: true, message: `Профиль ${nickname} успешно создан!` });
    });
});

// 2. Вход в аккаунт игроков (Логин)
app.post('/login', (req, res) => {
    const { nickname, password } = req.body;

    const query = `SELECT * FROM users WHERE nickname = ? AND password = ?`;
    
    db.get(query, [nickname, password], (err, row) => {
        if (err) {
            console.error('Ошибка входа:', err.message);
            return res.json({ success: false, message: 'Ошибка сервера' });
        }
        
        if (row) {
            console.log(`Успешный вход в аккаунт: ${nickname}`);
            res.json({ 
                success: true, 
                message: `С возвращением, ${nickname}!`,
                nickname: row.nickname 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Неверный Riot ID или пароль!' 
            });
        }
    });
});

// 3. Заявки на турнир / кастомку
app.post('/join-tournament', (req, res) => {
    const { regType, nickname, roles, rank, guild } = req.body;
    const appliedAt = new Date().toLocaleString('ru-RU');

    const query = `INSERT INTO tournaments (regType, nickname, roles, rank, guild, appliedAt) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(query, [regType, nickname, roles, rank, guild, appliedAt], function(err) {
        if (err) {
            console.error('Ошибка турнирной заявки:', err.message);
            return res.json({ success: false, message: 'Не удалось отправить заявку.' });
        }

        console.log(`Новая заявка на турнир сохранена в SQLite от игрока: ${nickname}`);
        res.json({ success: true, message: `Заявка на турнир для игрока ${nickname} успешно принята!` });
    });
});

// --- ЗАПУСК ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер PRISON успешно запущен на порту ${PORT}`);
});