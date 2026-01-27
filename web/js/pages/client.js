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
    selectedTime: null
};

async function init() {
    const params = new URLSearchParams(window.location.search);

    // Пытаемся достать ID всеми способами
    state.masterId = params.get('master_id') || params.get('start') || params.get('tgWebAppStartParam');

    // Если всё еще нет, пробуем достать из объекта tg
    if (!state.masterId && tg.initDataUnsafe?.start_param) {
        state.masterId = tg.initDataUnsafe.start_param;
    }

    if (!state.masterId) {
        document.body.innerHTML = `
            <div style="padding:50px 20px; text-align:center;">
                <div style="font-size:40px; margin-bottom:20px;">👤❓</div>
                <h3 style="margin-bottom:10px;">Мастер не найден</h3>
                <p style="color:#888; font-size:14px;">Пожалуйста, перейдите по прямой ссылке, которую вам прислал мастер.</p>
            </div>
        `;
        return;
    }

    await loadMasterData();
    renderStep1_PetType();
}

async function loadMasterData() {
    // Загружаем данные мастера
    const { data: mData, error: mErr } = await _sb.from('masters').select('*').eq('telegram_id', state.masterId).single();

    if (mErr || !mData) {
        console.error("Master not found:", mErr);
        document.getElementById('header-title').innerText = "Студия";
    } else {
        state.masterInfo = mData;
        document.getElementById('header-title').innerText = mData.studio_name || 'Запись';
    }

    // Услуги
    const { data: sData } = await _sb.from('services').select('*').eq('master_id', state.masterId);
    state.services = sData || [];

    // Занятые слоты
    const { data: aData } = await _sb.from('appointments')
        .select('date_time')
        .eq('master_id', state.masterId)
        .neq('status', 'cancelled');
    state.appointments = aData || [];
}

// --- ШАГ 1: ПИТОМЕЦ ---
function renderStep1_PetType() {
    const container = document.getElementById('main-container');
    container.innerHTML = `
        <div class="card">
            <div class="section-label" style="margin-top:0">1. Кто ваш питомец?</div>
            <div class="grid-3">
                <div class="select-card active" onclick="selectPetType('Собака', this)">
                    <div>🐶</div><div>Собака</div>
                </div>
                <div class="select-card" onclick="selectPetType('Кошка', this)">
                    <div>🐱</div><div>Кошка</div>
                </div>
                <div class="select-card" onclick="selectPetType('Другое', this)">
                    <div>🐰</div><div>Другое</div>
                </div>
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
    state.selectedDate = null;
    state.selectedTime = null;

    const s2 = document.getElementById('step2-container');
    if(s2) s2.innerHTML = '';
    renderStep2_Services();
};

// --- ШАГ 2: УСЛУГИ ---
function renderStep2_Services() {
    const container = document.getElementById('step2-container');

    let relevantServices = state.services;
    const petFilter = state.selectedPetType.toLowerCase().substring(0, 3); // "соб" или "кош"

    // Если это не "другое", пытаемся фильтровать по категориям
    if (petFilter !== 'дру') {
        relevantServices = state.services.filter(s =>
            !s.category || s.category.toLowerCase().includes(petFilter)
        );
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

// --- ШАГ 3: ДАТА И ВРЕМЯ ---
function renderStep3_DateTime() {
    const container = document.getElementById('step3-container');
    const today = new Date();

    container.innerHTML = `
        <div class="card">
            <div class="section-label" style="margin-top:0">3. Дата и время</div>
            <div class="cal-header">
                <b id="cal-month-label"></b>
            </div>
            <div class="cal-grid" id="cal-grid"></div>

            <div id="time-container" style="display:none; border-top:1px solid #eee; margin-top:16px; padding-top:16px;">
                <div class="section-label" style="margin:0 0 8px 0">Свободное время</div>
                <div class="time-grid" id="time-grid"></div>
            </div>
        </div>
        <div id="step4-container"></div>
    `;

    renderCalendar(today);
}

function renderCalendar(date) {
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

        if (d < today) {
            el.classList.add('disabled'); // Прошедшие - серые
        } else {
            el.onclick = () => selectDate(d, el);
        }

        if (d.getTime() === today.getTime()) {
            el.style.border = "1px solid var(--accent)";
            el.style.color = "var(--accent)";
        }
        grid.appendChild(el);
    }
}

function selectDate(date, el) {
    state.selectedDate = date;
    document.querySelectorAll('.day').forEach(d => {
        d.classList.remove('active');
        d.style.background = '';
        d.style.color = '';
    });
    el.classList.add('active');
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
    const currentHour = now.getHours();

    times.forEach(time => {
        const tDiv = document.createElement('button');
        tDiv.className = 'time-slot';
        tDiv.innerText = time;

        const fullDateTime = `${dateStr} ${time}`;
        const isBusy = state.appointments.some(a => a.date_time === fullDateTime);

        let isPast = false;
        if (isToday) {
            const slotHour = parseInt(time.split(':')[0]);
            if (slotHour <= currentHour) isPast = true;
        }

        if (isBusy) {
            tDiv.classList.add('busy');
            tDiv.innerText = "Занято";
        } else if (isPast) {
            tDiv.classList.add('past');
        } else {
            tDiv.onclick = () => selectTime(time, tDiv);
        }
        grid.appendChild(tDiv);
    });
}

function selectTime(time, el) {
    state.selectedTime = time;
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderStep4_Form();
    setTimeout(() => {
        const el = document.getElementById('step4-container');
        if(el) el.scrollIntoView({behavior: 'smooth'});
    }, 100);
}

// --- ШАГ 4: ФОРМА ---
function renderStep4_Form() {
    const container = document.getElementById('step4-container');
    const user = tg.initDataUnsafe?.user || {};

    container.innerHTML = `
        <div class="card">
            <div class="section-label" style="margin-top:0">4. Детали</div>

            <input type="text" id="client-name" placeholder="Ваше имя" value="${user.first_name || ''}">
            <input type="tel" id="client-phone" placeholder="Телефон (+7...)">

            <input type="text" id="pet-breed" placeholder="Порода (например, Шпиц)" style="margin-top:10px">
            <input type="text" id="pet-name" placeholder="Кличка питомца">

            <div style="margin-top:20px; font-size:13px; color:#666; text-align:center; background:#F2F2F7; padding:10px; border-radius:10px;">
                📅 <b>${state.selectedDate.toLocaleDateString()}</b> в <b>${state.selectedTime}</b><br>
                ✂️ ${state.selectedService.name} (${state.selectedService.price} ₸)
            </div>

            <button class="btn" style="margin-top:16px;" onclick="submitBooking()">✅ Записаться</button>
        </div>
        <div style="height:60px"></div>
    `;
}

window.submitBooking = async () => {
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const breed = document.getElementById('pet-breed').value;
    const petName = document.getElementById('pet-name').value;

    if (!name || !phone) return showAlert("Введите имя и телефон!");

    const payload = {
        master_id: state.masterId,
        service: state.selectedService.name,
        price: state.selectedService.price,
        date: state.selectedDate.toLocaleDateString('ru-RU'),
        time: state.selectedTime,
        pet_type: state.selectedPetType,
        breed: breed || 'Не указана',
        pet_name: petName || 'Без клички',
        phone: phone,
        username: tg.initDataUnsafe?.user?.username || ''
    };

    tg.sendData(JSON.stringify(payload));
};

init();