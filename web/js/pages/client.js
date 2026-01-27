import { _sb } from '../core/supabase.js';
import { tg, showAlert } from '../core/tg.js';
import { renderClientServices, renderClientCategories } from '../ui/services.js';

let state = {
    masterId: null,
    masterInfo: null,
    services: [],
    appointments: [],

    selectedPetType: 'Собака',
    selectedService: null,
    selectedDate: null,
    selectedTime: null,

    // Добавили курсор для календаря (какой месяц сейчас смотрим)
    calendarCursor: new Date()
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function initPhoneMask(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formatted = '';
        if (value.length > 0) {
            formatted = '+7 ';
            if (value.length > 1) formatted += '(' + value.substring(1, 4);
            if (value.length >= 5) formatted += ') ' + value.substring(4, 7);
            if (value.length >= 8) formatted += '-' + value.substring(7, 9);
            if (value.length >= 10) formatted += '-' + value.substring(9, 11);
        }
        e.target.value = formatted;
    });
}

// --- ОСНОВНАЯ ЛОГИКА ---
async function init() {
    const params = new URLSearchParams(window.location.search);
    state.masterId = params.get('master_id') || params.get('start') || params.get('tgWebAppStartParam');

    if (!state.masterId && tg.initDataUnsafe?.start_param) {
        state.masterId = tg.initDataUnsafe.start_param;
    }

    if (!state.masterId) {
        document.body.innerHTML = "<div style='padding:50px;text-align:center'>❌ Мастер не найден.</div>";
        return;
    }

    await loadMasterData();
    renderStep1_PetType();
}

async function loadMasterData() {
    // 1. Инфо о мастере
    const { data: mData } = await _sb.from('masters').select('*').eq('telegram_id', state.masterId).single();
    if (mData) {
        state.masterInfo = mData;
        document.getElementById('header-title').innerText = mData.studio_name || 'Запись';
    }

    // 2. Услуги
    const { data: sData } = await _sb.from('services').select('*').eq('master_id', state.masterId);
    state.services = sData || [];

    // 3. Занятые слоты
    const { data: aData } = await _sb.from('appointments')
        .select('date_time')
        .eq('master_id', state.masterId)
        .neq('status', 'cancelled');
    state.appointments = aData || [];
}

// ... ШАГИ 1 и 2 БЕЗ ИЗМЕНЕНИЙ ...

function renderStep1_PetType() {
    const container = document.getElementById('main-container');
    container.innerHTML = `
        <div class="card">
            <div class="section-label" style="margin-top:0">1. Кто ваш питомец?</div>
            <div class="grid-3">
                <div class="select-card active" onclick="selectPetType('Собака', this)"><div>🐶</div><div>Собака</div></div>
                <div class="select-card" onclick="selectPetType('Кошка', this)"><div>🐱</div><div>Кошка</div></div>
                <div class="select-card" onclick="selectPetType('Другое', this)"><div>🐰</div><div>Другое</div></div>
            </div>
        </div>
        <div id="step2-container"></div>
    `;
    state.selectedPetType = 'Собака';
    renderStep2_Services();
}

