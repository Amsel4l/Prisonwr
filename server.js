const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// --- НАСТРОЙКИ СЕРВЕРА ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Подключение к базе данных SQLite (файл создастся автоматически)
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite (database.db)');
    }
});

// Создаем таблицы, если они еще не существуют
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

// 1. Регистрация на платформе
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

// 2. Вход в аккаунт (Логин)
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

// 3. Регистрация на турнир / кастомку
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

// --- ЗАПУСК (с динамическим портом для хостинга) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер PRISON успешно запущен на порту ${PORT}`);
});