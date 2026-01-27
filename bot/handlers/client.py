import json
from aiogram import Router, types, F
from aiogram.filters import Command, CommandObject
from bot.database import requests as db
from bot.keyboards import keyboards as kb
from config import ADMIN_ID

router = Router()


@router.message(Command("start"))
async def cmd_start(message: types.Message, command: CommandObject):
    u_id = message.from_user.id
    args = command.args

    master_info = None
    if args and args.isdigit():
        master_info = db.get_master_info(args)

    if master_info:
        await message.answer(
            f"🐾 Добро пожаловать в <b>{master_info['studio_name']}</b>!\n\n"
            "Нажмите на кнопку ниже, чтобы выбрать питомца и время записи.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID, for_master=master_info)
        )
    else:
        await message.answer(
            "🐾 <b>PETGroom</b> — умная система записи.\n\n"
            "Чтобы создать свою ссылку для записи клиентов, нажмите «Стать партнером».",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID)
        )


@router.message(F.web_app_data)
async def handle_booking_data(message: types.Message):
    """Принимаем данные записи и уведомляем мастера"""
    try:
        data = json.loads(message.web_app_data.data)

        # Получаем данные из JSON
        m_id = data.get('master_id')
        dt = f"{data.get('date')} {data.get('time')}"
        client_tg_name = message.from_user.full_name
        client_username = message.from_user.username

        # 1. Сохранение в базу
        # Передаем чистые данные, чтобы в БД было красиво
        db.add_appointment(
            user_id=message.from_user.id,
            breed=data.get('breed', 'Не указана'),
            pet_name=data.get('pet_name', 'Без клички'),
            service=data.get('service', 'Груминг'),
            date_time=dt,
            phone=data.get('phone'),
            master_id=int(m_id),
            client_name=client_tg_name,
            username=client_username
        )

        # 2. Уведомление мастеру (ДЕТАЛЬНОЕ)
        user_link = f"@{client_username}" if client_username else "скрыт"

        notification = (
            f"🚀 <b>Новая запись!</b>\n\n"
            f"👤 <b>Клиент:</b> {client_tg_name} ({user_link})\n"
            f"🐾 <b>Вид:</b> {data.get('pet_type')}\n"  # Отдельная строка
            f"🐶 <b>Порода:</b> {data.get('breed')}\n"  # Отдельная строка
            f"📛 <b>Кличка:</b> {data.get('pet_name')}\n"
            f"📅 <b>Время:</b> {dt}\n"
            f"✂️ <b>Услуга:</b> {data.get('service')}\n"
            f"📞 <b>Телефон:</b> <code>{data.get('phone')}</code>"
        )

        # Отправляем мастеру
        await message.bot.send_message(int(m_id), notification, parse_mode="HTML")

        # 3. Подтверждение клиенту
        master_info = db.get_master_info(m_id)
        studio = master_info['studio_name'] if master_info else 'Студию'

        await message.answer(
            f"✅ <b>Запись в «{studio}» подтверждена!</b>\n\n"
            f"Ждем вас {dt}.\nЕсли планы изменятся, пожалуйста, сообщите мастеру.",
            parse_mode="HTML"
        )

    except Exception as e:
        print(f"Error in handle_booking_data: {e}")
        await message.answer("❌ Произошла ошибка при сохранении записи. Попробуйте еще раз.")