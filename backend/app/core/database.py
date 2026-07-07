"""
Tiny SQLite-based user store. Uses Python's built-in sqlite3 module —
no extra dependency, no external database server needed, matching the
"no setup needed" philosophy of the rest of this project.
"""
import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join("data", "users.db")


def init_db():
    os.makedirs("data", exist_ok=True)
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                full_name TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def get_user_by_email(email: str):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def create_user(email: str, hashed_password: str, full_name: str, created_at: str):
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO users (email, hashed_password, full_name, created_at) VALUES (?, ?, ?, ?)",
            (email, hashed_password, full_name, created_at)
        )
        conn.commit()
        return cursor.lastrowid