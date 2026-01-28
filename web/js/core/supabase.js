// Мы не используем import from URL, потому что это ненадежно в WebApp.
// Библиотека уже загружена через тег <script> в HTML.

// Проверка на ошибки загрузки
if (!window.supabase) {
    console.error("❌ Библиотека Supabase не найдена. Проверьте подключение скрипта в HTML.");
    // alert("Ошибка подключения к базе данных"); // Можно раскомментировать для отладки
}

// Берем createClient из глобального объекта
const { createClient } = window.supabase;

// Твои данные (я их оставил как есть)
const SUPABASE_URL = "https://uplcrgnxkafcxejwuggx.supabase.co";
const SUPABASE_KEY = "sb_publishable_SDlNlU_Nco34DHqTS0DasA_5jQqyiSF";

export const _sb = createClient(SUPABASE_URL, SUPABASE_KEY);