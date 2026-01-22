import json
from aiogram import Router, F, types
import database as db
from config import ADMIN_ID
import keyboards as kb

router = Router()


@router.message(F.web_app_data)
async def handle_mini_app_data(message: types.Message):
    try:
        # 1. Получаем и парсим JSON
        web_data = json.loads(message.web_app_data.data)

        # 2. Извлекаем данные
        breed = web_data.get('breed', 'Не указана')
        pet_name = web_data.get('pet_name', 'Не указано')
        service = web_data.get('service', 'Не выбрана')
        date_time = web_data.get('date_time', 'Не указано')
        phone = web_data.get('phone', 'Не указан')

        # 3. СОХРАНЯЕМ В БД
        db.add_appointment(
            user_id=message.from_user.id,
            breed=breed,
            pet_name=pet_name,
            service=service,
            date_time=date_time,
            phone=phone
        )

        # 4. Ответ пользователю
        await message.answer(
            f"✅ <b>Запись подтверждена!</b>\n\n"
            f"🐶 Питомец: {breed} ({pet_name})\n"
            f"✂️ Услуга: {service}\n"
            f"📅 Время: {date_time}\n"
            f"📞 Контакт: {phone}",
            parse_mode="HTML"
        )

        # 5. Уведомление админу (обязательно!)
        if ADMIN_ID:
            await message.bot.send_message(
                ADMIN_ID,
                f"🔔 <b>НОВАЯ ЗАПИСЬ!</b>\n\n"
                f"🐶 Питомец: {breed} {pet_name}\n"
                f"✂️ Услуга: {service}\n"
                f"📅 Дата: {date_time}\n"
                f"📱 Телефон: {phone}",
                parse_mode="HTML"
            )

    except Exception as e:
        print(f"Ошибка сохранения записи: {e}")
        await message.answer("❌ Произошла ошибка при сохранении записи. Попробуйте еще раз.")