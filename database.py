import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Загружаем переменные окружения, если они в .env файле
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("⚠️ Ошибка: SUPABASE_URL или SUPABASE_KEY не установлены в переменных окружения!")

supabase: Client = create_client(url, key)

# --- ТА САМАЯ ФУНКЦИЯ, КОТОРОЙ НЕ ХВАТАЛО ---
def init_db():
    """Проверка соединения с облаком при запуске бота"""
    try:
        # Простой запрос для проверки связи
        supabase.table("masters").select("id").limit(1).execute()
        print("✅ Успешное подключение к базе данных Supabase")
    except Exception as e:
        print(f"❌ Ошибка подключения к Supabase: {e}")

# --- ОСТАЛЬНЫЕ ФУНКЦИИ БЭКЕНДА ---

def get_master_info(master_id):
    """Получает данные мастера для отображения клиенту на кнопке"""
    try:
        # Приводим к числу, так как в базе telegram_id — это int8
        res = supabase.table("masters").select("*").eq("telegram_id", int(master_id)).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Ошибка get_master_info: {e}")
        return None

def is_master(telegram_id):
    """Проверка прав доступа: есть ли такой ID в таблице мастеров"""
    try:
        res = supabase.table("masters").select("id").eq("telegram_id", int(telegram_id)).execute()
        return len(res.data) > 0
    except Exception as e:
        print(f"Ошибка is_master: {e}")
        return False

def register_new_master(telegram_id, studio_name):
    """Регистрация нового мастера"""
    try:
        data = {"telegram_id": int(telegram_id), "studio_name": studio_name, "is_active": True}
        return supabase.table("masters").insert(data).execute()
    except Exception as e:
        print(f"Ошибка регистрации мастера: {e}")
        return None

# Функции для работы с записями (appointments)
def get_last_appointments(limit=10):
    try:
        res = supabase.table("appointments").select("*").order("id", desc=True).limit(limit).execute()
        return [(r['id'], r['breed'], r['pet_name'], r['service'], r['date_time'], r['phone'], r['user_id']) for r in res.data]
    except:
        return []

def get_appointments_by_master(master_id, limit=10):
    try:
        res = supabase.table("appointments").select("*").eq("master_id", int(master_id)).order("id", desc=True).limit(limit).execute()
        return [(r['id'], r['breed'], r['pet_name'], r['service'], r['date_time'], r['phone'], r['user_id']) for r in res.data]
    except:
        return []

def delete_appointment(appointment_id):
    try:
        supabase.table("appointments").delete().eq("id", appointment_id).execute()
        return True
    except:
        return False