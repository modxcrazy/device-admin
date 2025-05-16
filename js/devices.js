// DOM elements
const devicesContainer = document.getElementById('devicesContainer');
const commandSelect = document.getElementById('commandSelect');
const passwordField = document.getElementById('passwordField');
const passwordInput = document.getElementById('passwordInput');
const sendCommandBtn = document.getElementById('sendCommandBtn');

// Track selected device
let selectedDeviceId = null;

// Show/hide password field based on command
commandSelect.addEventListener('change', (e) => {
    passwordField.style.display = e.target.value === 'reset_password' ? 'block' : 'none';
});

// Load devices
function loadDevices() {
    devicesContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary"></div></div>';
    
    db.collection('devices').get().then((querySnapshot) => {
        devicesContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            devicesContainer.innerHTML = '<div class="col-12 text-center text-muted">No devices registered</div>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const device = doc.data();
            createDeviceCard(doc.id, device);
        });
    }).catch((error) => {
        console.error("Error loading devices: ", error);
        devicesContainer.innerHTML = '<div class="col-12 text-center text-danger">Error loading devices</div>';
    });
}

// Create device card
function createDeviceCard(deviceId, device) {
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    card.innerHTML = `
        <div class="card device-card">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">
                    <i class="bi bi-phone"></i> ${device.deviceName || 'Unknown Device'}
                </h5>
            </div>
            <div class="card-body">
                <p class="card-text">
                    <small class="text-muted">ID: ${deviceId}</small><br>
                    <small class="text-muted">Last Active: ${formatDate(device.lastActive)}</small>
                </p>
                <button class="btn btn-sm btn-outline-primary command-btn" data-command="lock_device">
                    <i class="bi bi-lock"></i> Lock Device
                </button>
                <button class="btn btn-sm btn-outline-danger command-btn" data-command="disable_camera">
                    <i class="bi bi-camera-off"></i> Disable Camera
                </button>
                <button class="btn btn-sm btn-outline-success command-btn" data-command="enable_camera">
                    <i class="bi bi-camera"></i> Enable Camera
                </button>
                <button class="btn btn-sm btn-outline-warning command-btn" data-command="reset_password">
                    <i class="bi bi-key"></i> Reset Password
                </button>
            </div>
            <div class="card-footer bg-light">
                <button class="btn btn-sm btn-info view-details" data-device-id="${deviceId}">
                    <i class="bi bi-info-circle"></i> Details
                </button>
            </div>
        </div>
    `;
    
    devicesContainer.appendChild(card);
    
    // Add event listeners to command buttons
    card.querySelectorAll('.command-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const command = e.target.getAttribute('data-command');
            sendCommandToDevice(deviceId, command);
        });
    });
    
    // Add event listener to details button
    card.querySelector('.view-details').addEventListener('click', (e) => {
        showDeviceDetails(deviceId, device);
    });
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate();
    return date.toLocaleString();
}

// Send command to device
function sendCommandToDevice(deviceId, command, additionalData = {}) {
    const sendCommand = functions.httpsCallable('sendCommandToDevice');
    
    let data = { deviceId, command };
    
    if (command === 'reset_password' && additionalData.password) {
        data.password = additionalData.password;
    }
    
    sendCommand(data).then((result) => {
        alert(`Command sent successfully to device ${deviceId}`);
    }).catch((error) => {
        console.error("Error sending command: ", error);
        alert(`Failed to send command: ${error.message}`);
    });
}

// Show device details
function showDeviceDetails(deviceId, device) {
    const modalContent = document.getElementById('deviceDetailsContent');
    modalContent.innerHTML = `
        <h6>Device Information</h6>
        <table class="table table-sm">
            <tr>
                <th>Device ID</th>
                <td>${deviceId}</td>
            </tr>
            <tr>
                <th>Device Name</th>
                <td>${device.deviceName || 'Not specified'}</td>
            </tr>
            <tr>
                <th>Model</th>
                <td>${device.deviceModel || 'Unknown'}</td>
            </tr>
            <tr>
                <th>OS Version</th>
                <td>${device.osVersion || 'Unknown'}</td>
            </tr>
            <tr>
                <th>Last Active</th>
                <td>${formatDate(device.lastActive)}</td>
            </tr>
        </table>
        
        <h6 class="mt-4">Device Status</h6>
        <table class="table table-sm">
            <tr>
                <th>Camera Status</th>
                <td>${device.cameraDisabled ? 'Disabled' : 'Enabled'}</td>
            </tr>
            <tr>
                <th>Admin Active</th>
                <td>${device.adminActive ? 'Yes' : 'No'}</td>
            </tr>
        </table>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('deviceDetailsModal'));
    modal.show();
}

// Send command to all devices
sendCommandBtn.addEventListener('click', () => {
    const command = commandSelect.value;
    let additionalData = {};
    
    if (command === 'reset_password') {
        if (!passwordInput.value) {
            alert('Please enter a password');
            return;
        }
        additionalData.password = passwordInput.value;
    }
    
    const sendCommand = functions.httpsCallable('sendCommandToAllDevices');
    
    sendCommand({ command, ...additionalData }).then((result) => {
        alert(`Command sent successfully to all devices`);
        bootstrap.Modal.getInstance(document.getElementById('sendCommandModal')).hide();
    }).catch((error) => {
        console.error("Error sending command: ", error);
        alert(`Failed to send command: ${error.message}`);
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDevices();
});
