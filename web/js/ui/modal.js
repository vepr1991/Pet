let currentModalId = 'custom-modal';
let onConfirmCallback = null;

export function initModal() {
    // Находим кнопки один раз при старте
    document.querySelector('.m-no').onclick = closeModal;
    document.querySelector('.m-yes').onclick = async () => {
        if (onConfirmCallback) {
            const btn = document.querySelector('.m-yes');
            const originalText = btn.innerText;
            btn.innerText = "⏳...";
            btn.disabled = true;

            await onConfirmCallback();

            btn.innerText = originalText;
            btn.disabled = false;
        }
        closeModal();
    };
}

export function showConfirmModal(text, onConfirm) {
    document.getElementById('modal-text').innerText = text;
    onConfirmCallback = onConfirm;
    document.getElementById(currentModalId).style.display = 'flex';
}

export function closeModal() {
    document.getElementById(currentModalId).style.display = 'none';
    onConfirmCallback = null;
}