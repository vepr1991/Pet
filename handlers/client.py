import json
from aiogram import Router, types, F
from aiogram.filters import Command, CommandObject
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


@router.message(Command("start"))
async def cmd_start(message: types.Message, command: CommandObject):
    """
    Обработка входа. Если есть ID в ссылке, настраиваем меню под конкретного мастера.
    """
    u_id = message.from_user.id
    args = command.args  # ID мастера из ссылки t.me/bot?start=ID

    master_info = None
    if args and args.isdigit():
        master_info = db.get_master_info(args)

    if master_info:
        # Клиент пришел по ссылке: выдаем кнопку записи в конкретную студию
        await message.answer(
            f"🐾 Добро пожаловать в <b>{master_info['studio_name']}</b>!\n\n"
            "Нажмите на кнопку ниже, чтобы выбрать питомца и удобное время для записи.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID, for_master=master_info)
        )
    else:
        # Обычный вход: выдаем стандартное меню (регистрация для мастеров)
        await message.answer(
            "🐾 <b>PETGroom</b> — умная система записи для груминг-салонов.\n\n"
            "Чтобы создать свою персональную ссылку для записи клиентов, нажмите «Стать партнером».",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID)
        )


@router.message(F.web_app_data)
async def handle_booking_data(message: types.Message):
    """
    Принимаем финальные данные записи из Mini App и оповещаем мастера.
    """
    try:
        # Распаковываем JSON, пришедший из client.html
        data = json.loads(message.web_app_data.data)
        client_tg_name = message.from_user.full_name  # Имя клиента из профиля TG

        m_id = data.get('master_id')
        if not m_id:
            raise ValueError("ID мастера отсутствует в данных WebApp")

        # Формируем красивое название породы с учетом типа животного
        pet_type = data.get('pet_type', 'Питомец')
        breed_input = data.get('breed', 'Не указано')
        display_breed = f"{pet_type} ({breed_input})"

        dt = f"{data.get('date')} {data.get('time')}"

        # 1. Записываем запись в таблицу appointments
        db.add_appointment(
            user_id=message.from_user.id,
            breed=display_breed,
            pet_name=data.get('pet_name', 'Без клички'),
            service=data.get('service', 'Груминг'),
            date_time=dt,
            phone=data.get('phone'),
            master_id=m_id,
            client_name=client_tg_name  # Имя сохраняется для панели мастера
        )

        # 2. Формируем и отправляем уведомление мастеру
        notification = (
            f"🚀 <b>Новая запись!</b>\n\n"
            f"👤 <b>Клиент:</b> {client_tg_name}\n"
            f"🐶 <b>Питомец:</b> {display_breed}\n"
            f"📛 <b>Кличка:</b> {data.get('pet_name')}\n"
            f"✂️ <b>Услуга:</b> {data.get('service', 'Груминг')}\n"
            f"📅 <b>Время:</b> {dt}\n"
            f"📞 <b>Телефон:</b> <code>{data.get('phone')}</code>"
        )

        # Отправляем сообщение напрямую мастеру по его Telegram ID
        await message.bot.send_message(int(m_id), notification, parse_mode="HTML")

        # 3. Отправляем подтверждение клиенту
        # Получаем инфо о мастере снова, чтобы вернуть кнопку записи в ту же студию
        master_info = db.get_master_info(m_id)
        await message.answer(
            f"✅ <b>Запись в «{master_info['studio_name']}» успешно создана!</b>\n\n"
            f"Мастер свяжется с вами по номеру {data.get('phone')} для подтверждения.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID, for_master=master_info)
        )

    except Exception as e:
        print(f"❌ Ошибка обработки записи: {e}")
        await message.answer(
            "⚠ Произошла ошибка при сохранении записи.\n"
            "Пожалуйста, попробуйте еще раз или свяжитесь с поддержкой."
        )