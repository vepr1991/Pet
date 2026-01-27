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

    // Сортировка
    const future = appointments.filter(i =>
        i.status !== 'cancelled' && i._jsDate >= todayStart
    ).sort((a,b) => a._jsDate - b._jsDate);

    const archive = appointments.filter(i =>
        i.status === 'cancelled' || i._jsDate < todayStart
    ).sort((a,b) => b._jsDate - a._jsDate);

    container.innerHTML = '';

    // Рендер Актуальных
    if (future.length > 0) {
        future.forEach(a => container.appendChild(createApptCard(a, false, actions)));
    } else {
        container.innerHTML += `<div style="text-align:center; padding:20px; color:#aaa">Нет актуальных записей</div>`;
    }

    // Рендер Архива
    if (archive.length > 0) {
        const archiveContainer = document.createElement('div');
        archiveContainer.className = 'archive-container';

        const btn = document.createElement('div');
        btn.className = 'archive-btn';
        btn.onclick = function() {
            this.classList.toggle('open');
            const list = this.nextElementSibling;
            list.style.display = list.style.display === "block" ? "none" : "block";
        };
        btn.innerHTML = `<span>🗄 Архив (${archive.length})</span> <span class="archive-arrow">▼</span>`;

        const arcList = document.createElement('div');
        arcList.className = 'archive-list';
        arcList.style.display = "none";

        archive.forEach(a => arcList.appendChild(createApptCard(a, true, actions)));

        archiveContainer.appendChild(btn);
        archiveContainer.appendChild(arcList);
        container.appendChild(archiveContainer);
    }
}

function createApptCard(a, isArchive, actions) {
    const div = document.createElement('div');
    const isCancelled = a.status === 'cancelled';
    div.className = `card appt-card ${isArchive || isCancelled ? 'past' : ''}`;

    let statusLabel = isArchive ? '🏁' : '📅';
    if (isCancelled) statusLabel = '<span style="color:var(--danger)">❌ Отменено</span>';

    // 1. HTML КОНТЕНТ (ИНФОРМАЦИЯ)
    div.innerHTML = `
        <div class="appt-time">${statusLabel} ${a.date_time}</div>
        <div class="client-name" style="${isCancelled ? 'text-decoration:line-through;color:#999':''}">
            👤 ${a.client_name || 'Клиент'}
        </div>
        <div class="info-row">🐶 ${a.breed || ''} ${a.pet_name ? '('+a.pet_name+')' : ''}</div>
        <div class="info-row">✂️ ${a.service}</div>
        <div class="info-row" style="font-size:13px; margin-top:4px; color:#666;">📞 ${a.phone}</div>
    `;

    // 2. КНОПКА УДАЛЕНИЯ (КОРЗИНА)
    // Добавляем поверх HTML, чтобы сохранить функционал
    const canDelete = !isCancelled && !isArchive && actions.onDelete;
    if (canDelete) {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-appt-del';
        delBtn.innerText = '🗑';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            actions.onDelete(a.id);
        };
        div.appendChild(delBtn);
    }

    // 3. БЛОК КНОПОК "НАПИСАТЬ" И "ПОЗВОНИТЬ"
    // (Только для активных записей)
    if (!isArchive && !isCancelled) {
        const btnsRow = document.createElement('div');
        btnsRow.style.display = 'flex';
        btnsRow.style.gap = '8px';
        btnsRow.style.marginTop = '12px';

        // КНОПКА "НАПИСАТЬ" (Зеленая) - если есть username
        if (a.username) {
            const chatBtn = document.createElement('div');
            chatBtn.className = 'copy-phone-btn';
            chatBtn.style.flex = '1'; // Растягиваем равномерно
            chatBtn.style.background = 'rgba(52, 199, 89, 0.15)'; // Зеленый фон
            chatBtn.style.color = '#2da84e'; // Зеленый текст
            chatBtn.innerHTML = `💬 Написать`;

            chatBtn.onclick = (e) => {
                e.stopPropagation();
                // Чистим username от @ и ссылки
                const cleanUser = a.username.replace('@', '').replace('https://t.me/', '');

                // Используем методы Telegram WebApp если доступны
                if (window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(`https://t.me/${cleanUser}`);
                } else {
                    window.open(`https://t.me/${cleanUser}`, '_blank');
                }
            };
            btnsRow.appendChild(chatBtn);
        }

        // КНОПКА "ПОЗВОНИТЬ" (Серая) - если есть телефон
        if (a.phone && actions.onCopyPhone) {
            const callBtn = document.createElement('div');
            callBtn.className = 'copy-phone-btn';
            callBtn.style.flex = '1'; // Растягиваем равномерно
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