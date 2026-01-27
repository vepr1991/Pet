import { _sb } from '../core/supabase.js';
import { tg, showAlert } from '../core/tg.js';
import { getMasterId, copyToClipboard } from '../shared/utils.js';
import { renderAdminServices } from '../ui/services.js';
import { renderApptsList } from '../ui/appts.js';
import { initModal, showConfirmModal } from '../ui/modal.js';

let mId = null;

// --- ИНИЦИАЛИЗАЦИЯ ---
async function init() {
    mId = getMasterId();
    if (!mId) {
        document.body.innerHTML = "<div style='padding:50px; text-align:center;'>⚠️ ID мастера не найден.</div>";
        return;
    }
    initModal();
    await refreshData();
}

async function refreshData() {
    await Promise.all([loadMaster(), loadAppts(), loadServices()]);
}

// --- ЗАГРУЗКА ДАННЫХ ---
async function loadMaster() {
    const { data } = await _sb.from('masters').select('*').eq('telegram_id', mId).single();
    if (data) {
        document.getElementById('header-studio-name').innerText = data.studio_name || 'Студия';

        // Заполняем поля профиля
        document.getElementById('pf-name').value = data.studio_name || '';
        document.getElementById('pf-address').value = data.address || '';
        document.getElementById('pf-about').value = data.about_text || '';
        document.getElementById('pf-photo').value = data.photo_url || '';

        updatePreview(data.photo_url);
    }
}

async function loadAppts() {
    const list = document.getElementById('appts-list');
    list.innerHTML = '<div style="text-align:center; padding:20px; color:#999">Загрузка...</div>';

    const { data, error } = await _sb.from('appointments').select('*').eq('master_id', mId);

    if (error) {
        list.innerHTML = `<div style="text-align:center; color:red">Ошибка: ${error.message}</div>`;
        return;
    }

    renderApptsList(list, data, {
        onDelete: (id) => askDelete(id, 'appt'),
        onCopyPhone: (phone) => copyToClipboard(phone, () => showAlert("Скопировано"))
    });
}

async function loadServices() {
    const list = document.getElementById('services-list');
    // ИСПРАВЛЕНИЕ: Загружаем только АКТИВНЫЕ услуги
    const { data } = await _sb
        .from('services')
        .select('*')
        .eq('master_id', mId)
        .eq('is_active', true) // <-- Важный фильтр
        .order('category');

    renderAdminServices(list, data, (id) => askDelete(id, 'service'));
}

// --- ДЕЙСТВИЯ ---
async function addService() {
    const name = document.getElementById('srv-name').value;
    const cat = document.getElementById('srv-category').value || 'Основное';
    const price = document.getElementById('srv-price').value;
    const duration = document.getElementById('srv-duration')?.value || 60;
    const desc = document.getElementById('srv-desc').value;
    const img = document.getElementById('srv-image').value;

    if(!name || !price) return showAlert("Нужно название и цена");

    // При создании ставим is_active: true (хотя default в БД и так true)
    await _sb.from('services').insert([{
        master_id: mId, name, category: cat, price: Number(price),
        duration: Number(duration), description: desc, image_url: img,
        is_active: true
    }]);

    document.querySelectorAll('#tab-services input').forEach(i => i.value = '');
    await loadServices();
}

function askDelete(id, type) {
    const text = type === 'service' ? "Удалить услугу?" : "Отменить запись?";

    showConfirmModal(text, async () => {
        let error = null;

        if (type === 'service') {
            // Пытаемся скрыть услугу
            const res = await _sb.from('services').update({ is_active: false }).eq('id', id);
            error = res.error;

            if (!error) await loadServices(); // Обновляем список только если нет ошибки
        } else {
            // Отменяем запись
            const res = await _sb.from('appointments').update({ status: 'cancelled' }).eq('id', id);
            error = res.error;

            if (!error) await loadAppts();
        }

        // Если Supabase вернул ошибку — показываем её
        if (error) {
            console.error("Ошибка Supabase:", error);
            showAlert("❌ Ошибка: " + error.message);
        }
    });
}

async function saveProfile() {
    const name = document.getElementById('pf-name').value;
    const address = document.getElementById('pf-address').value;
    const about = document.getElementById('pf-about').value;
    const photo = document.getElementById('pf-photo').value;

    if(!name) return showAlert("Название студии обязательно!");

    const btn = document.querySelector('#tab-profile .btn');
    const oldText = btn.innerText;
    btn.innerText = "Сохранение..."; btn.disabled = true;

    // Теперь поля address, about_text, photo_url существуют в БД, ошибки не будет
    const { error } = await _sb.from('masters').update({
        studio_name: name,
        address: address,
        about_text: about,
        photo_url: photo
    }).eq('telegram_id', mId);

    btn.innerText = oldText; btn.disabled = false;

    if (error) showAlert("Ошибка: " + error.message);
    else {
        showAlert("✅ Профиль сохранен!");
        loadMaster();
    }
}

function updatePreview(url) {
    const img = document.getElementById('preview-avatar');
    const ph = document.getElementById('preview-placeholder');
    if (url && url.length > 5) {
        img.src = url; img.style.display = 'block'; ph.style.display = 'none';
    } else {
        img.style.display = 'none'; ph.style.display = 'flex';
    }
}

function showTab(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    el.classList.add('active');
}

window.refreshData = refreshData;
window.addService = addService;
window.saveProfile = saveProfile;
window.updatePreview = updatePreview;
window.showTab = showTab;

init();