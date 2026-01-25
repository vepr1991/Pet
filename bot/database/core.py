# bot/database/core.py
import os
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY # Импорт из корня

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)