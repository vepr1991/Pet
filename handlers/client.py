from aiogram import Router, types
from aiogram.filters import Command, CommandObject
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


@router.message(Command("start"))
async def cmd_start(message: types.Message, command: CommandObject):
    u_id = message.from_user.id
    args = command.args  # Это ID мастера из ссылки t.me/bot?start=ID

    master_info = None
    if args and args.isdigit():
        master_info = db.get_master_info(args)

    if master_info:
        await message.answer(
            f"Добро пожаловать в <b>{master_info['studio_name']}</b>! 🐾\n\n"
            "Нажмите на кнопку ниже, чтобы выбрать услугу.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID, for_master=master_info)
        )
    else:
        await message.answer(
            "🐾 <b>PETGroom</b> — система управления записями.\n\n"
            "Если вы мастер, нажмите кнопку регистрации.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(u_id, ADMIN_ID)
        )