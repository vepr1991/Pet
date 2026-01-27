// --- ДЛЯ АДМИНА ---
export function renderAdminServices(container, services, onDeleteClick) {
    if (!services || services.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#999">Нет услуг</div>';
        return;
    }

    container.innerHTML = '';
    services.forEach(s => {
        const div = document.createElement('div');
        div.className = 'service-row';
        div.innerHTML = `
            <div style="flex:1">
                <div style="font-size:10px;color:#888;text-transform:uppercase">${s.category || 'Без категории'}</div>
                <div style="font-size:16px;font-weight:500">${s.name}</div>
                <div style="color:var(--accent);font-weight:600">${s.price} ₸</div>
            </div>
        `;

        // Кнопка удаления
        const btn = document.createElement('button');
        btn.className = 'btn-del';
        btn.innerText = '✕';
        btn.onclick = () => onDeleteClick(s.id);

        div.appendChild(btn);
        container.appendChild(div);
    });
}

// --- ДЛЯ КЛИЕНТА ---
export function renderClientCategories(container, services, onSelect) {
    const categories = [...new Set(services.map(s => s.category || "Основное"))].sort();
    container.innerHTML = '';

    categories.forEach((cat, index) => {
        const btn = document.createElement('div');
        btn.className = `cat-chip ${index === 0 ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            onSelect(cat);
        };
        container.appendChild(btn);
    });

    return categories[0] || "Основное";
}

export function renderClientServices(container, services, category, onSelect) {
    container.innerHTML = "";
    const filtered = services.filter(s => (s.category || "Основное") === category);

    filtered.forEach(s => {
        const item = document.createElement('div');
        item.className = 'service-card-rich';

        const imgHtml = s.image_url
            ? `<img src="${s.image_url}" class="srv-img">`
            : `<div class="srv-img" style="display:flex;align-items:center;justify-content:center;color:#ccc;font-size:20px;">✂️</div>`;

        // Форматирование времени (Smart Slots)
        const dur = s.duration || 60;
        const hours = Math.floor(dur / 60);
        const mins = dur % 60;
        const timeStr = (hours > 0 ? `${hours} ч ` : '') + (mins > 0 ? `${mins} мин` : '');

        item.innerHTML = `
            ${imgHtml}
            <div class="srv-info">
                <div class="srv-title">${s.name}</div>
                <div style="font-size:12px; color:#555; margin-bottom:4px;">⏳ ${timeStr}</div>
                ${s.description ? `<div class="srv-desc">${s.description.substring(0,60)}...</div>` : ''}
                <div class="srv-price">${s.price} ₸</div>
            </div>`;

        item.onclick = () => {
            document.querySelectorAll('.service-card-rich').forEach(el=>el.classList.remove('active'));
            item.classList.add('active');
            onSelect(s);
        };
        container.appendChild(item);
    });
}