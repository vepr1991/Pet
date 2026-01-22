import sqlite3
from datetime import datetime

DB_NAME = 'grooming.db'

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                breed TEXT,
                pet_name TEXT,
                service TEXT,
                date_time TEXT,
                phone TEXT, 
                created_at TEXT
            )
        ''')
        conn.commit()

def add_appointment(user_id, breed, pet_name, service, date_time, phone):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO appointments (user_id, breed, pet_name, service, date_time, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (user_id, breed, pet_name, service, date_time, phone, str(datetime.now()))
        )
        conn.commit()

def get_last_appointments(limit=5):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, breed, pet_name, service, date_time, phone, user_id FROM appointments ORDER BY id DESC LIMIT ?', (limit,))
        return cursor.fetchall()

def delete_appointment(appointment_id):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM appointments WHERE id = ?', (appointment_id,))
        conn.commit()