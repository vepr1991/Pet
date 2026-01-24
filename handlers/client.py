import json
from aiogram import Router, types, F
from aiogram.filters import Command, CommandObject
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


# --- 1. ОБРАБОТКА ВХОДА ПО ССЫЛКЕ ---
@router.message(Command("start"))
async def cmd_start(message: types.Message, command: CommandObject):
    u_id = message.from_user.id
    args = command.args  # ID мастера из ссылки t.me/bot?start=ID

    master_info = None
    if args and args.isdigit():
        master_info = db.get_master_info(args)

    if master_info:
        # Клиент зашел по ссылке: показываем кнопку ЗАПИСИ
        await message.answer(
            f"🐾 Добро пожаловать в <b>{master_info['studio_name']}</b>!\n\n"
            "Нажмите на кнопку ниже, чтобы выбрать питомца, услугу и время.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID, for_master=master_info)
        )
    else:
        # Обычный вход: показываем кнопку РЕГИСТРАЦИИ
        await message.answer(
            "🐾 <b>PETGroom</b> — система автоматизации записи.\n\n"
            "Если вы хотите создать свою ссылку для записи клиентов, нажмите «Стать партнером».",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID)
        )


# --- 2. ПРИЕМ ДАННЫХ ИЗ MINI APP И УВЕДОМЛЕНИЕ МАСТЕРА ---
@router.message(F.web_app_data)
async def handle_booking_data(message: types.Message):
    """
    Этот обработчик срабатывает, когда клиент нажимает 'Подтвердить запись' в Mini App
    """
    try:
        # Распаковываем JSON из Mini App
        data = json.loads(message.web_app_data.data)

        m_id = data.get('master_id')
        pet_type = data.get('pet_type')
        pet_name = data.get('pet_name')
        service = data.get('service')
        dt = f"{data.get('date')} {data.get('time')}"
        phone = data.get('phone')

        # 1. Записываем в базу данных
        db.add_appointment(
            user_id=message.from_user.id,
            breed=pet_type,
            pet_name=pet_name,
            service=service,
            date_time=dt,
            phone=phone,
            master_id=m_id
        )

        # 2. Формируем текст для мастера
        notification_to_master = (
            f"🚀 <b>Новая запись в студию!</b>\n"
            f"--------------------------\n"
            f"🐶 <b>Питомец:</b> {pet_type} ({pet_name})\n"
            f"✂️ <b>Услуга:</b> {service}\n"
            f"📅 <b>Когда:</b> {dt}\n"
            f"📞 <b>Телефон:</b> <code>{phone}</code>\n"
            f"👤 <b>Клиент:</b> {message.from_user.full_name}"
        )

        # 3. Отправляем уведомление мастеру
        await message.bot.send_message(int(m_id), notification_to_master, parse_mode="HTML")

        # 4. Отвечаем клиенту и сохраняем его кнопки записи (чтобы не появилось 'Стать партнером')
        master_info = db.get_master_info(m_id)
        await message.answer(
            f"✅ <b>Запись успешно создана!</b>\n\n"
            f"Мастер из студии «{master_info['studio_name']}» свяжется с вами по номеру {phone} для подтверждения.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID, for_master=master_info)
        )

    except Exception as e:
        print(f"❌ Ошибка обработки записи: {e}")
        await message.answer("Произошла ошибка при сохранении записи. Попробуйте еще раз.")