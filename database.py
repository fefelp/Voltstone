import datetime

# Simulação de banco de dados com dicionário em memória
db_users = {}
db_rendimentos = {}

def add_user(user_id, username, first_name):
    if user_id not in db_users:
        db_users[user_id] = {
            "username": username,
            "first_name": first_name,
            "valor_depositado": 0.0,
            "rendimento_total": 0.0,
            "data_deposito": datetime.datetime.now()
        }

def check_payment(user_id):
    # Simula que o pagamento foi encontrado se já tiver depositado algo
    return db_users.get(user_id, {}).get("valor_depositado", 0.0) > 0.0

def get_user_investment(user_id):
    return db_users.get(user_id)

def get_rendimento_historico(user_id):
    return db_rendimentos.get(user_id, [])

def registrar_deposito(user_id, valor):
    if user_id in db_users:
        db_users[user_id]["valor_depositado"] += valor
        db_users[user_id]["data_deposito"] = datetime.datetime.now()

def registrar_rendimento(user_id, percentual, valor):
    if user_id not in db_rendimentos:
        db_rendimentos[user_id] = []

    db_rendimentos[user_id].append({
        "data": datetime.datetime.now(),
        "percentual": percentual,
        "valor": valor
    })

    if user_id in db_users:
        db_users[user_id]["rendimento_total"] += valor