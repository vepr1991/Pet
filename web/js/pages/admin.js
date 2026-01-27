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

    // 1. Ищем ID мастера
    state.masterId = params.get('master_id') || params.get('master') || tg.initDataUnsafe?.user?.id;

    if (!state.masterId) {
        document.body.innerHTML = `<div style="text-align:center; padding:50px;">❌ Ошибка: ID мастера не найден.<br>Перезапустите бота.</div>`;
        return;
    }

    setupTabs(); // Настраиваем вкладки
    setupListeners(); // Кнопки сохранить/обновить

    try {
        await loadData();
    } catch (e) {
        console.error(e);
        document.getElementById('header-title').innerText = "Ошибка";
        showAlert(`Ошибка загрузки: ${e.message}`);
    }
}

// --- ЛОГИКА ВКЛАДОК ---
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Убираем активный класс у всех
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

            // Добавляем текущему
            tab.classList.add('active');
            const sectionId = tab.getAttribute('data-tab');
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

function setupListeners() {
    document.getElementById('btn-refresh')?.addEventListener('click', loadData);
    // Тут можно добавить слушатели для "Добавить услугу" и "Сохранить профиль"
}

// --- ЗАГРУЗКА ДАННЫХ ---
async function loadData() {
    // Ставим спиннер
    const container = document.getElementById('appts-container');
    if(container) container.innerHTML = '<div style="text-align:center;padding:20px;color:#999">⏳ Обновление...</div>';

    // Параллельная загрузка
    const [mResult, aResult, sResult] = await Promise.all([
        _sb.from('masters').select('*').eq('telegram_id', state.masterId).single(),
        _sb.from('appointments').select('*').eq('master_id', state.masterId).order('date_time', { ascending: true }),
        _sb.from('services').select('*').eq('master_id', state.masterId)
    ]);

    if (mResult.error || !mResult.data) throw new Error("Профиль мастера не найден");

    state.masterInfo = mResult.data;
    state.appointments = aResult.data || [];
    state.services = sResult.data || [];

    // Обновляем UI
    document.getElementById('header-title').innerText = state.masterInfo.studio_name || 'Кабинет';

    // Заполняем профиль (инпуты)
    document.getElementById('pf-name').value = state.masterInfo.studio_name || '';
    document.getElementById('pf-address').value = state.masterInfo.address || '';
    document.getElementById('pf-about').value = state.masterInfo.about || '';

    renderList();
    // renderServices(); // Пока не реализовано, но место готово
}

// --- ОТРИСОВКА СПИСКА ЗАПИСЕЙ ---
function renderList() {
    const container = document.getElementById('appts-container');
    if (!container) return;

    renderApptsList(container, state.appointments, {
        onDelete: async (id) => {
            if (await confirmAction("Отменить запись?")) await cancelAppointment(id);
        },
        onCopyPhone: (phone) => {
            if (phone) window.open(`tel:${phone}`, '_self');
        }
    });
}

// --- ОТМЕНА ЗАПИСИ ---
async function cancelAppointment(id) {
    const { error } = await _sb.from('appointments').update({ status: 'cancelled' }).eq('id', id);

    if (error) return showAlert("Ошибка БД");

    // Обновляем локально
    const appt = state.appointments.find(a => a.id === id);
    if (appt) appt.status = 'cancelled';

    renderList();
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

init();