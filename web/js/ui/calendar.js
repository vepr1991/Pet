export function renderCalendar(container, currDate, onDateSelect) {
    container.innerHTML = "";

    const month = currDate.getMonth();
    const year = currDate.getFullYear();

    const firstDay = (new Date(year, month, 1).getDay() || 7) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Пустые ячейки до начала месяца
    for(let i=0; i<firstDay; i++) container.appendChild(document.createElement('div'));

    for(let d=1; d<=daysInMonth; d++){
        const div = document.createElement('div');
        div.className = 'day';
        div.innerText = d;
        const dateStr = `${String(d).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`;

        // Блокируем прошедшие дни
        if(new Date(year,month,d) < new Date().setHours(0,0,0,0)) div.classList.add('disabled');

        div.onclick = () => {
            if(div.classList.contains('disabled')) return;
            document.querySelectorAll('.day').forEach(el=>el.classList.remove('active'));
            div.classList.add('active');
            onDateSelect(dateStr);
        };
        container.appendChild(div);
    }
}

export function renderTimeSlots(container, dateStr, busyTimes, onTimeSelect) {
    container.innerHTML = "";
    const now = new Date();
    const isToday = (dateStr === `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`);
    const currentHour = now.getHours();

    for(let h=9; h<=20; h++){
        const t = `${h}:00`;
        const div = document.createElement('div');
        div.className = 'time-slot';
        div.innerText = t;

        if (busyTimes.includes(t)) {
            div.classList.add('busy');
            div.innerText += " ❌";
        }
        else if (isToday && h <= currentHour) {
            div.classList.add('past');
        }
        else {
            div.onclick = () => {
                document.querySelectorAll('.time-slot').forEach(el=>el.classList.remove('active'));
                div.classList.add('active');
                onTimeSelect(t);
            };
        }
        container.appendChild(div);
    }
}