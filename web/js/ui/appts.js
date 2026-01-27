import { parseDateTime } from '../shared/utils.js';

export function renderApptsList(container, appointments, actions) {
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `<div style="text-align:center; margin-top:40px; color:#999;">📭 Пока нет записей</div>`;
        return;
    }

    // Подготовка дат
    appointments.forEach(item => {
        item._jsDate = parseDateTime(item.date_time);
    });

    const now = new Date();
    // Фильтрация
    const future = appointments.filter(i => i._jsDate >= now && i.status !== 'cancelled').sort((a,b) => a._jsDate - b._jsDate);
    const archive = appointments.filter(i => i._jsDate < now || i.status === 'cancelled').sort((a,b) => b._jsDate - a._jsDate);

    container.innerHTML = '';

    // 1. Рендер Актуальных
    if (future.length > 0) {
        future.forEach(a => container.appendChild(createApptCard(a, false, actions)));
    } else {
        container.innerHTML += `<div style="text-align:center; padding:20px; color:#aaa">Нет актуальных записей</div>`;
    }

    // 2. Рендер Архива (Аккордеон)
    if (archive.length > 0) {
        const archiveContainer = document.createElement('div');
        archiveContainer.className = 'archive-container';

        const btn = document.createElement('div');
        btn.className = 'archive-btn';
        btn.onclick = function() { this.classList.toggle('open'); this.nextElementSibling.classList.toggle('show'); };
        btn.innerHTML = `<span>🗄 Архив (${archive.length})</span> <span class="archive-arrow">▼</span>`;

        const arcList = document.createElement('div');
        arcList.className = 'archive-list';
        archive.forEach(a => arcList.appendChild(createApptCard(a, true, actions)));

        archiveContainer.appendChild(btn);
        archiveContainer.appendChild(arcList);
        container.appendChild(archiveContainer);
    }
}

function createApptCard(a, isArchive, actions) {
    const div = document.createElement('div');
    div.className = `card appt-card ${isArchive ? 'past' : ''}`;

    const isCancelled = a.status === 'cancelled';
    const statusLabel = isCancelled ? '<span style="color:var(--danger)">❌ Отменено</span>' : (isArchive ? '🏁' : '📅');

    // Кнопка удаления (только для активных)
    if (!isCancelled && !isArchive && actions.onDelete) {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-appt-del';
        delBtn.innerText = '🗑';
        delBtn.onclick = () => actions.onDelete(a.id);
        div.appendChild(delBtn);
    }

    // HTML контент
    div.innerHTML += `
        <div class="appt-time">${statusLabel} ${a.date_time}</div>
        <div class="client-name" style="${isCancelled ? 'text-decoration:line-through;color:#999':''}">👤 ${a.client_name || 'Клиент'}</div>
        <div class="info-row">🐶 ${a.breed || ''} ${a.pet_name ? '('+a.pet_name+')' : ''}</div>
        <div class="info-row">✂️ ${a.service}</div>
    `;

    // Кнопки действий (Звонок / Чат) - только для активных
    if (!isArchive && !isCancelled) {
        if (actions.onCopyPhone) {
            const phoneBtn = document.createElement('div');
            phoneBtn.className = 'copy-phone-btn';
            phoneBtn.innerHTML = `📞 ${a.phone}`;
            phoneBtn.onclick = () => actions.onCopyPhone(a.phone);
            div.appendChild(phoneBtn);
        }
    }

    return div;
}