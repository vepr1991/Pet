// This import is CRITICAL! It brings 'tg' and 'initTg' from your core file.
import { tg, initTg } from '../core/tg.js';

function route() {
    initTg(); // Tell Telegram the app is ready

    const urlParams = new URLSearchParams(window.location.search);

    // 1. Try to find Master ID in the URL (?master=...)
    // 2. OR in start_param (if opened via ?start=...)
    const masterFromUrl = urlParams.get('master');
    const startParam = tg.initDataUnsafe.start_param;
    const userId = tg.initDataUnsafe.user?.id;

    // Priority: explicit master ID -> start_param
    const targetMasterId = masterFromUrl || startParam;

    if (targetMasterId) {
        // If there is a Master ID, it's a client wanting to book
        window.location.replace(`client.html?master=${targetMasterId}`);
    }
    else if (userId) {
        // If no Master ID but User ID exists, it's the master entering the admin panel
        window.location.replace(`admin.html?master=${userId}`);
    }
    else {
        // Edge case (opened in browser without parameters)
        const loader = document.getElementById('loader');
        if (loader) {
            loader.innerText = "⚠️ Error: Launch the bot in Telegram";
            loader.style.color = "var(--danger)";
        }
    }
}

// Run with a slight delay for smoothness
setTimeout(route, 100);