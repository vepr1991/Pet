// web/js/ui/modal.js

export function initModal() {
    const modal = document.getElementById('custom-modal');
    if (!modal) return;

    // Закрытие при клике мимо окна
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };

    // Кнопка "Нет"
    const btnNo = modal.querySelector('.m-no');
    if (btnNo) btnNo.onclick = () => modal.style.display = 'none';
}

export function showConfirmModal(text, onConfirm) {
    const modal = document.getElementById('custom-modal');
    const txt = document.getElementById('modal-text');
    const btnYes = modal.querySelector('.m-yes');

    if (!modal || !txt || !btnYes) {
        // Если модалка не найдена в HTML, просто используем стандартный confirm
        if(confirm(text)) onConfirm();
        return;
    }

    txt.innerText = text;
    modal.style.display = 'flex';

    // Сбрасываем старые события, чтобы не было двойных кликов
    const newBtn = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtn, btnYes);

    newBtn.onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
}