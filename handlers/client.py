import json
from aiogram import Router, types, F
from aiogram.filters import Command, CommandObject
import database as db
import keyboards as kb
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
        client_tg_name = message.from_user.full_name

        # --- ИСПРАВЛЕНИЕ: Берем username ---
        # Сначала пробуем взять из профиля отправителя (это надежнее всего)
        # Если там пусто, берем то, что прислал JS
        client_username = message.from_user.username or data.get('username') or ""

        m_id = data.get('master_id')
        dt = f"{data.get('date')} {data.get('time')}"

        breed_info = f"{data.get('pet_type', 'Питомец')} ({data.get('breed', 'Не указано')})"

        # 1. Записываем в базу (Теперь передаем username!)
        db.add_appointment(
            user_id=message.from_user.id,
            breed=breed_info,
            pet_name=data.get('pet_name', 'Без клички'),
            service=data.get('service', 'Груминг'),
            date_time=dt,
            phone=data.get('phone'),
            master_id=int(m_id),
            client_name=client_tg_name,
            username=client_username  # <--- ВОТ ЗДЕСЬ БЫЛО ПУСТО
        )

        # 2. Уведомление мастеру
        user_link = f"@{client_username}" if client_username else "скрыт"

        notification = (
            f"🚀 <b>Новая запись!</b>\n\n"
            f"👤 <b>Клиент:</b> {client_tg_name} ({user_link})\n"
            f"🐶 <b>Питомец:</b> {breed_info}\n"
            f"📅 <b>Время:</b> {dt}\n"
            f"📞 <b>Телефон:</b> <code>{data.get('phone')}</code>"
        )
        await message.bot.send_message(int(m_id), notification, parse_mode="HTML")

        # 3. Подтверждение клиенту
        master_info = db.get_master_info(m_id)
        await message.answer(
            f"✅ <b>Запись в «{master_info['studio_name']}» успешно создана!</b>\n\n"
            f"Мастер свяжется с вами в ближайшее время.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID, for_master=master_info)
        )

    except Exception as e:
        print(f"Ошибка записи: {e}")
        await message.answer("❌ Ошибка при создании записи. Попробуйте еще раз.")