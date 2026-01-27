import { parseDateTime } from '../shared/utils.js';

export function renderApptsList(container, appointments, actions) {
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `<div style="text-align:center; margin-top:40px; color:#999;">📭 Пока нет записей</div>`;
        return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Подготовка дат
    appointments.forEach(item => {
        item._jsDate = item.date_time ? parseDateTime(item.date_time) : new Date(0);
    });

    // Сортировка: Свежие (будущие) и Архив (прошлые/отмененные)
    const future = appointments.filter(i => i.status !== 'cancelled' && i._jsDate >= todayStart)
        .sort((a,b) => a._jsDate - b._jsDate);

    const archive = appointments.filter(i => i.status === 'cancelled' || i._jsDate < todayStart)
        .sort((a,b) => b._jsDate - a._jsDate);

    container.innerHTML = '';

    // 1. Рендер Актуальных
    if (future.length > 0) {
        future.forEach(a => container.appendChild(createApptCard(a, false, actions)));
    } else {
        container.innerHTML += `<div style="text-align:center; padding:20px; color:#aaa">Нет актуальных записей</div>`;
    }

    // 2. Рендер Архива (сворачиваемый список)
    if (archive.length > 0) {
        const archiveContainer = document.createElement('div');
        archiveContainer.className = 'archive-container';

        const btn = document.createElement('div');
        btn.className = 'archive-btn';
        btn.innerHTML = `<span>🗄 Архив (${archive.length})</span> <span>▼</span>`;
        btn.onclick = function() {
            this.classList.toggle('open');
            const list = this.nextElementSibling;
            list.style.display = list.style.display === "block" ? "none" : "block";
        };

        const arcList = document.createElement('div');
        arcList.className = 'archive-list';
        arcList.style.display = "none";

        archive.forEach(a => arcList.appendChild(createApptCard(a, true, actions)));

        archiveContainer.appendChild(btn);
        archiveContainer.appendChild(arcList);
        container.appendChild(archiveContainer);
    }
}

// --- ФУНКЦИЯ СОЗДАНИЯ ОДНОЙ КАРТОЧКИ ---
function createApptCard(a, isArchive, actions) {
    const div = document.createElement('div');
    const isCancelled = a.status === 'cancelled';
    div.className = `card appt-card ${isArchive || isCancelled ? 'past' : ''}`;

    // Иконка статуса
    let statusLabel = isCancelled ? '<span style="color:var(--danger)">❌ Отменено</span>' : (isArchive ? '🏁' : '📅');

    // HTML контент (Информация)
    div.innerHTML = `
        <div class="appt-time">${statusLabel} ${a.date_time}</div>
        <div class="client-name" style="${isCancelled ? 'text-decoration:line-through;color:#999':''}">
            👤 ${a.client_name || 'Клиент'}
        </div>
        <div class="info-row">🐶 ${a.breed || ''} ${a.pet_name ? '('+a.pet_name+')' : ''}</div>
        <div class="info-row">✂️ ${a.service}</div>
        <div class="info-row" style="font-size:13px; margin-top:4px; color:#666;">📞 ${a.phone}</div>
    `;

    // Кнопка Удаления (Корзина)
    if (!isCancelled && !isArchive && actions.onDelete) {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-appt-del';
        delBtn.innerHTML = '🗑'; // Можно иконку SVG, но эмодзи надежнее
        delBtn.onclick = (e) => { e.stopPropagation(); actions.onDelete(a.id); };
        div.appendChild(delBtn);
    }

    // БЛОК КНОПОК ДЕЙСТВИЙ (Только для активных записей)
    if (!isArchive && !isCancelled) {
        const btnsRow = document.createElement('div');
        btnsRow.style.display = 'flex';
        btnsRow.style.gap = '8px';
        btnsRow.style.marginTop = '12px';

        // [КНОПКА 1] НАПИСАТЬ (Зеленая) - Появляется только если есть username
        if (a.username) {
            const chatBtn = document.createElement('div');
            chatBtn.className = 'copy-phone-btn';
            chatBtn.style.flex = '1';
            // Стили зеленой кнопки
            chatBtn.style.background = 'rgba(52, 199, 89, 0.15)';
            chatBtn.style.color = '#2da84e'; // iOS Green
            chatBtn.innerHTML = `💬 Написать`;

            chatBtn.onclick = (e) => {
                e.stopPropagation();
                const cleanUser = a.username.replace('@', '').replace('https://t.me/', '');
                // Открываем нативную ссылку Telegram
                if (window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(`https://t.me/${cleanUser}`);
                } else {
                    window.open(`https://t.me/${cleanUser}`, '_blank');
                }
            };
            btnsRow.appendChild(chatBtn);
        }

        // [КНОПКА 2] ПОЗВОНИТЬ (Серая)
        if (a.phone && actions.onCopyPhone) {
            const callBtn = document.createElement('div');
            callBtn.className = 'copy-phone-btn';
            callBtn.style.flex = '1';
            callBtn.innerHTML = `📞 Скопировать`;
            callBtn.onclick = (e) => {
                e.stopPropagation();
                actions.onCopyPhone(a.phone);
            };
            btnsRow.appendChild(callBtn);
        }

        div.appendChild(btnsRow);
    }

    return div;
}