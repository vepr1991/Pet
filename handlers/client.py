import json
from aiogram import Router, F, types
from aiogram.filters import Command
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


# Команда /start - теперь она предлагает открыть Mini App
@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        f"Привет, {message.from_user.first_name}! 🐾\n"
        "Добро пожаловать в PETGroom. Теперь записаться на стрижку можно быстро через наше мини-приложение.",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )


# Обработка данных, пришедших из Mini App
@router.message(F.web_app_data)
async def process_web_app_data(message: types.Message):
    try:
        # Распаковываем JSON, который отправил index.html через tg.sendData
        data = json.loads(message.web_app_data.data)

        # Извлекаем поля (важно, чтобы ключи совпадали с теми, что в index.html)
        breed = data.get('breed', 'Не указана')
        pet_name = data.get('pet_name', 'Не указано')
        service = data.get('service', 'Не выбрана')
        date_time = data.get('date_time', 'Не указано')
        phone = data.get('phone', 'Не указан')

        # Сохранение в вашу базу данных SQLite
        db.add_appointment(
            user_id=message.from_user.id,
            breed=breed,
            pet_name=pet_name,
            service=service,
            date_time=date_time,
            phone=phone
        )

        # Ответ пользователю
        await message.answer(
            f"✅ <b>Запись успешно создана!</b>\n\n"
            f"🐶 <b>Питомец:</b> {breed} ({pet_name})\n"
            f"✂️ <b>Услуга:</b> {service}\n"
            f"📅 <b>Время:</b> {date_time}\n\n"
            f"Мастер свяжется с вами по номеру {phone}.",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
        )

        # Уведомление администратора
        if ADMIN_ID:
            try:
                await message.bot.send_message(
                    ADMIN_ID,
                    f"🔥 <b>НОВАЯ ЗАПИСЬ ИЗ MINI APP!</b>\n\n"
                    f"👤 Клиент: {message.from_user.full_name}\n"
                    f"🐶 Питомец: {breed} {pet_name}\n"
                    f"✂️ Услуга: {service}\n"
                    f"📅 Когда: {date_time}\n"
                    f"📞 Телефон: {phone}",
                    parse_mode="HTML"
                )
            except Exception as e:
                print(f"Ошибка уведомления админа: {e}")

    except Exception as e:
        await message.answer("Произошла ошибка при обработке данных из приложения. Попробуйте еще раз.")
        print(f"Ошибка Web App Data: {e}")


# Резервный хендлер для текстовых сообщений
@router.message(F.text)
async def echo_handler(message: types.Message):
    await message.answer(
        "Используйте кнопку в меню для записи на груминг ⬇️",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )