import json
from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


# Состояния для регистрации мастера
class MasterReg(StatesGroup):
    waiting_for_name = State()


# Обработка команды /start
@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        f"Добро пожаловать в систему PETGroom Алматы! 🐾\n"
        f"Используйте кнопку ниже для доступа к приложению.",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )


# Обработка данных из Mini App
@router.message(F.web_app_data)
async def process_web_app_data(message: types.Message, state: FSMContext):
    try:
        data = json.loads(message.web_app_data.data)

        # КЕЙС 1: Мастер нажал кнопку "Регистрация" в index.html
        if data.get("action") == "start_master_registration":
            await message.answer("Отлично! Вы решили стать партнером. ✂️\n"
                                 "Напишите название вашей студии грумминга:")
            await state.set_state(MasterReg.waiting_for_name)
            return

        # КЕЙС 2: Обычная запись клиента (старая логика)
        pet_type = data.get('pet_type', 'Питомец')
        breed_input = data.get('breed', 'Не указана')
        pet_name = data.get('pet_name', 'Не указано')
        service = data.get('service', 'Не выбрана')
        phone = data.get('phone', 'Не указан')
        date_time = data.get('date_time', 'Не указано')

        full_pet_info = f"{pet_type}: {breed_input}"

        db.add_appointment(
            user_id=message.from_user.id,
            breed=full_pet_info,
            pet_name=pet_name,
            service=service,
            date_time=date_time,
            phone=phone
        )

        await message.answer(
            f"✅ <b>Запись успешно создана!</b>\n\n"
            f"🐾 <b>Питомец:</b> {full_pet_info} ({pet_name})\n"
            f"✂️ <b>Услуга:</b> {service}\n"
            f"📅 <b>Время:</b> {date_time}\n"
            f"📞 <b>Телефон:</b> {phone}\n\n"
            f"Мастер свяжется с вами для подтверждения!",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
        )

        if ADMIN_ID:
            await message.bot.send_message(
                ADMIN_ID,
                f"🔔 <b>НОВАЯ ЗАПИСЬ!</b>\n"
                f"👤 Клиент: {message.from_user.full_name}\n"
                f"🐾 Питомец: {full_pet_info} ({pet_name})\n"
                f"✂️ Услуга: {service}\n"
                f"📅 Время: {date_time}\n"
                f"📱 Телефон: {phone}",
                parse_mode="HTML"
            )

    except Exception as e:
        print(f"Ошибка обработки Web App: {e}")
        await message.answer("Произошла ошибка. Попробуйте еще раз.")


# Финальный шаг регистрации мастера
@router.message(MasterReg.waiting_for_name)
async def finish_master_registration(message: types.Message, state: FSMContext):
    studio_name = message.text

    # Безопасно сохраняем в Supabase
    db.register_new_master(message.from_user.id, studio_name)

    await message.answer(
        f"🎉 <b>Поздравляем!</b>\n\n"
        f"Студия <b>«{studio_name}»</b> зарегистрирована в системе.\n"
        f"Теперь при нажатии на кнопку в меню вам откроется Панель Мастера.",
        parse_mode="HTML",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )

    # Уведомляем вас (главного админа) о новом партнере
    if ADMIN_ID:
        await message.bot.send_message(
            ADMIN_ID,
            f"🚀 <b>НОВЫЙ ПАРТНЕР В АЛМАТЫ!</b>\n\n"
            f"👤 Мастер: {message.from_user.full_name}\n"
            f"🏠 Студия: {studio_name}\n"
            f"🆔 ID: {message.from_user.id}",
            parse_mode="HTML"
        )

    await state.clear()


# Подсказка
@router.message(F.text)
async def handle_text(message: types.Message):
    await message.answer(
        "Пожалуйста, используйте кнопку в меню для записи или входа ⬇️",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )