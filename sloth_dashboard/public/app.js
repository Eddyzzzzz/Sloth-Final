let map;
let marker;
let logContent;

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('login-button');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    loginButton.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });
});

async function attemptLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-container').style.display = 'block';
            initializeApp();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

function initializeApp() {
    // Initialize the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 2
    });

    marker = new google.maps.Marker({
        position: { lat: 0, lng: 0 },
        map: map
    });

    logContent = document.getElementById('log-content');

    // Connect to MQTT broker
    connectMQTT();
    setupButtons();
}

function connectMQTT() {
    const client = mqtt.connect('wss://test.mosquitto.org:8081');

    client.on('connect', function () {
        console.log('Connected to MQTT broker');
        // addLog('Connected to MQTT broker');
        client.subscribe('eddy/coordinates');
    });

    client.on('message', function (topic, message) {
        if (topic === 'eddy/coordinates') {
            try {
                const coords = JSON.parse(message.toString());
                if (coords.lat && coords.lon) {
                    updateMap(coords.lat, coords.lon);
                    // addLog(`New coordinates: ${coords.lat}, ${coords.lon}`);
                } else {
                    console.error('Invalid coordinate format');
                    addLog('Error: Invalid coordinate format');
                }
            } catch (error) {
                console.error('Error parsing message:', error);
                addLog('Error: Failed to parse coordinates');
            }
        }
    });

    // Error handling for MQTT connection
    client.on('error', function (error) {
        console.error('MQTT connection error:', error);
        addLog('MQTT connection error');
    });

    client.on('offline', function () {
        console.log('MQTT client is offline');
        // addLog('MQTT client is offline');
    });

    client.on('reconnect', function () {
        console.log('MQTT client is trying to reconnect');
        // addLog('MQTT client is trying to reconnect');
    });
}

function updateMap(lat, lon) {
    const newPosition = new google.maps.LatLng(lat, lon);
    marker.setPosition(newPosition);
    map.setCenter(newPosition);
    map.setZoom(18);
    console.log('Map updated with coordinates:', lat, lon);
}

function addLog(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

function setupButtons() {
    document.getElementById('speaker-on').addEventListener('click', () => addLog('Speaker turned on'));
    document.getElementById('speaker-off').addEventListener('click', () => addLog('Speaker turned off'));
    document.getElementById('led-on').addEventListener('click', () => addLog('LED turned on'));
    document.getElementById('led-off').addEventListener('click', () => addLog('LED turned off'));
}