// web/js/core/tg.js

// Мы БЕРЕМ tg из окна браузера и ЭКСПОРТИРУЕМ его для других файлов
export const tg = window.Telegram.WebApp;

export function initTg() {
    // Сообщаем телеграму, что приложение готово
    tg.ready(); 
    tg.expand(); // Разворачиваем на весь экран
}

export function showAlert(msg) {
    if (tg && tg.showAlert) {
        tg.showAlert(msg);
    } else {
        alert(msg);
    }
}