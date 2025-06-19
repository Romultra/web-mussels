import paho.mqtt.client as mqtt
import json
import threading
from database import SessionLocal
from models import MusselData

# Thread-safe storage for the latest lamp state
_lamp_state_lock = threading.Lock()
_lamp_state = "OFF"

def get_lamp_state():
    with _lamp_state_lock:
        return _lamp_state

def set_lamp_state(state):
    global _lamp_state
    with _lamp_state_lock:
        _lamp_state = state

def send_lamp_command(state):
    # Publish a command to the controller to set the lamp state
    mqtt_client.publish("mussel/lamp_command", json.dumps({"lamp_state": state}))

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker")
    client.subscribe("mussel/data")
    client.subscribe("mussel/lamp_state")

def on_message(client, userdata, msg):
    if msg.topic == "mussel/lamp_state":
        payload = json.loads(msg.payload.decode())
        state = payload.get("lamp_state")
        if state in ("ON", "OFF"):
            set_lamp_state(state)
    else:
        payload = json.loads(msg.payload.decode())
        db = SessionLocal()
        entry = MusselData(
            temperature=payload.get("temperature"),
            od_value=payload.get("od_value"),
            pump_speed=payload.get("pump_speed")
        )
        db.add(entry)
        db.commit()
        db.close()

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect("localhost", 1883)
mqtt_client.loop_start()
