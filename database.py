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


# --- БЛОК МАСТЕРА ---

def register_new_master(telegram_id, studio_name):
    """Регистрация нового мастера в системе"""
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


# --- БЛОК КЛИЕНТСКИХ ЗАПИСЕЙ ---

def add_appointment(user_id, breed, pet_name, service, date_time, phone, master_id=None):
    """Добавление новой записи на груминг"""
    try:
        data = {
            "user_id": user_id,
            "breed": breed,
            "pet_name": pet_name,
            "service": service,
            "date_time": date_time,
            "phone": phone,
            "master_id": master_id
        }
        return supabase.table("appointments").insert(data).execute()
    except Exception as e:
        print(f"❌ Ошибка записи: {e}")
        return None


# --- БЛОК УПРАВЛЕНИЯ ЗАПИСЯМИ (АДМИН И МАСТЕР) ---

def get_last_appointments(limit=10):
    """
    ГЛОБАЛЬНЫЙ ПРОСМОТР (Для Глобального Админа)
    Получение списка последних записей всей системы.
    """
    try:
        response = supabase.table("appointments") \
            .select("*") \
            .order("id", desc=True) \
            .limit(limit) \
            .execute()

        formatted_rows = []
        for row in response.data:
            formatted_rows.append((
                row['id'],  # db_id
                row['breed'],  # breed
                row['pet_name'],  # name
                row['service'],  # serv
                row['date_time'],  # dt
                row['phone'],  # phone
                row['user_id']  # u_id
            ))
        return formatted_rows
    except Exception as e:
        print(f"❌ Ошибка получения общих записей: {e}")
        return []


def get_appointments_by_master(master_id, limit=10):
    """
    ПЕРСОНАЛЬНЫЙ ПРОСМОТР (Для Мастера)
    Получение списка записей только для конкретной студии.
    """
    try:
        response = supabase.table("appointments") \
            .select("*") \
            .eq("master_id", master_id) \
            .order("id", desc=True) \
            .limit(limit) \
            .execute()

        formatted_rows = []
        for row in response.data:
            formatted_rows.append((
                row['id'],  # db_id
                row['breed'],  # breed
                row['pet_name'],  # name
                row['service'],  # serv
                row['date_time'],  # dt
                row['phone'],  # phone
                row['user_id']  # u_id
            ))
        return formatted_rows
    except Exception as e:
        print(f"❌ Ошибка получения записей мастера: {e}")
        return []


def is_owner_of_appointment(user_id, appointment_id):
    """
    Проверка безопасности: принадлежит ли запись этому мастеру.
    Нужно, чтобы один мастер не удалил записи другого.
    """
    try:
        response = supabase.table("appointments") \
            .select("master_id") \
            .eq("id", appointment_id) \
            .execute()

        if response.data:
            db_master_id = response.data[0].get('master_id')
            # Сравниваем ID из базы с ID того, кто пытается совершить действие
            return str(db_master_id) == str(user_id)
        return False
    except Exception as e:
        return False


def delete_appointment(appointment_id):
    """Удаление записи по ID"""
    try:
        supabase.table("appointments").delete().eq("id", appointment_id).execute()
        return True
    except Exception as e:
        print(f"❌ Ошибка удаления: {e}")
        return False