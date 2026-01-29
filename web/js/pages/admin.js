import { _sb } from '../core/supabase.js';
import { tg, initTg, showAlert, confirmAction } from '../core/tg.js';
import { renderApptsList } from '../ui/appts.js';

let state = {
    masterId: null, // ID из URL (строка)
    masterInfo: null, // Объект мастера из БД
    appointments: [],
    services: []
};

async function init() {
    initTg();
    const params = new URLSearchParams(window.location.search);

    // --- НАЧАЛО: НОВАЯ ЛОГИКА АВТОРИЗАЦИИ (JWT) ---
    const token = params.get('token');

    if (token) {
        // Если есть токен, авторизуемся в Supabase
        const { data, error } = await _sb.auth.setSession({
            access_token: token,
            refresh_token: token
        });

        if (error) {
            console.error("Auth Error:", error);
            document.body.innerHTML = `<div style="padding:20px;color:red;text-align:center">Ошибка авторизации.<br>Перезапустите бота.</div>`;
            return;
        }

        // Достаем master_id из защищенного токена
        const user = await _sb.auth.getUser();
        const embeddedId = user?.data?.user?.user_metadata?.telegram_id;

        if (embeddedId) {
            state.masterId = embeddedId;
        }
    }
    // --- КОНЕЦ: НОВАЯ ЛОГИКА ---

    // Фолбэк для старых ссылок или если токена нет (но с RLS работать не будет)
    if (!state.masterId) {
        state.masterId = params.get('master_id') || params.get('master') || tg.initDataUnsafe?.user?.id;
    }

    if (!state.masterId) {
        document.body.innerHTML = `<div style="padding:50px; text-align:center; color:red;">❌ ID мастера не найден. Запустите через бота.</div>`;
        return;
    }

    setupTabs();
    setupListeners();

    try {
        await loadData();
    } catch (e) {
        console.error(e);
        const container = document.getElementById('appts-container') || document.body;
        container.innerHTML = `
            <div style="padding:20px; text-align:center; color:#FF3B30;">
                <b style="font-size:18px;">🛑 Ошибка загрузки:</b><br>
                <div style="margin-top:10px; font-size:13px;">${e.message}</div>
                <button onclick="location.reload()" class="btn" style="margin-top:15px;">🔄 Повторить</button>
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
            const section = document.getElementById(sectionId);
            if (section) section.classList.add('active');

            if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
        });
    });
}

function setupListeners() {
    document.getElementById('btn-refresh')?.addEventListener('click', loadData);
    document.getElementById('btn-save-profile')?.addEventListener('click', saveProfile);
    document.getElementById('btn-add-service')?.addEventListener('click', addService);
}

async function loadData() {
    const header = document.getElementById('header-title');
    if(header) header.innerText = 'Обновление...';

    // 1. Загружаем профиль мастера
    const { data: masterData, error: mError } = await _sb
        .from('masters')
        .select('*')
        .eq('telegram_id', state.masterId)
        .single();

    if (mError || !masterData) {
        throw new Error("Мастер не найден в базе. Попробуйте нажать /start в боте.");
    }

    state.masterInfo = masterData;
    const reliableMasterId = masterData.telegram_id;

    // 2. Загружаем записи и услуги
    const [aResult, sResult] = await Promise.all([
        _sb.from('appointments')
           .select('*')
           .eq('master_id', reliableMasterId)
           .order('date_time', { ascending: true }),

        _sb.from('services')
           .select('*')
           .eq('master_id', reliableMasterId)
           .order('name')
    ]);

    state.appointments = aResult.data || [];
    state.services = sResult.data || [];

    updateUI();
}

function updateUI() {
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.innerText = state.masterInfo.studio_name || 'Кабинет мастера';

    const apptsContainer = document.getElementById('appts-container');
    if (apptsContainer) {
        renderApptsList(apptsContainer, state.appointments, {
            onDelete: async (id) => {
                if (await confirmAction("Отменить запись?")) await cancelAppointment(id);
            },
            onCopyPhone: (phone) => {
                if(phone) {
                   if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
                   window.open(`tel:${phone}`, '_self');
                }
            }
        });
    }

    const fields = {
        'pf-name': state.masterInfo.studio_name,
        'pf-address': state.masterInfo.address,
        'pf-about': state.masterInfo.about_text
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    }

    renderServices();
}

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
        div.className = 'service-row';
        div.innerHTML = `
            <div>
                <div style="font-weight:600;">${srv.name}</div>
                <div style="font-size:13px; color:#888;">${srv.price} ₸ • ${srv.duration || 60} мин</div>
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
    const duration = document.getElementById('srv-duration')?.value || 60;
    const category = document.getElementById('srv-category')?.value || 'Основное';
    const desc = document.getElementById('srv-desc')?.value || '';

    if (!name || !price) return showAlert("Введите название и цену");

    if (!state.masterInfo || !state.masterInfo.telegram_id) {
        return showAlert("Ошибка: Профиль мастера не загружен");
    }

    const { data, error } = await _sb.from('services').insert({
        master_id: state.masterInfo.telegram_id,
        name,
        price,
        duration: duration,
        category,
        description: desc,
        is_active: true
    }).select();

    if (error) {
        console.error("Add Service Error:", error);
        return showAlert("Ошибка при создании: " + error.message);
    }

    document.getElementById('srv-name').value = '';
    document.getElementById('srv-price').value = '';

    if (data && data[0]) {
        state.services.push(data[0]);
    } else {
        await loadData();
        return;
    }

    renderServices();
    showAlert("Услуга добавлена!");
}

async function deleteService(id) {
    if (!await confirmAction("Удалить услугу?")) return;

    const { error } = await _sb.from('services').delete().eq('id', id);

    if (error) {
        console.error("Delete Service Error:", error);
        return showAlert("Ошибка удаления");
    }

    state.services = state.services.filter(s => s.id !== id);
    renderServices();
}

async function saveProfile() {
    const name = document.getElementById('pf-name')?.value;
    const address = document.getElementById('pf-address')?.value;
    const about = document.getElementById('pf-about')?.value;

    if (!name) return showAlert("Название студии обязательно");
    if (!state.masterInfo || !state.masterInfo.telegram_id) return showAlert("Ошибка: Профиль не загружен");

    const { error } = await _sb.from('masters').update({
        studio_name: name,
        address: address,
        about_text: about
    }).eq('telegram_id', state.masterInfo.telegram_id);

    if (error) {
        console.error("Save Profile Error:", error);
        return showAlert("Ошибка сохранения: " + error.message);
    }

    showAlert("Профиль сохранен!");

    state.masterInfo.studio_name = name;
    state.masterInfo.address = address;
    state.masterInfo.about_text = about;
    
    const title = document.getElementById('header-title');
    if (title) title.innerText = name;
}

async function cancelAppointment(id) {
    const { error } = await _sb.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) return showAlert("Ошибка БД");
    
    const appt = state.appointments.find(a => a.id === id);
    if (appt) appt.status = 'cancelled';
    updateUI();
}

init();