window.selectPetType = (type, el) => {
    state.selectedPetType = type;
    document.querySelectorAll('.select-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    state.selectedService = null;
    document.getElementById('step2-container').innerHTML = '';
    renderStep2_Services();
};

function renderStep2_Services() {
    const container = document.getElementById('step2-container');
    let relevantServices = state.services;
    const petFilter = state.selectedPetType.toLowerCase().substring(0, 3);

    if (petFilter !== 'дру') {
        relevantServices = state.services.filter(s => !s.category || s.category.toLowerCase().includes(petFilter));
    }

    container.innerHTML = `
        <div class="card" id="services-card">
            <div class="section-label" style="margin-top:0">2. Выберите услугу</div>
            <div id="cats-container" class="cat-scroll"></div>
            <div id="services-list"></div>
        </div>
        <div id="step3-container"></div>
    `;

    const sList = document.getElementById('services-list');
    const cList = document.getElementById('cats-container');

    const initialCat = renderClientCategories(cList, relevantServices, (cat) => {
        renderClientServices(sList, relevantServices, cat, selectService);
    });
    renderClientServices(sList, relevantServices, initialCat, selectService);
}

function selectService(service) {
    state.selectedService = service;
    renderStep3_DateTime();
    setTimeout(() => document.getElementById('step3-container').scrollIntoView({behavior: 'smooth'}), 100);
}

// ==========================================
// ШАГ 3: КАЛЕНДАРЬ (ИСПРАВЛЕННЫЙ)
// ==========================================
function renderStep3_DateTime() {
    const container = document.getElementById('step3-container');

    // Сбрасываем курсор календаря на текущий месяц при открытии
    state.calendarCursor = new Date();

    container.innerHTML = `
        <div class="card">
            <div class="section-label" style="margin-top:0">3. Дата и время</div>

            <div class="cal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <button onclick="changeMonth(-1)" style="border:none; background:none; color:var(--accent); font-size:20px; cursor:pointer; padding:5px;">❮</button>
                <b id="cal-month-label" style="font-size:16px;"></b>
                <button onclick="changeMonth(1)" style="border:none; background:none; color:var(--accent); font-size:20px; cursor:pointer; padding:5px;">❯</button>
            </div>

            <div class="cal-grid" id="cal-grid"></div>

            <div id="time-container" style="display:none; border-top:1px solid #eee; margin-top:16px; padding-top:16px;">
                <div class="section-label" style="margin:0 0 8px 0">Свободное время</div>
                <div class="time-grid" id="time-grid"></div>
            </div>
        </div>
        <div id="step4-container"></div>
    `;

    renderCalendar();
}

// Функция переключения месяца (глобальная, чтобы работала из onclick)
window.changeMonth = (step) => {
    state.calendarCursor.setMonth(state.calendarCursor.getMonth() + step);
    renderCalendar();
};

function renderCalendar() {
    const date = state.calendarCursor; // Берем месяц из курсора
    const grid = document.getElementById('cal-grid');
    const label = document.getElementById('cal-month-label');
    const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

    if(label) label.innerText = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    if(!grid) return;

    grid.innerHTML = '';

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(date.getFullYear(), date.getMonth(), i);
        const el = document.createElement('div');
        el.className = 'day';
        el.innerText = i;

        // Проверяем: выбран ли этот день?
        if (state.selectedDate && d.getTime() === state.selectedDate.getTime()) {
            el.classList.add('active');
        }

        // Прошедшие дни
        if (d < today) {
            el.classList.add('disabled');
        } else {
            el.onclick = () => selectDate(d, el);
        }

        // Сегодня
        if (d.getTime() === today.getTime() && !el.classList.contains('active')) {
            el.style.border = "1px solid var(--accent)";
            el.style.color = "var(--accent)";
        }

        grid.appendChild(el);
    }
}

function selectDate(date, el) {
    state.selectedDate = date;

    // Перерисовка, чтобы убрать выделение с других дней
    renderCalendar();

    document.getElementById('time-container').style.display = 'block';
    renderTimeSlots(date);
}

function renderTimeSlots(date) {
    const grid = document.getElementById('time-grid');
    grid.innerHTML = '';
    const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
    const dateStr = date.toLocaleDateString('ru-RU');
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    times.forEach(time => {
        const tDiv = document.createElement('button');
        tDiv.className = 'time-slot';
        tDiv.innerText = time;

        // Выделение выбранного времени
        if (state.selectedTime === time) {
            tDiv.classList.add('active');
        }

        const fullDT = `${dateStr} ${time}`;
        const isBusy = state.appointments.some(a => a.date_time === fullDT);
        const isPast = isToday && parseInt(time.split(':')[0]) <= now.getHours();

        if (isBusy) { tDiv.classList.add('busy'); tDiv.innerText = "Занято"; }
        else if (isPast) { tDiv.classList.add('past'); }
        else {
            tDiv.onclick = () => {
                state.selectedTime = time;
                renderTimeSlots(date); // Перерисовка для подсветки
                renderStep4_Form();
            };
        }
        grid.appendChild(tDiv);
    });
}

function renderStep4_Form() {
    const container = document.getElementById('step4-container');
    const user = tg.initDataUnsafe?.user || {};
    container.innerHTML = `
        <div class="card">
            <div class="section-label" style="margin-top:0">4. Детали записи</div>
            <input type="text" id="client-name" placeholder="Ваше имя" value="${user.first_name || ''}">
            <input type="tel" id="client-phone" placeholder="+7 (___) ___-__-__">
            <input type="text" id="pet-breed" placeholder="Порода (например, Шпиц)" style="margin-top:10px">
            <input type="text" id="pet-name" placeholder="Кличка питомца">
            <button class="btn" style="margin-top:16px;" onclick="submitBooking()">✅ Подтвердить запись</button>
        </div>
    `;
    initPhoneMask(document.getElementById('client-phone'));
    setTimeout(() => container.scrollIntoView({behavior: 'smooth'}), 100);
}

window.submitBooking = async () => {
    const payload = {
        master_id: state.masterId,
        service: state.selectedService.name,
        price: state.selectedService.price,
        date: state.selectedDate.toLocaleDateString('ru-RU'),
        time: state.selectedTime,
        pet_type: state.selectedPetType,
        breed: document.getElementById('pet-breed').value || 'Не указана',
        pet_name: document.getElementById('pet-name').value || 'Без клички',
        phone: document.getElementById('client-phone').value,
        username: tg.initDataUnsafe?.user?.username || ''
    };
    if (!payload.phone || payload.phone.length < 10) return showAlert("Введите корректный номер телефона!");
    tg.sendData(JSON.stringify(payload));
};

init();