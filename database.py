import sqlite3
from datetime import datetime

DB_FILE = "voltstone.db"

def conectar():
    return sqlite3.connect(DB_FILE)

def inicializar_banco():
    with conectar() as conn:
        c = conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS usuarios (
                        id INTEGER PRIMARY KEY,
                        username TEXT,
                        nome TEXT,
                        criado_em TEXT
                    )""")
        c.execute("""CREATE TABLE IF NOT EXISTS investimentos (
                        id_usuario INTEGER PRIMARY KEY,
                        valor REAL,
                        rendimento REAL,
                        data TEXT
                    )""")
        c.execute("""CREATE TABLE IF NOT EXISTS rendimentos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_usuario INTEGER,
                        percentual REAL,
                        valor REAL,
                        data TEXT
                    )""")
        c.execute("""CREATE TABLE IF NOT EXISTS resgates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_usuario INTEGER,
                        valor REAL,
                        data TEXT,
                        status TEXT
                    )""")
        conn.commit()

def registrar_usuario(user_id, username, nome):
    with conectar() as conn:
        c = conn.cursor()
        c.execute("INSERT OR IGNORE INTO usuarios VALUES (?, ?, ?, ?)", (user_id, username, nome, datetime.now().isoformat()))
        conn.commit()

def registrar_deposito(user_id, valor):
    with conectar() as conn:
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO investimentos VALUES (?, ?, ?, ?)", (user_id, valor, 0.0, datetime.now().isoformat()))
        conn.commit()

def registrar_rendimento(user_id, percentual, valor):
    with conectar() as conn:
        c = conn.cursor()
        c.execute("UPDATE investimentos SET rendimento = rendimento + ? WHERE id_usuario = ?", (valor, user_id))
        c.execute("INSERT INTO rendimentos (id_usuario, percentual, valor, data) VALUES (?, ?, ?, ?)", (user_id, percentual, valor, datetime.now().isoformat()))
        conn.commit()

def get_investimento(user_id):
    with conectar() as conn:
        c = conn.cursor()
        c.execute("SELECT valor, rendimento, data FROM investimentos WHERE id_usuario = ?", (user_id,))
        row = c.fetchone()
        if row:
            return {"valor": row[0], "rendimento": row[1], "data": row[2]}
        return None

def get_historico_rendimento(user_id):
    with conectar() as conn:
        c = conn.cursor()
        c.execute("SELECT percentual, valor, data FROM rendimentos WHERE id_usuario = ?", (user_id,))
        return [{"percentual": r[0], "valor": r[1], "data": r[2]} for r in c.fetchall()]

def registrar_resgate(user_id, valor):
    with conectar() as conn:
        c = conn.cursor()
        c.execute("INSERT INTO resgates (id_usuario, valor, data, status) VALUES (?, ?, ?, ?)",
                  (user_id, valor, datetime.now().isoformat(), "pendente"))
        conn.commit()

def get_usuario_por_username(username):
    with conectar() as conn:
        c = conn.cursor()
        c.execute("SELECT id FROM usuarios WHERE username = ?", (username,))
        row = c.fetchone()
        return row[0] if row else None
