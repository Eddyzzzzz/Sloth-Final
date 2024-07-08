# Eddy Zhang, CEEO, Summer 2024
from machine import Pin, UART
import utime, time
import os
from micropyGPS import MicropyGPS
import machine
import network
from mqtt import MQTTClient
import ujson

# WiFi settings
WIFI_SSID = "tufts_eecs"
WIFI_PASSWORD = "foundedin1883"

# MQTT settings
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 8081
MQTT_TOPIC = b"eddy/coordinates"
CLIENT_ID = "Eddy"

# GPS Module UART Connection
gps_module = UART(1, baudrate=9600, tx=Pin(4), rx=Pin(5))

# Timezone setting for GPS
TIMEZONE = 5
my_gps = MicropyGPS(TIMEZONE)

# Function to convert raw Latitude and Longitude to actual Latitude and Longitude
def convert(parts):
    if parts[0] == 0:
        return None
        
    data = parts[0] + (parts[1] / 60.0)
    if parts[2] == 'S':
        data = -data
    if parts[2] == 'W':
        data = -data

    data = '{0:.6f}'.format(data)  # to 6 decimal places
    return str(data)

# Function to connect to WiFi
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Connecting to WiFi...')
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        while not wlan.isconnected():
            pass
    print('WiFi connected:', wlan.ifconfig())

# Function to connect to MQTT broker
def connect_mqtt():
    client = MQTTClient(CLIENT_ID, MQTT_BROKER, keepalive=60)
    client.connect()
    print('Connected to MQTT Broker')
    return client

# Connect to WiFi
connect_wifi()

# Connect to MQTT broker
mqtt_client = connect_mqtt()

while True:
    length = gps_module.any()
    if length > 0:
        b = gps_module.read(length)
        for x in b:
            my_gps.update(chr(x))
    
    latitude = convert(my_gps.latitude)
    longitude = convert(my_gps.longitude)
    
    if latitude is None or longitude is None:
        continue
    
    t = my_gps.timestamp
    gpsTime = '{:02d}:{:02d}:{:02}'.format(t[0], t[1], t[2])
    gpsdate = my_gps.date_string('long')
    speed = my_gps.speed_string('kph')  # 'kph' or 'mph' or 'knot'
    
    print('Lat:', latitude)
    print('Lng:', longitude)
    print('Time:', gpsTime)
    print('Date:', gpsdate)
    
    # Prepare MQTT message
    message = ujson.dumps({
        "lat": float(latitude),
        "lon": float(longitude),
        "time": gpsTime,
        "date": gpsdate
    })
    
    # Publish MQTT message
    try:
        mqtt_client.publish(MQTT_TOPIC, message)
        print("MQTT message published")
    except Exception as e:
        print("Failed to publish MQTT message:", str(e))
        # Attempt to reconnect
        mqtt_client = connect_mqtt()
    
    time.sleep(0.2)
