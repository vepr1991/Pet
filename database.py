import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


def init_db():
    try:
        supabase.table("masters").select("id").limit(1).execute()
        print("✅ Подключено к Supabase")
    except Exception as e:
        print(f"❌ Ошибка Supabase: {e}")


def add_appointment(user_id, breed, pet_name, service, date_time, phone, master_id, client_name):
    """Добавляет новую запись в таблицу appointments"""
    try:
        data = {
            "user_id": user_id,
            "breed": breed,
            "pet_name": pet_name,
            "service": service,
            "date_time": date_time,
            "phone": phone,
            "master_id": int(master_id),  # Числовой формат
            "client_name": client_name
        }
        return supabase.table("appointments").insert(data).execute()
    except Exception as e:
        print(f"❌ Ошибка add_appointment: {e}")
        return None


def get_appointments_by_master(master_id, limit=10):
    """Получение записей для чата Telegram"""
    try:
        res = supabase.table("appointments") \
            .select("id, breed, pet_name, service, date_time, phone, user_id, client_name") \
            .eq("master_id", int(master_id)) \
            .order("id", desc=True) \
            .limit(limit) \
            .execute()

        return [
            (r['id'], r['breed'], r['pet_name'], r['service'], r['date_time'], r['phone'], r['user_id'],
             r.get('client_name', 'Клиент'))
            for r in res.data
        ]
    except Exception as e:
        print(f"❌ Ошибка получения записей: {e}")
        return []


def get_master_info(master_id):
    try:
        res = supabase.table("masters").select("*").eq("telegram_id", int(master_id)).execute()
        return res.data[0] if res.data else None
    except:
        return None


def is_master(telegram_id):
    try:
        res = supabase.table("masters").select("id").eq("telegram_id", int(telegram_id)).execute()
        return len(res.data) > 0
    except:
        return False


def register_new_master(telegram_id, studio_name):
    try:
        return supabase.table("masters").insert({
            "telegram_id": int(telegram_id),
            "studio_name": studio_name,
            "is_active": True
        }).execute()
    except:
        return None


# --- НОВАЯ ФУНКЦИЯ УДАЛЕНИЯ УСЛУГ ---
def delete_service(service_id, master_id):
    """Удаляет услугу мастера"""
    try:
        return supabase.table("services") \
            .delete() \
            .eq("id", int(service_id)) \
            .eq("master_id", int(master_id)) \
            .execute()
    except Exception as e:
        print(f"❌ Ошибка удаления услуги: {e}")
        return None