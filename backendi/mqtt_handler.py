import paho.mqtt.client as mqtt
import json
import threading
from database import SessionLocal
from models import MusselData, CommandLog

# Thread-safe storage for the latest status
_latest_status_lock = threading.Lock()
_latest_status = {}

def get_latest_status():
    with _latest_status_lock:
        return _latest_status.copy()

def set_latest_status(status):
    global _latest_status
    with _latest_status_lock:
        _latest_status = status.copy()

def send_command(command_dict):
    # Publish a command to the microcontroller
    mqtt_client.publish("mussel/commands", json.dumps(command_dict))
    # Log the command to the database
    db = SessionLocal()
    log_entry = CommandLog(command=json.dumps(command_dict))
    db.add(log_entry)
    db.commit()
    db.close()

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker")
    client.subscribe("mussel/status")

def on_message(client, userdata, msg):
    print(f"Received message on topic: {msg.topic}")
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Payload: {payload}")
        set_latest_status(payload)
        db = SessionLocal()
        entry = MusselData(
            temperature=payload.get("temperature"),
            od_value=payload.get("od_value"),
            pump_speed=payload.get("pump_speed"),
            target_temp=payload.get("target_temp"),
            pid_p=payload.get("pid_p"),
            pid_i=payload.get("pid_i"),
            pid_d=payload.get("pid_d"),
            lamp_state=payload.get("lamp_state")
        )
        db.add(entry)
        db.commit()
        db.close()
        print("Saved to mussel_data!")
    except Exception as e:
        print(f"Error processing message: {e}")

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.tls_set()  # Use default system CA certificates
mqtt_client.username_pw_set("Amira", "TUsc9pGhtyLv^zMBjFnvbChS")
mqtt_client.connect("mqtt.yperion.dev", 8883)
mqtt_client.loop_start()
