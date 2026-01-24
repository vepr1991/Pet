import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def get_master_info(master_id):
    """Получает данные мастера для отображения клиенту на кнопке"""
    try:
        # Приводим к числу, так как в базе telegram_id — это int8
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
        data = {"telegram_id": telegram_id, "studio_name": studio_name, "is_active": True}
        return supabase.table("masters").insert(data).execute()
    except:
        return None