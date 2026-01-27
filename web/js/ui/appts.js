import { parseDateTime } from '../shared/utils.js';

export function renderApptsList(container, appointments, actions) {
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `<div style="text-align:center; margin-top:40px; color:#999;">📭 Пока нет записей</div>`;
        return;
    }

    // Подготовка дат
    appointments.forEach(item => {
        // Если даты нет, ставим старую, чтобы ушло в архив
        item._jsDate = item.date_time ? parseDateTime(item.date_time) : new Date(0);
    });

    const now = new Date();

    // Актуальные: Дата в будущем И статус НЕ cancelled
    const future = appointments.filter(i =>
        i._jsDate >= now && i.status !== 'cancelled'
    ).sort((a,b) => a._jsDate - b._jsDate);

    // Архив: Дата в прошлом ИЛИ статус cancelled
    const archive = appointments.filter(i =>
        i._jsDate < now || i.status === 'cancelled'
    ).sort((a,b) => b._jsDate - a._jsDate);

    // ---------------------------------

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
        // При клике переключаем класс open у кнопки и show у списка
        btn.onclick = function() {
            this.classList.toggle('open');
            const list = this.nextElementSibling;
            if (list.style.display === "block") {
                list.style.display = "none";
            } else {
                list.style.display = "block";
            }
        };
        btn.innerHTML = `<span>🗄 Архив (${archive.length})</span> <span class="archive-arrow">▼</span>`;

        const arcList = document.createElement('div');
        arcList.className = 'archive-list';
        // По умолчанию скрыто
        arcList.style.display = "none";

        archive.forEach(a => arcList.appendChild(createApptCard(a, true, actions)));

        archiveContainer.appendChild(btn);
        archiveContainer.appendChild(arcList);
        container.appendChild(archiveContainer);
    }
}

function createApptCard(a, isArchive, actions) {
    const div = document.createElement('div');
    // Если статус cancelled, добавляем класс past (чтобы стало серым)
    const isCancelled = a.status === 'cancelled';
    div.className = `card appt-card ${isArchive || isCancelled ? 'past' : ''}`;

    let statusLabel = isArchive ? '🏁' : '📅';
    if (isCancelled) statusLabel = '<span style="color:red">❌ Отменено</span>';

    // Кнопка удаления (только для АКТИВНЫХ и НЕ отмененных)
    // Если запись в архиве или уже отменена - кнопку удаления не показываем
    if (!isCancelled && !isArchive && actions.onDelete) {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-appt-del';
        delBtn.innerText = '🗑'; // Иконка корзины
        delBtn.onclick = (e) => {
            e.stopPropagation(); // Чтобы не кликалось по карточке
            actions.onDelete(a.id);
        };
        div.appendChild(delBtn);
    }

    // HTML контент
    div.innerHTML += `
        <div class="appt-time">${statusLabel} ${a.date_time}</div>
        <div class="client-name" style="${isCancelled ? 'text-decoration:line-through;color:#999':''}">👤 ${a.client_name || 'Клиент'}</div>
        <div class="info-row">🐶 ${a.breed || ''} ${a.pet_name ? '('+a.pet_name+')' : ''}</div>
        <div class="info-row">✂️ ${a.service}</div>
        <div class="info-row" style="font-size:12px; margin-top:4px;">📞 ${a.phone}</div>
    `;

    // Кнопка копирования телефона (если активная запись)
    if (!isArchive && !isCancelled && actions.onCopyPhone) {
        const phoneBtn = document.createElement('div');
        phoneBtn.className = 'copy-phone-btn';
        phoneBtn.innerHTML = `📞 Позвонить`;
        phoneBtn.onclick = () => actions.onCopyPhone(a.phone);
        div.appendChild(phoneBtn);
    }

    return div;
}