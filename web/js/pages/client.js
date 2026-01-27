import { _sb } from '../core/supabase.js';
import { tg, showAlert, initTg } from '../core/tg.js';
import { getMasterId, applyPhoneMask } from '../shared/utils.js';
import { renderClientCategories, renderClientServices } from '../ui/services.js';
import { renderCalendar, renderTimeSlots } from '../ui/calendar.js';

let mId = null;
let currDate = new Date();
let booking = {
    pet_type: "", breed: "", pet_name: "",
    service: "", duration: 60, price: 0,
    phone: "", date: null, time: null, master_id: null
};
let allServices = [];

async function init() {
    initTg();
    mId = getMasterId();
    booking.master_id = mId;

    if (!mId) return document.body.innerHTML = "Ошибка: Нет ID мастера";

    applyPhoneMask(document.getElementById('p-phone'));

    // 1. Загрузка мастера (шапка)
    const { data: m } = await _sb.from('masters').select('*').eq('telegram_id', mId).single();
    if (m) renderMasterHeader(m);

    // 2. Загрузка услуг
    const { data: srv } = await _sb.from('services').select('*').eq('master_id', mId);
    allServices = srv || [];

    // Рендер категорий и календаря
    const firstCat = renderClientCategories(
        document.getElementById('category-filter'),
        allServices,
        (cat) => renderServices(cat)
    );
    if(allServices.length > 0) renderServices(firstCat);

    updateCalendar();
}

function renderMasterHeader(m) {
    document.getElementById('studio-name').innerText = m.studio_name;
    if(m.photo_url) {
        document.getElementById('m-avatar').src = m.photo_url;
        document.getElementById('m-avatar').style.display = 'block';
        document.getElementById('m-placeholder').style.display = 'none';
    }
    if(m.address) {
        const el = document.getElementById('m-address');
        el.querySelector('span').innerText = m.address;
        el.style.display = 'flex';
    }
    if(m.about_text) {
        const el = document.getElementById('m-about');
        el.innerText = m.about_text;
        el.style.display = 'block';
    }
}

function renderServices(cat) {
    renderClientServices(
        document.getElementById('services-container'),
        allServices,
        cat,
        (service) => {
            booking.service = service.name;
            booking.price = service.price;
            booking.duration = service.duration || 60;
        }
    );
}

function updateCalendar() {
    // 1. Обновляем заголовок (Месяц Год) - ВОТ ЭТОЙ СТРОКИ НЕ ХВАТАЛО
    document.getElementById('month-label').innerText = new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        year: 'numeric'
    }).format(currDate);

    // 2. Рисуем сетку дней
    renderCalendar(document.getElementById('calendar'), currDate, (dateStr) => {
        booking.date = dateStr;
        loadBusySlots(dateStr);
    });
}

async function loadBusySlots(dateStr) {
    const loader = document.getElementById('loader-time');
    const container = document.getElementById('time-slots');
    container.innerHTML = ""; loader.style.display = "block";

    const { data } = await _sb.from('appointments')
        .select('date_time')
        .eq('master_id', mId)
        .ilike('date_time', `${dateStr}%`)
        .neq('status', 'cancelled');

    loader.style.display = "none";

    const busyTimes = (data || []).map(item => item.date_time.split(' ')[1]);

    renderTimeSlots(container, dateStr, busyTimes, (time) => {
        booking.time = time;
    });
}

function changeMonth(dir) {
    currDate.setMonth(currDate.getMonth() + dir);
    updateCalendar();
}

function setPetType(type, id) {
    document.querySelectorAll('.select-card').forEach(el=>el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    booking.pet_type = type;
}

function sendBooking() {
    booking.username = tg.initDataUnsafe.user?.username || "";
    booking.breed = document.getElementById('p-breed').value;
    booking.pet_name = document.getElementById('p-name').value;
    booking.phone = document.getElementById('p-phone').value;

    if(!booking.pet_type || !booking.service || !booking.breed || !booking.date || !booking.time || booking.phone.length < 10) {
        return showAlert("Заполните все поля (питомец, услуга, дата, телефон)!");
    }
    tg.sendData(JSON.stringify(booking));
    tg.close();
}

// Экспорт для HTML
window.changeMonth = changeMonth;
window.setPetType = setPetType;
window.sendBooking = sendBooking;

init();