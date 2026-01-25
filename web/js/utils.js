/* web/js/utils.js */

// Инициализация Telegram
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Инициализация Supabase
// Вставьте сюда свои реальные ключи
const SUPABASE_URL = 'https://uplcrgnxkafcxejwuggx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SDlNlU_Nco34DHqTS0DasA_5jQqyiSF';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Вспомогательная функция для алертов
function showAlert(msg) {
    tg.showAlert(msg);
}

// Экспорт для использования в других файлах (через глобальную область)
window._sb = _sb;
window.tg = tg;