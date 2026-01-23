import json
from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


class MasterReg(StatesGroup):
    waiting_for_name = State()


# Начало регистрации мастера (сигнал из Mini App)
@router.message(F.web_app_data.data.contains("start_master_registration"))
async def master_registration_start(message: types.Message, state: FSMContext):
    await message.answer("✂️ <b>Регистрация мастера</b>\n\nВведите название вашей студии:")
    await state.set_state(MasterReg.waiting_for_name)


# Сохранение мастера и выдача ссылки
@router.message(MasterReg.waiting_for_name)
async def finish_master_registration(message: types.Message, state: FSMContext):
    studio_name = message.text
    m_id = message.from_user.id

    db.register_new_master(m_id, studio_name)

    bot_info = await message.bot.get_me()
    # Персональная Deep Link ссылка
    link = f"<code>https://t.me/{bot_info.username}/app?startapp={m_id}</code>"

    await message.answer(
        f"🎉 <b>Студия зарегистрирована!</b>\n\nВаша ссылка для записи клиентов:\n{link}",
        parse_mode="HTML",
        reply_markup=kb.get_main_kb(m_id, ADMIN_ID)
    )

    if ADMIN_ID:
        await message.bot.send_message(ADMIN_ID, f"🚀 Новый партнер: {studio_name}\nID: {m_id}")
    await state.clear()


# Кнопка запроса ссылки
@router.message(F.text == "🔗 Моя ссылка")
async def send_link(message: types.Message):
    if db.is_master(message.from_user.id) or message.from_user.id == ADMIN_ID:
        bot_info = await message.bot.get_me()
        link = f"<code>https://t.me/{bot_info.username}/app?startapp={message.from_user.id}</code>"
        await message.answer(f"Ваша ссылка для Instagram:\n{link}", parse_mode="HTML")