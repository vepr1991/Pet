import { parseDateTime } from '../shared/utils.js';

export function renderApptsList(container, appointments, actions) {
    console.log("🚀 renderApptsList запущен. Записей:", appointments?.length);

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `<div style="text-align:center; margin-top:40px; color:#999;">📭 Пока нет записей</div>`;
        return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    appointments.forEach(item => {
        item._jsDate = item.date_time ? parseDateTime(item.date_time) : new Date(0);
    });

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
    if (isCancelled) statusLabel = '<span style="color:red">❌ Отменено</span>';

    // --- ЛОГИКА КНОПКИ УДАЛЕНИЯ ---
    // Проверяем условия для рендера кнопки
    const canDelete = !isCancelled && !isArchive && actions.onDelete;

    if (canDelete) {
        console.log(`➕ Добавляю кнопку удаления для ID: ${a.id}`);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-appt-del';
        delBtn.innerText = '🗑';

        // ВЕШАЕМ ОБРАБОТЧИК С АЛЕРТОМ
        delBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();

            // ЕСЛИ ТЫ ВИДИШЬ ЭТОТ ALERT - ЗНАЧИТ ФАЙЛ appts.js И style.css РАБОТАЮТ ИДЕАЛЬНО
            alert(`🛠 DEBUG: Клик по корзине пойман!\nID записи: ${a.id}`);

            console.log(`🔥 Клик по корзине ID: ${a.id}`);

            if (actions.onDelete) {
                actions.onDelete(a.id);
            } else {
                alert("❌ Ошибка: Функция onDelete не передана!");
            }
        };
        div.appendChild(delBtn);
    }

    div.innerHTML += `
        <div class="appt-time">${statusLabel} ${a.date_time}</div>
        <div class="client-name" style="${isCancelled ? 'text-decoration:line-through;color:#999':''}">👤 ${a.client_name || 'Клиент'}</div>
        <div class="info-row">🐶 ${a.breed || ''} ${a.pet_name ? '('+a.pet_name+')' : ''}</div>
        <div class="info-row">✂️ ${a.service}</div>
        <div class="info-row" style="font-size:12px; margin-top:4px;">📞 ${a.phone}</div>
    `;

    if (!isArchive && !isCancelled && actions.onCopyPhone) {
        const phoneBtn = document.createElement('div');
        phoneBtn.className = 'copy-phone-btn';
        phoneBtn.innerHTML = `📞 Позвонить`;
        phoneBtn.onclick = () => actions.onCopyPhone(a.phone);
        div.appendChild(phoneBtn);
    }

    return div;
}