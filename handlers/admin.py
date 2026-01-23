from aiogram import Router, F, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from config import ADMIN_ID
import database as db

router = Router()


@router.message(F.text == "📊 Посмотреть записи (Админ)")
async def admin_panel(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        await message.answer("Доступ только для администратора.")
        return

    rows = db.get_last_appointments(10)
    if rows:
        await message.answer("<b>📋 Список актуальных записей:</b>", parse_mode="HTML")
        for index, r in enumerate(rows, start=1):
            db_id, breed, name, serv, dt, phone, u_id = r
            text = (f"📍 <b>Запись №{index}</b>\n🐶 <b>{breed} {name}</b>\n✂️ {serv}\n📅 {dt}\n📞 {phone}")

            kb_inline = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="💬 Написать", url=f"tg://user?id={u_id}"),
                InlineKeyboardButton(text="❌ Удалить", callback_data=f"delete_{db_id}")
            ]])
            await message.answer(text, parse_mode="HTML", reply_markup=kb_inline)
    else:
        await message.answer("Записей пока нет.")


@router.callback_query(F.data.startswith("delete_"))
async def delete_callback(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID: return
    appointment_id = int(callback.data.split("_")[1])
    db.delete_appointment(appointment_id)
    await callback.message.edit_text(f"✅ Запись №{appointment_id} удалена.")
    await callback.answer("Удалено")