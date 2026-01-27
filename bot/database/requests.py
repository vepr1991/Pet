# bot/database/requests.py

from .core import supabase


def init_db():
    try:
        supabase.table("masters").select("id").limit(1).execute()
        print("✅ Подключено к Supabase")
    except Exception as e:
        print(f"❌ Ошибка Supabase: {e}")


def add_appointment(user_id, breed, pet_name, service, date_time, phone, master_id, client_name, username=None):
    """Добавляет новую запись в таблицу appointments"""
    try:
        data = {
            "user_id": user_id,
            "breed": breed,
            "pet_name": pet_name,
            "service": service,
            "date_time": date_time,
            "phone": phone,
            "master_id": int(master_id),
            "client_name": client_name,
            "username": username,
            "status": "confirmed"  # <--- ДОБАВИЛ: Явно ставим статус "подтверждено" при создании
        }
        return supabase.table("appointments").insert(data).execute()
    except Exception as e:
        print(f"❌ Ошибка add_appointment: {e}")
        return None


def check_availability(master_id, date_time_str):
    """Проверяет, свободен ли слот."""
    try:
        # ИСПРАВЛЕНИЕ:
        # Мы ищем записи на это время, которые НЕ ОТМЕНЕНЫ.
        # .neq("status", "cancelled") означает "Not Equal" (не равно) cancelled

        res = supabase.table("appointments") \
            .select("id") \
            .eq("master_id", int(master_id)) \
            .eq("date_time", date_time_str) \
            .neq("status", "cancelled") \
            .execute()

        # Если таких записей 0 — значит слот свободен (даже если там есть отмененные)
        return len(res.data) == 0
    except Exception as e:
        print(f"❌ Ошибка проверки слота: {e}")
        return False


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
        return supabase.table("masters").insert(
            {"telegram_id": int(telegram_id), "studio_name": studio_name, "is_active": True}).execute()
    except:
        return None


def get_appointments_by_master(master_id, limit=10):
    try:
        # ДОБАВИЛ: status в выборку, чтобы бот знал, активна запись или нет
        res = supabase.table("appointments") \
            .select("id, breed, pet_name, service, date_time, phone, user_id, client_name, username, status") \
            .eq("master_id", int(master_id)) \
            .order("id", desc=True) \
            .limit(limit) \
            .execute()

        return [
            (r['id'], r['breed'], r['pet_name'], r['service'], r['date_time'], r['phone'], r['user_id'],
             r.get('client_name', 'Клиент'), r.get('username'), r.get('status', 'confirmed'))  # Возвращаем статус тоже
            for r in res.data
        ]
    except Exception as e:
        print(f"❌ Ошибка get_appointments: {e}")
        return []


def delete_service(service_id, master_id):
    # Тут все верно, услуги мы договорились удалять насовсем (Hard Delete)
    try:
        return supabase.table("services").delete().eq("id", int(service_id)).eq("master_id", int(master_id)).execute()
    except:
        return None