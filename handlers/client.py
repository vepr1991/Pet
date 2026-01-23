import json
from aiogram import Router, F, types
from aiogram.filters import Command
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "Добро пожаловать в PETGroom! 🐾",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )


@router.message(F.web_app_data.data.contains("client_appointment"))
async def process_booking(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        m_id = data.get("master_id")

        db.add_appointment(
            user_id=message.from_user.id,
            breed=f"{data.get('pet_type')}: {data.get('breed')}",
            pet_name=data.get('pet_name'),
            service=data.get('service'),
            date_time=data.get('date_time'),
            phone=data.get('phone'),
            master_id=m_id  # Привязка к мастеру
        )

        await message.answer("✅ <b>Вы успешно записаны!</b>", parse_mode="HTML")

        if m_id:
            await message.bot.send_message(m_id, f"🔔 Новая запись!\n📞 {data.get('phone')}")
    except Exception as e:
        print(f"Ошибка WebApp: {e}")


@router.message(F.text & ~F.text.startswith(("📊", "⚙️", "🔗", "📋")))
async def handle_text(message: types.Message):
    await message.answer("Пожалуйста, используйте кнопки меню ⬇️")