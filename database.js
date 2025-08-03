import os
import json

DB_FILE = "wallets.json"

def load_data():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

def load_balance(user_id):
    data = load_data()
    return data.get(user_id, 0)

def save_balance(user_id, balance):
    data = load_data()
    data[user_id] = round(balance, 2)
    save_data(data)