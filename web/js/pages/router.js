// web/js/pages/router.js

// Импортируем tg из соседней папки core
import { tg, initTg } from '../core/tg.js';

function route() {
    initTg();

    const urlParams = new URLSearchParams(window.location.search);

    const masterFromUrl = urlParams.get('master');
    const startParam = tg.initDataUnsafe.start_param;
    const userId = tg.initDataUnsafe.user?.id;

    const targetMasterId = masterFromUrl || startParam;

    if (targetMasterId) {
        window.location.replace(`client.html?master=${targetMasterId}`);
    }
    else if (userId) {
        window.location.replace(`admin.html?master=${userId}`);
    }
    else {
        document.getElementById('loader').innerText = "⚠️ Ошибка: Запустите бота в Telegram";
        document.getElementById('loader').style.color = "var(--danger)";
    }
}

setTimeout(route, 100);