import os
from supabase import create_client, Client

# Загрузка ключей из переменных окружения (IDE или Render)
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("⚠️ Ошибка: Ключи SUPABASE_URL или SUPABASE_KEY не найдены!")

supabase: Client = create_client(url, key)

def init_db():
    """Проверка соединения с облаком при запуске бота"""
    try:
        supabase.table("appointments").select("id").limit(1).execute()
        print("✅ Успешное подключение к Supabase")
    except Exception as e:
        print(f"❌ Ошибка проверки Supabase: {e}")

# --- БЛОК КЛИЕНТА ---

def add_appointment(user_id, breed, pet_name, service, date_time, phone, master_id=None):
    try:
        data = {
            "user_id": user_id,
            "breed": breed,
            "pet_name": pet_name,
            "service": service,
            "date_time": date_time,
            "phone": phone,
            "master_id": master_id  # Привязываем запись к конкретному мастеру
        }
        # Бот с service_role ключом запишет это в обход любых RLS
        return supabase.table("appointments").insert(data).execute()
    except Exception as e:
        print(f"❌ Ошибка записи: {e}")
        return None

def register_new_master(telegram_id, studio_name):
    try:
        data = {"telegram_id": telegram_id, "studio_name": studio_name, "is_active": True}
        return supabase.table("masters").insert(data).execute()
    except Exception as e:
        print(f"❌ Ошибка регистрации мастера: {e}")
        return None

def is_master(telegram_id):
    """Проверка прав доступа: есть ли такой ID в таблице мастеров"""
    try:
        response = supabase.table("masters").select("*").eq("telegram_id", telegram_id).execute()
        return len(response.data) > 0
    except Exception as e:
        print(f"❌ Ошибка проверки роли: {e}")
        return False

# --- БЛОК АДМИНИСТРАТОРА ---

def get_last_appointments(limit=10):
    """
    Получение списка записей для отображения в боте.
    Возвращает список кортежей для совместимости с текущим admin.py.
    """
    try:
        response = supabase.table("appointments")\
            .select("*")\
            .order("id", desc=True)\
            .limit(limit)\
            .execute()

        formatted_rows = []
        for row in response.data:
            # Строгое соблюдение порядка для распаковки в handlers/admin.py
            formatted_rows.append((
                row['id'],          # db_id
                row['breed'],       # breed
                row['pet_name'],    # name
                row['service'],     # serv
                row['date_time'],   # dt
                row['phone'],       # phone
                row['user_id']      # u_id
            ))
        return formatted_rows
    except Exception as e:
        print(f"❌ Ошибка получения записей: {e}")
        return []

def delete_appointment(appointment_id):
    """Удаление записи по ID"""
    try:
        supabase.table("appointments").delete().eq("id", appointment_id).execute()
        return True
    except Exception as e:
        print(f"❌ Ошибка удаления: {e}")
        return False