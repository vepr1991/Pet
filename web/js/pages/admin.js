// web/js/pages/admin.js
import { _sb } from '../core/supabase.js';
import { tg, showAlert, confirmAction } from '../core/tg.js';
import { renderApptsList } from '../ui/appts.js';
import { getMasterId } from '../shared/utils.js';

let state = {
    masterId: null,
    masterInfo: null,
    appointments: [],
    services: []
};

async function init() {
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.innerText = "Запуск...";

    // 1. Получаем ID через общую утилиту
    state.masterId = getMasterId();
    console.log("🔍 Admin initialized for master:", state.masterId);

    if (!state.masterId) {
        if (titleEl) titleEl.innerText = "ID не найден";
        document.body.innerHTML = `<div style="padding:50px; text-align:center;">❌ ID мастера не найден. Перезапустите бота.</div>`;
        return;
    }

    setupTabs();
    setupListeners();

    try {
        await loadData();
    } catch (e) {
        console.error("🛑 Ошибка инициализации:", e);
        if (titleEl) titleEl.innerText = "Ошибка системы";

        const container = document.getElementById('appts-container') || document.body;
        container.innerHTML = `
            <div style="padding:20px; text-align:center; color:var(--danger);">
                <b>🛑 Ошибка загрузки данных</b><br>
                <small>${e.message}</small>
            </div>
        `;
    }
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const sectionId = tab.getAttribute('data-tab');
            document.getElementById(sectionId)?.classList.add('active');
        });
    });
}

function setupListeners() {
    document.getElementById('btn-refresh')?.addEventListener('click', loadData);
    document.getElementById('btn-save-profile')?.addEventListener('click', saveProfile);
    document.getElementById('btn-add-service')?.addEventListener('click', addService);
}

async function loadData() {
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.innerText = "Обновление...";

    const [mResult, aResult, sResult] = await Promise.all([
        _sb.from('masters').select('*').eq('telegram_id', state.masterId).single(),
        _sb.from('appointments').select('*').eq('master_id', state.masterId).order('date_time', { ascending: true }),
        _sb.from('services').select('*').eq('master_id', state.masterId).order('name')
    ]);

    if (mResult.error || !mResult.data) {
        throw new Error("Мастер не найден в базе данных");
    }

    state.masterInfo = mResult.data;
    state.appointments = aResult.data || [];
    state.services = sResult.data || [];

    updateUI();
}

function updateUI() {
    // 1. Заголовок
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.innerText = state.masterInfo.studio_name || 'Кабинет мастера';

    // 2. Список записей
    const apptsContainer = document.getElementById('appts-container');
    if (apptsContainer) {
        renderApptsList(apptsContainer, state.appointments, {
            onDelete: async (id) => {
                if (await confirmAction("Отменить эту запись?")) await cancelAppointment(id);
            },
            onCopyPhone: (phone) => {
                if (phone) {
                    navigator.clipboard.writeText(phone);
                    showAlert("Номер скопирован!");
                }
            }
        });
    }

    // 3. Данные профиля
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('pf-name', state.masterInfo.studio_name);
    setVal('pf-address', state.masterInfo.address);
    setVal('pf-about', state.masterInfo.about);

    renderServices();
}

function renderServices() {
    const container = document.getElementById('services-list');
    if (!container) return;
    container.innerHTML = '';

    if (state.services.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#999">У вас пока нет услуг</div>`;
        return;
    }

    state.services.forEach(srv => {
        const div = document.createElement('div');
        div.className = 'service-row';
        div.innerHTML = `
            <div>
                <div style="font-weight:600;">${srv.name}</div>
                <div style="font-size:13px; color:#888;">${srv.price} ₸ • ${srv.duration_min} мин</div>
            </div>
        `;
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-del';
        btnDel.innerText = '✕';
        btnDel.onclick = () => deleteService(srv.id);
        div.appendChild(btnDel);
        container.appendChild(div);
    });
}

async function addService() {
    const name = document.getElementById('srv-name')?.value;
    const price = document.getElementById('srv-price')?.value;
    if (!name || !price) return showAlert("Введите название и цену");

    const { data, error } = await _sb.from('services').insert({
        master_id: state.masterId,
        name,
        price,
        duration_min: document.getElementById('srv-duration')?.value || 60,
        category: document.getElementById('srv-category')?.value || 'Общее',
        is_active: true
    }).select();

    if (error) return showAlert("Ошибка при добавлении");

    state.services.push(data[0]);
    renderServices();
    showAlert("Услуга добавлена");

    // Очистка
    document.getElementById('srv-name').value = '';
    document.getElementById('srv-price').value = '';
}

async function deleteService(id) {
    if (!await confirmAction("Удалить услугу?")) return;
    const { error } = await _sb.from('services').delete().eq('id', id);
    if (error) return showAlert("Ошибка удаления");
    state.services = state.services.filter(s => s.id !== id);
    renderServices();
}

async function saveProfile() {
    const name = document.getElementById('pf-name')?.value;
    if (!name) return showAlert("Название студии обязательно");

    const { error } = await _sb.from('masters').update({
        studio_name: name,
        address: document.getElementById('pf-address')?.value,
        about: document.getElementById('pf-about')?.value
    }).eq('telegram_id', state.masterId);

    if (error) return showAlert("Ошибка сохранения");
    showAlert("Профиль сохранен!");
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.innerText = name;
}

async function cancelAppointment(id) {
    const { error } = await _sb.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) return showAlert("Ошибка в базе");
    const appt = state.appointments.find(a => a.id === id);
    if (appt) appt.status = 'cancelled';
    updateUI();
}

init();