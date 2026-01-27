// Получение ID мастера из URL
export function getMasterId() {
    const params = new URLSearchParams(window.location.search);
    // Пробуем взять из get-параметра или из данных юзера (если это сам мастер зашел)
    return Number(params.get('master')) || Number(window.Telegram.WebApp.initDataUnsafe.user?.id);
}

// Маска телефона (автоматически форматирует ввод)
export function applyPhoneMask(inputElement) {
    inputElement.addEventListener('input', function(e) {
        let x = e.target.value.replace(/\D/g,'').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
        e.target.value = !x[2] ? x[1] : '+7 ('+x[2]+(x[3]?') '+x[3]:'')+(x[4]?'-'+x[4]:'')+(x[5]?'-'+x[5]:'');
    });
}

// Копирование в буфер
export function copyToClipboard(text, onSuccess) {
    navigator.clipboard.writeText(text).then(() => {
        if (onSuccess) onSuccess();
    });
}

// Парсинг даты из строки "DD.MM.YYYY HH:MM" в JS Date
export function parseDateTime(dateStr) {
    try {
        const [dPart, tPart] = dateStr.split(' ');
        const [day, month, year] = dPart.split('.');
        const [hour, min] = tPart.split(':');
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min));
    } catch (e) {
        return new Date(0); // Возвращаем старую дату при ошибке
    }
}