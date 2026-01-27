import { _sb } from '../core/supabase.js';
import { tg, showAlert, confirmAction } from '../core/tg.js';
import { renderApptsList } from '../ui/appts.js';

let state = {
    masterId: null,
    masterInfo: null,
    appointments: [],
    services: []
};

// --- ИНИЦИАЛИЗАЦИЯ ---
async function init() {
    const params = new URLSearchParams(window.location.search);
    state.masterId = params.get('master_id') || params.get('master') || tg.initDataUnsafe?.user?.id;

    if (!state.masterId) {
        document.body.innerHTML = `<div style="padding:40px; text-align:center;">❌ ID мастера не найден. Перезапустите бота.</div>`;
        return;
    }

    setupTabs();
    setupListeners();

    try {
        await loadData();
    } catch (e) {
        console.error(e);
        document.getElementById('header-title').innerText = "Ошибка загрузки";
    }
}

// --- ЛОГИКА ВКЛАДОК ---
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            const sectionId = tab.getAttribute('data-tab');
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

function setupListeners() {
    document.getElementById('btn-refresh')?.addEventListener('click', loadData);

    // Кнопка сохранения профиля
    document.getElementById('btn-save-profile')?.addEventListener('click', saveProfile);

    // Кнопка добавления услуги
    document.getElementById('btn-add-service')?.addEventListener('click', addService);
}

// --- ЗАГРУЗКА ДАННЫХ ---
async function loadData() {
    // Показываем спиннер, пока грузим
    const header = document.getElementById('header-title');
    if(header) header.innerText = 'Обновление...';

    const [mResult, aResult, sResult] = await Promise.all([
        _sb.from('masters').select('*').eq('telegram_id', state.masterId).single(),
        _sb.from('appointments').select('*').eq('master_id', state.masterId).order('date_time', { ascending: true }),
        _sb.from('services').select('*').eq('master_id', state.masterId).order('name')
    ]);

    if (!mResult.data) throw new Error("Мастер не найден");

    state.masterInfo = mResult.data;
    state.appointments = aResult.data || [];
    state.services = sResult.data || [];

    updateUI();
}

function updateUI() {
    // 1. Заголовок (Название салона)
    const titleEl = document.getElementById('header-title');
    if (titleEl) {
        titleEl.innerText = state.masterInfo.studio_name || 'Кабинет мастера';
    }

    // 2. Вкладка "Записи"
    const apptsContainer = document.getElementById('appts-container');
    if (apptsContainer) {
        renderApptsList(apptsContainer, state.appointments, {
            onDelete: async (id) => {
                if (await confirmAction("Отменить запись?")) await cancelAppointment(id);
            },
            onCopyPhone: (phone) => {
                if(phone) window.open(`tel:${phone}`, '_self');
            }
        });
    }

    // 3. Вкладка "Профиль" (Заполняем поля)
    document.getElementById('pf-name').value = state.masterInfo.studio_name || '';
    document.getElementById('pf-address').value = state.masterInfo.address || '';
    document.getElementById('pf-about').value = state.masterInfo.about || '';

    // Аватарка (если есть)
    // document.getElementById('pf-photo').value = state.masterInfo.avatar_url || '';

    // 4. Вкладка "Услуги"
    renderServices();
}

// --- ОТРИСОВКА УСЛУГ ---
function renderServices() {
    const container = document.getElementById('services-list');
    if (!container) return;

    container.innerHTML = '';

    if (state.services.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#999">Услуг пока нет</div>`;
        return;
    }

    state.services.forEach(srv => {
        const div = document.createElement('div');
        div.className = 'service-row'; // Используем стиль из style.css
        div.innerHTML = `
            <div>
                <div style="font-weight:600;">${srv.name}</div>
                <div style="font-size:13px; color:#888;">${srv.price} ₸ • ${srv.duration_min} мин</div>
            </div>
        `;

        // Кнопка удаления услуги
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-del'; // Стиль крестика
        btnDel.innerText = '✕';
        btnDel.onclick = () => deleteService(srv.id);

        div.appendChild(btnDel);
        container.appendChild(div);
    });
}

// --- ДЕЙСТВИЯ: ДОБАВЛЕНИЕ УСЛУГИ ---
async function addService() {
    const name = document.getElementById('srv-name').value;
    const price = document.getElementById('srv-price').value;
    const duration = document.getElementById('srv-duration').value || 60;
    const category = document.getElementById('srv-category').value || 'Основное';
    const desc = document.getElementById('srv-desc').value || '';

    if (!name || !price) return showAlert("Введите название и цену");

    const { data, error } = await _sb.from('services').insert({
        master_id: state.masterId,
        name,
        price,
        duration_min: duration,
        category,
        description: desc,
        is_active: true
    }).select();

    if (error) {
        console.error(error);
        return showAlert("Ошибка при создании");
    }

    // Очищаем поля
    document.getElementById('srv-name').value = '';
    document.getElementById('srv-price').value = '';

    // Обновляем список
    state.services.push(data[0]);
    renderServices();
    showAlert("Услуга добавлена!");
}

// --- ДЕЙСТВИЯ: УДАЛЕНИЕ УСЛУГИ ---
async function deleteService(id) {
    if (!await confirmAction("Удалить услугу?")) return;

    const { error } = await _sb.from('services').delete().eq('id', id);
    if (error) return showAlert("Ошибка удаления");

    state.services = state.services.filter(s => s.id !== id);
    renderServices();
}

// --- ДЕЙСТВИЯ: СОХРАНЕНИЕ ПРОФИЛЯ ---
async function saveProfile() {
    const name = document.getElementById('pf-name').value;
    const address = document.getElementById('pf-address').value;
    const about = document.getElementById('pf-about').value;

    if (!name) return showAlert("Название студии обязательно");

    const { error } = await _sb.from('masters').update({
        studio_name: name,
        address: address,
        about: about
    }).eq('telegram_id', state.masterId);

    if (error) return showAlert("Ошибка сохранения");

    showAlert("Профиль сохранен!");
    document.getElementById('header-title').innerText = name;
}

// --- ОТМЕНА ЗАПИСИ ---
async function cancelAppointment(id) {
    const { error } = await _sb.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) return showAlert("Ошибка БД");

    const appt = state.appointments.find(a => a.id === id);
    if (appt) appt.status = 'cancelled';

    updateUI(); // Перерисовываем список
}

init();