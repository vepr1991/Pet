import { _sb } from '../core/supabase.js';
import { tg, showAlert } from '../core/tg.js';
import { getMasterId, copyToClipboard } from '../shared/utils.js';
import { renderAdminServices } from '../ui/services.js';
import { renderApptsList } from '../ui/appts.js';
import { initModal, showConfirmModal } from '../ui/modal.js';

let mId = null;

async function init() {
    mId = getMasterId();
    if (!mId) return document.body.innerHTML = "⚠️ ID мастера не найден.";
    initModal();
    await refreshData();
}

async function refreshData() {
    await Promise.all([loadMaster(), loadAppts(), loadServices()]);
}

async function loadMaster() {
    const { data } = await _sb.from('masters').select('*').eq('telegram_id', mId).single();
    if (data) {
        document.getElementById('header-studio-name').innerText = data.studio_name || 'Студия';
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

    // ИЗМЕНЕНИЕ: Убрали .eq('is_active', true), так как удаляем насовсем
    const { data } = await _sb
        .from('services')
        .select('*')
        .eq('master_id', mId)
        .order('category');

    renderAdminServices(list, data, (id) => askDelete(id, 'service'));
}

async function addService() {
    const name = document.getElementById('srv-name').value;
    const cat = document.getElementById('srv-category').value || 'Основное';
    const price = document.getElementById('srv-price').value;
    const duration = document.getElementById('srv-duration')?.value || 60;
    const desc = document.getElementById('srv-desc').value;
    const img = document.getElementById('srv-image').value;

    if(!name || !price) return showAlert("Нужно название и цена");

    // ИЗМЕНЕНИЕ: Убрали is_active из insert
    await _sb.from('services').insert([{
        master_id: mId, name, category: cat, price: Number(price),
        duration: Number(duration), description: desc, image_url: img
    }]);

    document.querySelectorAll('#tab-services input').forEach(i => i.value = '');
    await loadServices();
}

function askDelete(id, type) {
    const text = type === 'service' ? "Удалить услугу навсегда?" : "Отменить запись (в архив)?";

    showConfirmModal(text, async () => {
        let error = null;

        if (type === 'service') {
            // ЛОГИКА 1: УСЛУГИ - УДАЛЯЕМ НАСОВСЕМ (HARD DELETE)
            const res = await _sb.from('services').delete().eq('id', id);
            error = res.error;
            if (!error) await loadServices();

        } else {
            // ЛОГИКА 2: ЗАПИСИ - В АРХИВ (SOFT DELETE)
            const cleanId = Number(id); // Важно: ID должен быть числом

            const res = await _sb
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', cleanId);

            error = res.error;
            if (!error) await loadAppts();
        }

        if (error) {
            console.error("DB Error:", error);
            showAlert("❌ Ошибка: " + error.message);
        }
    });
}

// ... (остальные функции saveProfile, updatePreview, showTab без изменений) ...
async function saveProfile() {
    const name = document.getElementById('pf-name').value;
    const address = document.getElementById('pf-address').value;
    const about = document.getElementById('pf-about').value;
    const photo = document.getElementById('pf-photo').value;

    if(!name) return showAlert("Название студии обязательно!");

    const btn = document.querySelector('#tab-profile .btn');
    const oldText = btn.innerText;
    btn.innerText = "Сохранение..."; btn.disabled = true;

    const { error } = await _sb.from('masters').update({
        studio_name: name, address, about_text: about, photo_url: photo
    }).eq('telegram_id', mId);

    btn.innerText = oldText; btn.disabled = false;
    if (error) showAlert(error.message);
    else { showAlert("✅ Сохранено"); loadMaster(); }
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