import { tg, initTg } from '../core/tg.js';

function route() {
    initTg(); // Сообщаем Телеграму, что приложение готово

    const urlParams = new URLSearchParams(window.location.search);
    
    // 1. Пытаемся найти ID мастера в ссылке (?master=...)
    // 2. ИЛИ в start_param (если открыли через ?start=...)
    const masterFromUrl = urlParams.get('master');
    const startParam = tg.initDataUnsafe.start_param;
    const userId = tg.initDataUnsafe.user?.id;

    // Приоритет: явный master ID -> start_param
    const targetMasterId = masterFromUrl || startParam;

    if (targetMasterId) {
        // Если есть ID мастера — это клиент, который хочет записаться
        window.location.replace(`client.html?master=${targetMasterId}`);
    } 
    else if (userId) {
        // Если ID мастера нет, но есть User ID — значит это сам мастер зашел в админку
        window.location.replace(`admin.html?master=${userId}`);
    } 
    else {
        // Крайний случай (открыли в браузере без параметров)
        document.getElementById('loader').innerText = "⚠️ Ошибка: Запустите бота в Telegram";
        document.getElementById('loader').style.color = "var(--danger)";
    }
}

// Запускаем с небольшой задержкой для плавности
setTimeout(route, 100);