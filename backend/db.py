import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "records.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.commit()
        conn.close()

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS solo_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                difficulty TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS vs_wins (
                name TEXT PRIMARY KEY,
                wins INTEGER NOT NULL DEFAULT 0
            )
        ''')

def add_solo_score(name: str, score: int, difficulty: str):
    with get_db() as conn:
        conn.execute('INSERT INTO solo_scores (name, score, difficulty) VALUES (?, ?, ?)', (name, score, difficulty))

def add_vs_win(name: str):
    with get_db() as conn:
        conn.execute('''
            INSERT INTO vs_wins (name, wins) VALUES (?, 1) 
            ON CONFLICT(name) DO UPDATE SET wins = wins + 1
        ''', (name,))

def get_top_solo(limit: int = 10):
    with get_db() as conn:
        cur = conn.execute('SELECT name, score, difficulty, timestamp FROM solo_scores ORDER BY score DESC LIMIT ?', (limit,))
        return [dict(row) for row in cur.fetchall()]

def get_top_vs(limit: int = 10):
    with get_db() as conn:
        cur = conn.execute('SELECT name, wins FROM vs_wins ORDER BY wins DESC LIMIT ?', (limit,))
        return [dict(row) for row in cur.fetchall()]

init_db()
