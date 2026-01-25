from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from bot.keyboards import keyboards as kb
from config import ADMIN_ID

router = Router()


# Состояния для регистрации мастера (FSM)
class MasterReg(StatesGroup):
    waiting_for_name = State()


# --- ШАГ 2: Регистрация мастера (если его нет в базе) ---

# Обработка нажатия кнопки "Стать партнером"
@router.message(F.text == "🤝 Стать партнером (Регистрация мастера)")
async def start_registration_button(message: types.Message, state: FSMContext):
    await message.answer(
        "✂️ <b>Регистрация новой студии в PETGroom</b>\n\n"
        "Введите название вашего салона (это название увидят клиенты):",
        parse_mode="HTML"
    )
    await state.set_state(MasterReg.waiting_for_name)


# Резервный вход через команду /master
@router.message(Command("master"))
async def cmd_become_master(message: types.Message, state: FSMContext):
    if db.is_master(message.from_user.id):
        await message.answer("✅ Вы уже зарегистрированы как мастер.")
    else:
        await message.answer("✂️ Введите название вашей студии для регистрации:")
        await state.set_state(MasterReg.waiting_for_name)


# --- ШАГ 3: Сохранение и выдача инструментов ---

@router.message(MasterReg.waiting_for_name)
async def finish_master_registration(message: types.Message, state: FSMContext):
    studio_name = message.text
    m_id = message.from_user.id

    # 1. Сохраняем мастера в базу данных Supabase
    db.register_new_master(m_id, studio_name)

    # 2. Генерируем правильную ссылку (Deep Link)
    bot_info = await message.bot.get_me()

    # ИСПРАВЛЕНИЕ ЗДЕСЬ: Ссылка теперь ведет на старт бота, а не сразу в приложение
    personal_link = f"<code>https://t.me/{bot_info.username}?start={m_id}</code>"

    # 3. Отправляем успех и ОБНОВЛЯЕМ меню на "Мастерское"
    await message.answer(
        f"🎉 <b>Студия «{studio_name}» успешно создана!</b>\n\n"
        f"📍 <b>Ваша ссылка для записи клиентов:</b>\n{personal_link}\n\n"
        f"Теперь вы можете добавить свои услуги в Панели мастера.\n"
        f"<i>Отправьте эту ссылку клиентам или добавьте в Instagram.</i>",
        parse_mode="HTML",
        reply_markup=kb.get_main_kb(m_id, ADMIN_ID)  # Переключаем клавиатуру на мастерскую
    )

    # Уведомление для тебя (Админа)
    if ADMIN_ID:
        await message.bot.send_message(
            ADMIN_ID,
            f"🚀 <b>Новый мастер!</b>\nСтудия: {studio_name}\nID: <code>{m_id}</code>",
            parse_mode="HTML"
        )

    await state.clear()


# --- ФУНКЦИОНАЛ ДЛЯ ЗАРЕГИСТРИРОВАННЫХ МАСТЕРОВ ---

@router.message(F.text == "🔗 Моя ссылка")
async def send_personal_link(message: types.Message):
    m_id = message.from_user.id
    if db.is_master(m_id) or m_id == ADMIN_ID:
        bot_info = await message.bot.get_me()
        # Ссылка, которая активирует бота и показывает меню записи
        link = f"<code>https://t.me/{bot_info.username}?start={m_id}</code>"

        await message.answer(
            f"📋 <b>Ваша ссылка для клиентов:</b>\n\n{link}\n\n"
            f"<i>Отправьте её клиенту. Перейдя по ней, он нажмет «Старт» и увидит кнопку записи в вашу студию.</i>",
            parse_mode="HTML"
        )
    else:
        await message.answer("❌ Сначала зарегистрируйте студию через кнопку «Стать партнером».")


# Обработка нажатия на "Посмотреть записи" (Админский функционал)
@router.message(F.text == "📊 Посмотреть записи (Все)")
async def view_all_records(message: types.Message):
    if message.from_user.id == ADMIN_ID:
        await message.answer("🔍 Функция выгрузки всех записей доступна в админ-панели (Web App).")
    else:
        await message.answer("⛔ У вас нет прав для просмотра общей статистики.")