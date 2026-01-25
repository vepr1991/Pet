import os
import sys
from dotenv import load_dotenv

# Загружаем переменные из .env файла
load_dotenv()

# --- Настройки бота ---
# Убедитесь, что в .env файл переменная называется именно так (BOT_TOKEN)
TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

# --- Настройки базы данных ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# --- Проверки (чтобы не падать с непонятными ошибками) ---
if not TOKEN:
    print("❌ ОШИБКА: Не найден токен бота (BOT_TOKEN) в .env файле!")
    # Останавливаем программу, так как без токена бот не запустится
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️  ВНИМАНИЕ: Не найдены ключи Supabase в .env!")