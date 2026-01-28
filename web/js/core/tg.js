// web/js/core/tg.js
// Telegram WebApp helpers. Работает и внутри Telegram, и (частично) в обычном браузере.

export const tg = window.Telegram?.WebApp || null;

export function initTg() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
  } catch (e) {
    console.warn("Telegram WebApp init error:", e);
  }
}

export function showAlert(msg) {
  if (tg?.showAlert) {
    tg.showAlert(String(msg));
  } else {
    alert(String(msg));
  }
}

/**
 * Унифицированное подтверждение действия.
 * Возвращает Promise<boolean>.
 */
export function confirmAction(message, title = "Подтверждение") {
  const text = String(message ?? "");
  return new Promise((resolve) => {
    if (tg?.showPopup) {
      try {
        const maybePromise = tg.showPopup(
          {
            title,
            message: text,
            buttons: [
              { id: "yes", type: "default", text: "Да" },
              { id: "no", type: "destructive", text: "Нет" },
            ],
          },
          (btnId) => resolve(btnId === "yes")
        );

        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then((btnId) => resolve(btnId === "yes")).catch(() => resolve(false));
        }
        return;
      } catch (e) {
        console.warn("Telegram showPopup error:", e);
      }
    }

    resolve(confirm(text));
  });
}
