import paho.mqtt.client as mqtt
import json
from database import SessionLocal
from models import MusselData

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker")
    client.subscribe("mussel/data")

def on_message(client, userdata, msg):
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
