from aiogram import Router, F, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from config import ADMIN_ID
from bot.database import requests as db

router = Router()


# Универсальный обработчик для просмотра записей
@router.message(F.text.contains("Посмотреть записи"))
async def view_appointments(message: types.Message):
    u_id = message.from_user.id
    is_admin = (u_id == ADMIN_ID)
    is_master = db.is_master(u_id)

    if not is_admin and not is_master:
        await message.answer("❌ У вас нет доступа к этому разделу.")
        return

    # Загружаем данные
    if is_admin:
        await message.answer("🌐 <b>Все последние записи (Админ):</b>", parse_mode="HTML")
        rows = db.get_last_appointments(10)
    else:
        await message.answer(f"🏠 <b>Ваши последние записи:</b>", parse_mode="HTML")
        rows = db.get_appointments_by_master(u_id, 10)

    if rows:
        for r in rows:
            # ВАЖНО: Распаковываем 10 элементов, включая STATUS
            # Если падает ошибка, проверь requests.py (функция get_appointments_by_master должна возвращать status)
            db_id, breed, name, serv, dt, phone, client_id, client_name, username, status = r

            # Проверяем статус
            is_cancelled = (status == 'cancelled')

            # Если отменена - меняем иконку и зачеркиваем
            status_icon = "❌ ОТМЕНЕНО" if is_cancelled else "✅ Активна"
            pet_display = f"<s>{breed} {name}</s>" if is_cancelled else f"<b>{breed} {name}</b>"

            text = (f"📍 <b>Запись №{db_id}</b> [{status_icon}]\n"
                    f"🐶 {pet_display}\n"
                    f"✂️ {serv}\n"
                    f"📅 {dt}\n"
                    f"📞 {phone}")

            # Кнопки
            buttons = []
            if client_id:
                buttons.append(InlineKeyboardButton(text="💬 Клиент", url=f"tg://user?id={client_id}"))

            # Кнопку "Отменить" показываем ТОЛЬКО если запись еще активна
            if not is_cancelled:
                buttons.append(InlineKeyboardButton(text="🗑 Отменить", callback_data=f"delete_{db_id}"))

            kb_inline = InlineKeyboardMarkup(inline_keyboard=[buttons])

            await message.answer(text, parse_mode="HTML", reply_markup=kb_inline)
    else:
        await message.answer("📭 Записей пока нет.")


# Обработка кнопки "Отменить"
@router.callback_query(F.data.startswith("delete_"))
async def delete_callback(callback: CallbackQuery):
    u_id = callback.from_user.id
    appointment_id = int(callback.data.split("_")[1])

    if u_id == ADMIN_ID or db.is_owner_of_appointment(u_id, appointment_id):
        # Вызываем функцию отмены (Soft Delete)
        success = db.delete_appointment(appointment_id)

        if success:
            await callback.message.edit_text(
                f"❌ <b>Запись №{appointment_id} отменена и перенесена в архив.</b>",
                parse_mode="HTML"
            )
            await callback.answer("Готово")
        else:
            await callback.answer("Ошибка базы данных", show_alert=True)
    else:
        await callback.answer("⛔ Это не ваша запись!", show_alert=True)