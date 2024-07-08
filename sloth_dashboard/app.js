let map;
let marker;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 2
    });

    marker = new google.maps.Marker({
        position: { lat: 0, lng: 0 },
        map: map
    });

    // Connect to MQTT broker after map is initialized
    connectMQTT();
}
 
function connectMQTT() {
    const client = mqtt.connect('wss://test.mosquitto.org:8081');

    client.on('connect', function () {
        console.log('Connected to MQTT broker');
        client.subscribe('gps/coordinates');
    });

    client.on('message', function (topic, message) {
        if (topic === 'gps/coordinates') {
            try {
                const coords = JSON.parse(message.toString());
                if (coords.lat && coords.lon) {
                    updateMap(coords.lat, coords.lon);
                } else {
                    console.error('Invalid coordinate format');
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        }
    });

    // Error handling for MQTT connection
    client.on('error', function (error) {
        console.error('MQTT connection error:', error);
    });

    client.on('offline', function () {
        console.log('MQTT client is offline');
    });

    client.on('reconnect', function () {
        console.log('MQTT client is trying to reconnect');
    });
}

function updateMap(lat, lon) {
    const newPosition = new google.maps.LatLng(lat, lon);
    marker.setPosition(newPosition);
    map.setCenter(newPosition);
    map.setZoom(13);
    console.log('Map updated with coordinates:', lat, lon);
}