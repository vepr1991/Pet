import jwt
import time
import uuid
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from bot.database import requests as db
from config import SUPABASE_JWT_SECRET

BASE_URL = "https://vepr1991.github.io/Pet"  # Ваш URL


def create_access_token(user_id):
    """Генерируем JWT токен для Supabase RLS"""
    if not SUPABASE_JWT_SECRET:
        return ""

    payload = {
        "aud": "authenticated",  # Роль в Supabase
        "role": "authenticated",  # Обязательно authenticated
        "sub": str(uuid.uuid4()),  # Уникальный ID сессии
        "exp": time.time() + 3600,  # Токен живет 1 час
        "user_metadata": {
            "telegram_id": int(user_id)  # Самое важное: зашиваем ID юзера
        }
    }
    return jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm="HS256")


def get_main_kb(user_id, admin_id, for_master=None):
    u_id = int(user_id)
    a_id = int(admin_id) if admin_id and str(admin_id).isdigit() else 0

    is_master = db.is_master(u_id)
    is_admin = (u_id == a_id)

    # 1. КЛИЕНТ (ссылка остается обычной, клиенту права на запись не нужны)
    if for_master:
        studio = for_master.get('studio_name', 'студию')
        m_id = for_master.get('telegram_id')
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(
                text=f"🐾 Записаться в {studio}",
                web_app=WebAppInfo(url=f"{BASE_URL}/client.html?master_id={m_id}")
            )]
        ], resize_keyboard=True)

    # Генерируем токен для админа/мастера
    token = create_access_token(u_id)

    # 2. АДМИН
    if is_admin:
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(text="📊 Посмотреть записи (Все)")],
            # Передаем token в URL
            [KeyboardButton(text="⚙️ Админ-панель", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?token={token}"))],
            [KeyboardButton(text="🔗 Моя ссылка")]
        ], resize_keyboard=True)

    # 3. МАСТЕР
    if is_master:
        return ReplyKeyboardMarkup(keyboard=[
            # Передаем token в URL
            [KeyboardButton(text="⚙️ Панель мастера", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?token={token}"))],
            [KeyboardButton(text="🔗 Моя ссылка")]
        ], resize_keyboard=True)

    # 4. ГОСТЬ
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="🤝 Стать партнером (Регистрация мастера)")]
    ], resize_keyboard=True)