document.addEventListener('DOMContentLoaded', function() {
    const devicesRef = database.ref('devices');
    const devicesTableBody = document.getElementById('devicesTableBody');
    const selectAllCheckbox = document.getElementById('selectAll');
    const deviceModal = document.getElementById('deviceModal');
    const closeModal = document.querySelector('.close-modal');
    
    let currentPage = 1;
    const devicesPerPage = 10;
    let allDevices = [];
    
    // Load devices
    function loadDevices() {
        devicesRef.once('value').then((snapshot) => {
            allDevices = [];
            devicesTableBody.innerHTML = '';
            
            const devices = snapshot.val();
            if (devices) {
                Object.keys(devices).forEach(deviceId => {
                    allDevices.push({
                        id: deviceId,
                        ...devices[deviceId]
                    });
                });
                
                renderDevicesTable();
                updatePagination();
            }
        });
    }
    
    // Render devices table
    function renderDevicesTable() {
        devicesTableBody.innerHTML = '';
        
        const startIndex = (currentPage - 1) * devicesPerPage;
        const endIndex = Math.min(startIndex + devicesPerPage, allDevices.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const device = allDevices[i];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><input type="checkbox" class="device-checkbox" data-id="${device.id}"></td>
                <td>${device.id}</td>
                <td>${device.userName || 'Unknown'}</td>
                <td><span class="status-badge status-${device.status || 'inactive'}">${device.status || 'inactive'}</span></td>
                <td>${device.lastActive ? new Date(device.lastActive).toLocaleString() : 'Never'}</td>
                <td>${device.location ? `${device.location.latitude}, ${device.location.longitude}` : 'Unknown'}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-device" data-id="${device.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            devicesTableBody.appendChild(row);
        }
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-device').forEach(btn => {
            btn.addEventListener('click', function() {
                const deviceId = this.getAttribute('data-id');
                showDeviceDetails(deviceId);
            });
        });
    }
    
    // Show device details modal
    function showDeviceDetails(deviceId) {
        const device = allDevices.find(d => d.id === deviceId);
        if (!device) return;
        
        document.getElementById('modalDeviceId').textContent = `Device: ${deviceId}`;
        
        let detailsHtml = `
            <div class="detail-row">
                <strong>User:</strong> ${device.userName || 'Unknown'}
            </div>
            <div class="detail-row">
                <strong>Status:</strong> <span class="status-badge status-${device.status || 'inactive'}">${device.status || 'inactive'}</span>
            </div>
            <div class="detail-row">
                <strong>Last Active:</strong> ${device.lastActive ? new Date(device.lastActive).toLocaleString() : 'Never'}
            </div>
            <div class="detail-row">
                <strong>Location:</strong> ${device.location ? `${device.location.latitude}, ${device.location.longitude}` : 'Unknown'}
            </div>
            <div class="detail-row">
                <strong>Device Model:</strong> ${device.deviceInfo?.model || 'Unknown'}
            </div>
            <div class="detail-row">
                <strong>OS Version:</strong> ${device.deviceInfo?.version || 'Unknown'}
            </div>
            <div class="detail-row">
                <strong>Battery Level:</strong> ${device.deviceInfo?.battery ? `${device.deviceInfo.battery}%` : 'Unknown'}
            </div>
        `;
        
        document.getElementById('modalDeviceContent').innerHTML = detailsHtml;
        deviceModal.style.display = 'flex';
    }
    
    // Update pagination
    function updatePagination() {
        const totalPages = Math.ceil(allDevices.length / devicesPerPage);
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }
    
    // Event listeners
    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.device-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    
    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderDevicesTable();
            updatePagination();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
        const totalPages = Math.ceil(allDevices.length / devicesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderDevicesTable();
            updatePagination();
        }
    });
    
    document.getElementById('refreshDevices').addEventListener('click', loadDevices);
    
    document.getElementById('lockSelected').addEventListener('click', function() {
        const selectedDevices = getSelectedDevices();
        if (selectedDevices.length === 0) return;
        
        selectedDevices.forEach(deviceId => {
            database.ref(`devices/${deviceId}/status`).set('locked');
            logActivity(deviceId, 'Device locked', 'lock');
        });
        
        alert(`${selectedDevices.length} device(s) locked successfully`);
    });
    
    document.getElementById('unlockSelected').addEventListener('click', function() {
        const selectedDevices = getSelectedDevices();
        if (selectedDevices.length === 0) return;
        
        selectedDevices.forEach(deviceId => {
            database.ref(`devices/${deviceId}/status`).set('active');
            logActivity(deviceId, 'Device unlocked', 'unlock');
        });
        
        alert(`${selectedDevices.length} device(s) unlocked successfully`);
    });
    
    document.getElementById('deactivateSelected').addEventListener('click', function() {
        const selectedDevices = getSelectedDevices();
        if (selectedDevices.length === 0) return;
        
        selectedDevices.forEach(deviceId => {
            database.ref(`devices/${deviceId}/status`).set('inactive');
            logActivity(deviceId, 'Device deactivated', 'power-off');
        });
        
        alert(`${selectedDevices.length} device(s) deactivated successfully`);
    });
    
    closeModal.addEventListener('click', function() {
        deviceModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === deviceModal) {
            deviceModal.style.display = 'none';
        }
    });
    
    // Helper functions
    function getSelectedDevices() {
        const checkboxes = document.querySelectorAll('.device-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-id'));
    }
    
    function logActivity(deviceId, title, type) {
        const activityRef = database.ref('activities').push();
        activityRef.set({
            deviceId,
            title,
            type,
            timestamp: new Date().toLocaleString()
        });
    }
    
    // Initial load
    loadDevices();
});
