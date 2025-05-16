import { db } from './dashboard.js';

// DOM Elements
const devicesTableBody = document.getElementById('devicesTableBody');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const deviceDetailsModal = new bootstrap.Modal(document.getElementById('deviceDetailsModal'));

// Device data cache
let devicesCache = [];
let currentPage = 1;
const devicesPerPage = 10;

// Initialize devices module
export function initDevices() {
    loadDevices();
    setupEventListeners();
}

function loadDevices() {
    devicesTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </td>
        </tr>`;
    
    db.collection('devices').get()
        .then(snapshot => {
            devicesCache = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            renderDevicesTable();
            setupPagination();
        })
        .catch(error => {
            console.error("Error loading devices:", error);
            devicesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Failed to load devices. Please try again.
                    </td>
                </tr>`;
        });
}

function renderDevicesTable(filteredDevices = null) {
    const devicesToRender = filteredDevices || devicesCache;
    const startIndex = (currentPage - 1) * devicesPerPage;
    const endIndex = startIndex + devicesPerPage;
    const paginatedDevices = devicesToRender.slice(startIndex, endIndex);
    
    if (paginatedDevices.length === 0) {
        devicesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    No devices found
                </td>
            </tr>`;
        return;
    }
    
    devicesTableBody.innerHTML = paginatedDevices.map(device => `
        <tr data-device-id="${device.id}">
            <td>${device.id.substring(0, 8)}...</td>
            <td>${device.deviceName || 'Unnamed Device'}</td>
            <td>
                <span class="badge badge-status ${getStatusClass(device.lastActive)}">
                    ${getStatusText(device.lastActive)}
                </span>
            </td>
            <td>${formatDate(device.lastActive)}</td>
            <td>
                <i class="bi ${device.adminActive ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'}"></i>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-details">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-secondary send-command">
                    <i class="bi bi-send"></i> Command
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', e => {
            const deviceId = e.target.closest('tr').getAttribute('data-device-id');
            showDeviceDetails(deviceId);
        });
    });
    
    document.querySelectorAll('.send-command').forEach(btn => {
        btn.addEventListener('click', e => {
            const deviceId = e.target.closest('tr').getAttribute('data-device-id');
            // Implement command sending logic
        });
    });
}

function setupPagination() {
    const totalPages = Math.ceil(devicesCache.length / devicesPerPage);
    const pagination = document.getElementById('pagination');
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
    }
    
    // Next button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>`;
    
    // Add event listeners
    document.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            currentPage = parseInt(e.target.getAttribute('data-page'));
            renderDevicesTable();
        });
    });
}

function showDeviceDetails(deviceId) {
    const device = devicesCache.find(d => d.id === deviceId);
    if (!device) return;
    
    // Basic info
    document.getElementById('basicInfoTable').innerHTML = `
        <tr>
            <th>Device ID</th>
            <td>${device.id}</td>
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
    `;
    
    // Security status
    document.getElementById('securityStatusTable').innerHTML = `
        <tr>
            <th>Admin Active</th>
            <td>
                <i class="bi ${device.adminActive ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'}"></i>
                ${device.adminActive ? 'Yes' : 'No'}
            </td>
        </tr>
        <tr>
            <th>Camera Status</th>
            <td>
                <i class="bi ${device.cameraDisabled ? 'bi-camera-off text-danger' : 'bi-camera text-success'}"></i>
                ${device.cameraDisabled ? 'Disabled' : 'Enabled'}
            </td>
        </tr>
        <tr>
            <th>Password Set</th>
            <td>
                <i class="bi ${device.passwordSet ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'}"></i>
                ${device.passwordSet ? 'Yes' : 'No'}
            </td>
        </tr>
    `;
    
    // Recent commands
    loadDeviceCommands(deviceId);
    
    // Show modal
    deviceDetailsModal.show();
}

function loadDeviceCommands(deviceId) {
    const tableBody = document.getElementById('recentCommandsTable');
    tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="text-center">
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </td>
        </tr>`;
    
    db.collection('commands')
        .where('deviceId', '==', deviceId)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center text-muted">
                            No commands found
                        </td>
                    </tr>`;
                return;
            }
            
            tableBody.innerHTML = snapshot.docs.map(doc => {
                const cmd = doc.data();
                return `
                    <tr>
                        <td>${formatTime(cmd.timestamp.toDate())}</td>
                        <td>${cmd.command}</td>
                        <td>
                            <span class="badge ${getCommandStatusClass(cmd.status)}">
                                ${cmd.status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        })
        .catch(error => {
            console.error("Error loading commands:", error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-danger">
                        Failed to load commands
                    </td>
                </tr>`;
        });
}

// Helper functions
function getStatusClass(lastActive) {
    if (!lastActive) return 'badge-inactive';
    const hoursAgo = (new Date() - lastActive.toDate()) / (1000 * 60 * 60);
    return hoursAgo < 24 ? 'badge-active' : hoursAgo < 72 ? 'badge-pending' : 'badge-inactive';
}

function getStatusText(lastActive) {
    if (!lastActive) return 'Inactive';
    const hoursAgo = (new Date() - lastActive.toDate()) / (1000 * 60 * 60);
    return hoursAgo < 24 ? 'Active' : hoursAgo < 72 ? 'Inactive' : 'Offline';
}

function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    return timestamp.toDate().toLocaleString();
}

function formatTime(date) {
    return date.toLocaleTimeString();
}

function getCommandStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'completed': return 'bg-success';
        case 'failed': return 'bg-danger';
        case 'pending': return 'bg-warning';
        default: return 'bg-secondary';
    }
}

// Initialize devices module when DOM is loaded
document.addEventListener('DOMContentLoaded', initDevices);
