import os
import time
import socketio
from threading import Thread, Event

TOKEN = os.environ.get("TOKEN", "MySuperSecretToken2024")
SCRIPT_NAME = os.environ.get("SCRIPT_NAME", "Script-Python")
CATEGORY = os.environ.get("CATEGORY", "PythonScripts")

sio = socketio.Client(reconnection=False)  # empêche le client de se reconnecter tout seul
is_connected = Event()
is_running = Event()

def do_work():
    while True:
        is_running.wait()
        if not is_connected.is_set():
            break
        # Simule le travail du script (OK)
        print(f"[{SCRIPT_NAME}] Tâche active - ping dashboard")
        sio.emit("log", {"name": SCRIPT_NAME, "log": "OK"})
        sio.emit("stat_graphique", {"name": SCRIPT_NAME, "success": int(time.time() * 100) % 250})
        time.sleep(5)

def connect_dashboard():
    while True:
        try:
            print(f"[{SCRIPT_NAME}] Connexion au dashboard...")
            sio.connect("http://dashboard:3333", wait_timeout=30)
            is_connected.set()
            break
        except Exception as e:
            print(f"Connexion échouée, nouvelle tentative dans 5s : {e}")
            time.sleep(5)

@sio.event
def connect():
    print(f"[{SCRIPT_NAME}] Connecté au dashboard")
    sio.emit("identify", {"name": SCRIPT_NAME, "token": TOKEN, "category": CATEGORY})

@sio.on("action")
def on_action(data):
    name = data.get("name")
    command = data.get("command")
    if name != SCRIPT_NAME:
        return
    print(f"[{SCRIPT_NAME}] Action reçue : {command}")
    if command == "play":
        if not is_connected.is_set():
            Thread(target=connect_dashboard, daemon=True).start()
        is_running.set()
    elif command == "stop":
        is_running.clear()
        sio.disconnect()
        is_connected.clear()
    elif command in ("redo", "restart"):
        is_running.clear()
        sio.disconnect()
        is_connected.clear()
        time.sleep(1.2)
        Thread(target=connect_dashboard, daemon=True).start()
        is_running.set()

@sio.event
def disconnect():
    print(f"[{SCRIPT_NAME}] Déconnecté du dashboard")
    is_connected.clear()
    is_running.clear()

if __name__ == "__main__":
    Thread(target=do_work, daemon=True).start()
    connect_dashboard()
    while True:
        time.sleep(60)
