from aiogram import Router, types
from aiogram.filters import Command, CommandObject
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


@router.message(Command("start"))
async def cmd_start(message: types.Message, command: CommandObject):
    """
    Обработка команды /start.
    Если есть аргумент (ID мастера), бот настраивает меню под этого мастера.
    """
    u_id = message.from_user.id

    # Пытаемся достать ID мастера из ссылки (параметр после /start)
    master_id_from_link = command.args

    master_info = None
    # Если аргумент есть и это число, ищем мастера в базе
    if master_id_from_link and master_id_from_link.isdigit():
        master_info = db.get_master_info(master_id_from_link)

    if master_info:
        # Если мастер найден, приветствуем клиента и даем кнопку записи
        await message.answer(
            f"🐾 Добро пожаловать в <b>{master_info['studio_name']}</b>!\n\n"
            f"Для онлайн-записи к нам нажмите кнопку ниже. Это займет всего минуту.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID, for_master=master_info)
        )
    else:
        # Если это просто запуск бота без параметров
        await message.answer(
            "🐾 <b>PETGroom</b> — умная система записи для груминг-салонов.\n\n"
            "Если вы владелец студии или мастер — нажмите кнопку «Стать партнером», "
            "чтобы создать свою ссылку для записи клиентов.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID)
        )


# Обработка других общих сообщений (не команд)
@router.message()
async def empty_handler(message: types.Message):
    # Если пользователь просто что-то пишет, напоминаем о меню
    await message.answer(
        "Используйте кнопки меню для управления.",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )