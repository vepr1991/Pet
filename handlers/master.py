import json
from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


# Состояния для регистрации мастера (FSM)
class MasterReg(StatesGroup):
    waiting_for_name = State()


# 1. Регистрация через команду /master
@router.message(Command("master"))
async def cmd_become_master(message: types.Message, state: FSMContext):
    if db.is_master(message.from_user.id):
        await message.answer("✅ <b>Вы уже зарегистрированы как мастер!</b>\n"
                             "Используйте кнопку «🔗 Моя ссылка», чтобы получить адрес для Instagram.",
                             parse_mode="HTML")
    else:
        await message.answer("✂️ <b>Регистрация партнера PETGroom</b>\n\n"
                             "Введите название вашей студии груминга (например: <i>GroomAlmaty</i>):",
                             parse_mode="HTML")
        await state.set_state(MasterReg.waiting_for_name)


# 2. Обработка сигнала регистрации из Mini App (index.html)
@router.message(F.web_app_data.data.contains("start_master_registration"))
async def web_master_reg(message: types.Message, state: FSMContext):
    await message.answer("✂️ <b>Регистрация партнера</b>\n\n"
                         "Введите название вашей студии (это увидят клиенты):",
                         parse_mode="HTML")
    await state.set_state(MasterReg.waiting_for_name)


# 3. Финальный шаг: сохранение и генерация Deep Link
@router.message(MasterReg.waiting_for_name)
async def finish_master_registration(message: types.Message, state: FSMContext):
    studio_name = message.text
    m_id = message.from_user.id

    # Сохраняем мастера в Supabase
    db.register_new_master(m_id, studio_name)

    # Динамически получаем юзернейм бота для создания ссылки
    bot_info = await message.bot.get_me()
    personal_link = f"<code>https://t.me/{bot_info.username}/app?startapp={m_id}</code>"

    await message.answer(
        f"🎉 <b>Студия «{studio_name}» успешно создана!</b>\n\n"
        f"Вот ваша персональная ссылка для записи клиентов:\n{personal_link}\n\n"
        f"📍 <b>Что с ней делать?</b>\n"
        f"Скопируйте её и вставьте в описание профиля Instagram. "
        f"Клиенты, перейдя по ней, сразу попадут на ваш прайс-лист.",
        parse_mode="HTML",
        reply_markup=kb.get_main_kb(m_id, ADMIN_ID)
    )

    # Уведомление главному администратору
    if ADMIN_ID:
        await message.bot.send_message(
            ADMIN_ID,
            f"🚀 <b>Новый партнер в системе!</b>\n\n"
            f"🏠 Студия: {studio_name}\n"
            f"👤 Мастер: {message.from_user.full_name}\n"
            f"🆔 ID: <code>{m_id}</code>",
            parse_mode="HTML"
        )

    await state.clear()


# 4. Выдача ссылки по нажатию кнопки в меню
@router.message(F.text == "🔗 Моя ссылка")
async def send_personal_link(message: types.Message):
    m_id = message.from_user.id
    # Проверяем, имеет ли пользователь право на ссылку
    if db.is_master(m_id) or m_id == ADMIN_ID:
        bot_info = await message.bot.get_me()
        link = f"<code>https://t.me/{bot_info.username}/app?startapp={m_id}</code>"

        await message.answer(
            f"📋 <b>Ваша ссылка для Instagram:</b>\n\n{link}\n\n"
            f"<i>Нажмите на ссылку, чтобы скопировать её.</i>",
            parse_mode="HTML"
        )
    else:
        await message.answer("❌ У вас пока нет прав мастера. Введите /master для регистрации.")