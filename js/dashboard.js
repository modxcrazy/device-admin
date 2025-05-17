document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    const map = new mapboxgl.Map({
        container: 'devicesMap',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [0, 0],
        zoom: 1
    });

    // Load device statistics
    const devicesRef = database.ref('devices');
    
    devicesRef.on('value', (snapshot) => {
        const devices = snapshot.val();
        let total = 0;
        let active = 0;
        let locked = 0;
        let inactive = 0;
        
        // Clear existing markers
        document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());
        
        if (devices) {
            Object.keys(devices).forEach(deviceId => {
                const device = devices[deviceId];
                total++;
                
                if (device.status === 'active') active++;
                if (device.status === 'locked') locked++;
                if (device.status === 'inactive') inactive++;
                
                // Add marker for devices with location
                if (device.location) {
                    new mapboxgl.Marker()
                        .setLngLat([device.location.longitude, device.location.latitude])
                        .setPopup(new mapboxgl.Popup().setHTML(`
                            <h3>${deviceId}</h3>
                            <p>Status: ${device.status}</p>
                            <p>User: ${device.userName || 'Unknown'}</p>
                        `))
                        .addTo(map);
                }
            });
        }
        
        // Update stats
        document.getElementById('totalDevices').textContent = total;
        document.getElementById('activeDevices').textContent = active;
        document.getElementById('lockedDevices').textContent = locked;
        document.getElementById('inactiveDevices').textContent = inactive;
        
        // Fit map to bounds if devices exist
        if (total > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            Object.values(devices).forEach(device => {
                if (device.location) {
                    bounds.extend([device.location.longitude, device.location.latitude]);
                }
            });
            map.fitBounds(bounds, { padding: 50 });
        }
    });
    
    // Load recent activity
    const activityRef = database.ref('activities').limitToLast(5);
    const activityList = document.getElementById('activityList');
    
    activityRef.on('value', (snapshot) => {
        activityList.innerHTML = '';
        const activities = snapshot.val();
        
        if (activities) {
            Object.values(activities).reverse().forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                
                activityItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas ${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${activity.title}</h4>
                        <p>${activity.timestamp} • ${activity.deviceId || ''}</p>
                    </div>
                `;
                
                activityList.appendChild(activityItem);
            });
        }
    });
    
    function getActivityIcon(type) {
        const icons = {
            'lock': 'fa-lock',
            'unlock': 'fa-unlock',
            'login': 'fa-sign-in-alt',
            'logout': 'fa-sign-out-alt',
            'alert': 'fa-exclamation-triangle',
            'default': 'fa-info-circle'
        };
        return icons[type] || icons.default;
    }
});
