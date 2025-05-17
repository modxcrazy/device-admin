// Initialize Mapbox
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 1
});

// Listen for device data changes
const deviceRef = database.ref('devices/device1');

deviceRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        updateDashboard(data);
    }
});

function updateDashboard(data) {
    // Update location
    if (data.location) {
        map.flyTo({
            center: [data.location.longitude, data.location.latitude],
            zoom: 12
        });
        
        new mapboxgl.Marker()
            .setLngLat([data.location.longitude, data.location.latitude])
            .addTo(map);
            
        document.getElementById('locationInfo').innerHTML = `
            <p>Latitude: ${data.location.latitude}</p>
            <p>Longitude: ${data.location.longitude}</p>
            <p>Last Updated: ${new Date(data.timestamp).toLocaleString()}</p>
        `;
    }
    
    // Update device info
    if (data.deviceInfo) {
        document.getElementById('deviceInfo').innerHTML = `
            <p>Device: ${data.deviceInfo.model || 'Unknown'}</p>
            <p>OS: Android ${data.deviceInfo.version || 'Unknown'}</p>
            <p>Battery: ${data.deviceInfo.battery || 'Unknown'}%</p>
        `;
    }
}

// Action buttons
document.getElementById('lockDeviceBtn').addEventListener('click', () => {
    database.ref('commands/device1').set({
        command: 'lock_device',
        timestamp: Date.now()
    });
    alert('Lock request sent to device');
});

document.getElementById('getScreenshotBtn').addEventListener('click', () => {
    database.ref('commands/device1').set({
        command: 'request_screenshot',
        timestamp: Date.now()
    });
    alert('Screenshot request sent to device');
});
