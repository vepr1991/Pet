from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


# Состояния для записи
class Booking(StatesGroup):
    waiting_for_breed = State()
    waiting_for_pet_name = State()
    waiting_for_service = State()
    waiting_for_date = State()
    waiting_for_phone = State()


# Команда /start
@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        f"Привет, {message.from_user.first_name}! 🐾\nДобро пожаловать в PETGroom.",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )


# Кнопка отмены
@router.message(F.text == "❌ Отмена")
async def cancel_handler(message: types.Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "Запись отменена.",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )


# Начало процесса записи
@router.message(F.text == "Записаться на груминг ✂️")
async def start_booking(message: types.Message, state: FSMContext):
    await message.answer("Какая порода у вашего питомца?",
                         reply_markup=kb.get_services_kb())  # Здесь мы даем кнопки с отменой
    await state.set_state(Booking.waiting_for_breed)


@router.message(Booking.waiting_for_breed)
async def process_breed(message: types.Message, state: FSMContext):
    if message.text == "❌ Отмена": return  # Проверка на отмену
    await state.update_data(breed=message.text)
    await message.answer("А как зовут вашего любимца?")
    await state.set_state(Booking.waiting_for_pet_name)


@router.message(Booking.waiting_for_pet_name)
async def process_pet_name(message: types.Message, state: FSMContext):
    await state.update_data(pet_name=message.text)
    await message.answer("Выберите нужную услугу:", reply_markup=kb.get_services_kb())
    await state.set_state(Booking.waiting_for_service)


@router.message(Booking.waiting_for_service)
async def process_service(message: types.Message, state: FSMContext):
    if message.text == "❌ Отмена": return
    await state.update_data(service=message.text)
    await message.answer("Напишите удобную дату и время (например: завтра в 15:00):",
                         reply_markup=types.ReplyKeyboardRemove())
    await state.set_state(Booking.waiting_for_date)


@router.message(Booking.waiting_for_date)
async def process_date(message: types.Message, state: FSMContext):
    await state.update_data(date_time=message.text)
    await message.answer("Поделитесь контактом для связи.", reply_markup=kb.get_contact_kb())
    await state.set_state(Booking.waiting_for_phone)


@router.message(Booking.waiting_for_phone, F.contact)
async def process_phone(message: types.Message, state: FSMContext):
    user_data = await state.get_data()
    phone = message.contact.phone_number

    # Сохранение в БД
    db.add_appointment(
        message.from_user.id,
        user_data['breed'],
        user_data['pet_name'],
        user_data['service'],
        user_data['date_time'],
        phone
    )

    await message.answer(f"✅ Готово! Мастер свяжется с вами по номеру {phone}.",
                         reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID))

    # Уведомление админу
    if ADMIN_ID:
        try:
            await message.bot.send_message(
                ADMIN_ID,
                f"🔥 <b>НОВАЯ ЗАПИСЬ!</b>\n\n"
                f"🐶 Питомец: {user_data['breed']} {user_data['pet_name']}\n"
                f"✂️ Услуга: {user_data['service']}\n"
                f"📅 Когда: {user_data['date_time']}\n"
                f"📞 Телефон: {phone}",
                parse_mode="HTML"
            )
        except Exception as e:
            print(f"Ошибка уведомления админа: {e}")

    await state.clear()