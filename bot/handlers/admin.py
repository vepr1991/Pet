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

    # ЛОГИКА ФИЛЬТРАЦИИ: Админ видит всё, мастер — только своё
    if is_admin:
        await message.answer("🌐 <b>Режим Глобального Админа</b>\nОтображаются последние 10 записей всей системы:",
                             parse_mode="HTML")
        rows = db.get_last_appointments(10)  # Глобальный поиск
    else:
        await message.answer(f"🏠 <b>Записи вашей студии</b>\nОтображаются последние 10 записей:", parse_mode="HTML")
        rows = db.get_appointments_by_master(u_id, 10)  # Поиск по master_id

    if rows:
        for index, r in enumerate(rows, start=1):
            # Распаковка данных (db_id, breed, name, serv, dt, phone, client_id, m_id)
            # Убедись, что твоя функция в БД возвращает именно такой набор колонок
            db_id, breed, name, serv, dt, phone, client_id = r[:7]

            text = (f"📍 <b>Запись №{db_id}</b>\n"
                    f"🐶 <b>{breed} {name}</b>\n"
                    f"✂️ {serv}\n"
                    f"📅 {dt}\n"
                    f"📞 {phone}")

            # Кнопки управления
            kb_inline = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="💬 Написать клиенту", url=f"tg://user?id={client_id}"),
                InlineKeyboardButton(text="❌ Удалить", callback_data=f"delete_{db_id}")
            ]])

            await message.answer(text, parse_mode="HTML", reply_markup=kb_inline)
    else:
        await message.answer("📭 Записей пока нет.")


# Безопасное удаление
@router.callback_query(F.data.startswith("delete_"))
async def delete_callback(callback: CallbackQuery):
    u_id = callback.from_user.id
    appointment_id = int(callback.data.split("_")[1])

    # Проверяем, имеет ли право этот человек удалять запись
    # (Админ может всё, мастер — только если запись принадлежит ему)
    if u_id == ADMIN_ID or db.is_owner_of_appointment(u_id, appointment_id):
        db.delete_appointment(appointment_id)
        await callback.message.edit_text(f"✅ Запись №{appointment_id} удалена из базы.")
        await callback.answer("Удалено")
    else:
        await callback.answer("⛔ Ошибка доступа: это не ваша запись!", show_alert=True)