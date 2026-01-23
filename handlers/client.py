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

# Обработка данных из Mini App (Умный роутер данных)
@router.message(F.web_app_data)
async def process_web_app_data(message: types.Message, state: FSMContext):
    try:
        data = json.loads(message.web_app_data.data)
        action = data.get("action")

        # КЕЙС 1: Мастер нажал кнопку "Регистрация" в Mini App
        if action == "start_master_registration":
            await message.answer("Отлично! Вы решили стать партнером. ✂️\n"
                                 "Напишите название вашей студии грумминга:")
            await state.set_state(MasterReg.waiting_for_name)
            return

        # КЕЙС 2: Запись клиента через Mini App (привязка к мастеру)
        if action == "client_appointment":
            m_id = data.get("master_id") # Получаем ID мастера, к которому идет запись
            pet_type = data.get('pet_type', 'Питомец')
            breed_input = data.get('breed', 'Не указана')
            pet_name = data.get('pet_name', 'Не указано')
            service = data.get('service', 'Не выбрана')
            phone = data.get('phone', 'Не указан')
            date_time = data.get('date_time', 'Не указано')

            full_pet_info = f"{pet_type}: {breed_input}"

            # Сохраняем в базу с указанием master_id
            db.add_appointment(
                user_id=message.from_user.id,
                breed=full_pet_info,
                pet_name=pet_name,
                service=service,
                date_time=date_time,
                phone=phone,
                master_id=m_id # Теперь запись знает своего мастера
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

            # УВЕДОМЛЕНИЕ МАСТЕРУ (тому, к кому записались)
            if m_id:
                try:
                    await message.bot.send_message(
                        m_id,
                        f"🔔 <b>НОВАЯ ЗАПИСЬ В ВАШУ СТУДИЮ!</b>\n\n"
                        f"👤 <b>Клиент:</b> {message.from_user.full_name}\n"
                        f"🐾 <b>Питомец:</b> {full_pet_info} ({pet_name})\n"
                        f"📱 <b>Телефон:</b> {phone}\n"
                        f"📅 <b>Время:</b> {date_time}",
                        parse_mode="HTML"
                    )
                except Exception as e:
                    print(f"Не удалось уведомить мастера {m_id}: {e}")

            # УВЕДОМЛЕНИЕ ВАМ (Главному Админу для контроля)
            if ADMIN_ID and str(m_id) != str(ADMIN_ID):
                await message.bot.send_message(
                    ADMIN_ID,
                    f"👁 <b>Контроль записей:</b>\n"
                    f"Новая запись к мастеру ID: <code>{m_id}</code>\n"
                    f"Клиент: {message.from_user.full_name}",
                    parse_mode="HTML"
                )

    except Exception as e:
        print(f"Ошибка обработки Web App: {e}")
        await message.answer("Произошла ошибка при обработке данных. Попробуйте еще раз.")

# Финальный шаг регистрации мастера
@router.message(MasterReg.waiting_for_name)
async def finish_master_registration(message: types.Message, state: FSMContext):
    studio_name = message.text

    # Безопасно сохраняем в Supabase через service_role ключ в database.py
    db.register_new_master(message.from_user.id, studio_name)

    await message.answer(
        f"🎉 <b>Поздравляем!</b>\n\n"
        f"Студия <b>«{studio_name}»</b> успешно зарегистрирована.\n"
        f"Теперь вы можете настроить свой профиль и делиться ссылкой с клиентами.",
        parse_mode="HTML",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )

    if ADMIN_ID:
        await message.bot.send_message(
            ADMIN_ID,
            f"🚀 <b>НОВЫЙ ПАРТНЕР!</b>\n\n"
            f"👤 Мастер: {message.from_user.full_name}\n"
            f"🏠 Студия: {studio_name}\n"
            f"🆔 ID: {message.from_user.id}",
            parse_mode="HTML"
        )

    await state.clear()

# Универсальный хендлер текста (фильтруем кнопки админа)
@router.message(F.text & ~F.text.startswith("📊") & ~F.text.startswith("⚙️"))
async def handle_text(message: types.Message):
    await message.answer(
        "Пожалуйста, используйте кнопку в меню для записи или входа ⬇️",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )