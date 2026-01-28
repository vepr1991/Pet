// web/js/shared/utils.js

/**
 * Получает ID мастера из URL или данных Telegram
 */
export function getMasterId() {
    const params = new URLSearchParams(window.location.search);
    // Пробуем master_id (новый стандарт) -> master (старый) -> initData (параметр старта) -> ID текущего юзера
    const id = params.get('master_id') || 
               params.get('master') || 
               params.get('tgWebAppStartParam') || 
               window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    
    return id ? String(id) : null;
}

/**
 * Парсинг даты из строки "DD.MM.YYYY HH:MM" или ISO в JS Date
 */
export function parseDateTime(dateStr) {
    if (!dateStr) return new Date(0);
    try {
        // Если дата в формате ISO (2026-01-28T10:00:00Z)
        if (dateStr.includes('T')) return new Date(dateStr);

        // Если дата в нашем формате (DD.MM.YYYY HH:MM)
        const [dPart, tPart] = dateStr.split(' ');
        const [day, month, year] = dPart.split('.');
        const [hour, min] = tPart.split(':');
        
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min));
    } catch (e) {
        console.error("❌ Ошибка парсинга даты:", dateStr, e);
        return new Date(0);
    }
}

/**
 * Маска для телефона +7 (XXX) XXX-XX-XX
 */
export function applyPhoneMask(input) {
    if (!input) return;
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('7')) value = value.substring(1);
        if (value.length > 10) value = value.substring(0, 10);
        
        let res = '+7 ';
        if (value.length > 0) res += '(' + value.substring(0, 3);
        if (value.length > 3) res += ') ' + value.substring(3, 6);
        if (value.length > 6) res += '-' + value.substring(6, 8);
        if (value.length > 8) res += '-' + value.substring(8, 10);
        
        e.target.value = value.length > 0 ? res : '';
    });
}