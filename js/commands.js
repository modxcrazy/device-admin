import { db, functions } from './dashboard.js';

// DOM Elements
const sendCommandBtn = document.getElementById('sendCommandBtn');
const commandType = document.getElementById('commandType');
const commandTarget = document.getElementById('commandTarget');
const deviceGroupSelect = document.getElementById('deviceGroupSelect');
const commandPassword = document.getElementById('commandPassword');
const customCommandInput = document.getElementById('customCommandInput');
const commandNotes = document.getElementById('commandNotes');

// Initialize commands module
export function initCommands() {
    if (sendCommandBtn) {
        sendCommandBtn.addEventListener('click', handleSendCommand);
    }
    
    // Load device groups if needed
    if (commandTarget) {
        commandTarget.addEventListener('change', e => {
            if (e.target.value === 'group') {
                loadDeviceGroups();
            }
        });
    }
}

function handleSendCommand() {
    const command = commandType.value;
    const target = commandTarget.value;
    const groupId = target === 'group' ? deviceGroupSelect.value : null;
    const notes = commandNotes.value.trim();
    
    // Validate inputs
    if (!command) {
        alert('Please select a command type');
        return;
    }
    
    if (command === 'reset_password' && !commandPassword.value) {
        alert('Please enter a password for reset');
        return;
    }
    
    if (target === 'group' && !groupId) {
        alert('Please select a device group');
        return;
    }
    
    // Prepare command data
    const commandData = {
        command,
        target,
        notes
    };
    
    if (command === 'reset_password') {
        commandData.password = commandPassword.value;
    } else if (command === 'custom_command') {
        try {
            commandData.customCommand = JSON.parse(customCommandInput.value);
        } catch (e) {
            alert('Invalid JSON in custom command');
            return;
        }
    }
    
    if (groupId) {
        commandData.groupId = groupId;
    }
    
    // Show loading state
    sendCommandBtn.disabled = true;
    sendCommandBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Sending...
    `;
    
    // Call Cloud Function
    const sendCommand = functions.httpsCallable('sendDeviceCommand');
    sendCommand(commandData)
        .then(result => {
            alert(`Command sent successfully to ${result.data.count} devices`);
            bootstrap.Modal.getInstance(document.getElementById('newCommandModal')).hide();
            resetCommandForm();
        })
        .catch(error => {
            console.error("Command error:", error);
            alert(`Failed to send command: ${error.message}`);
        })
        .finally(() => {
            sendCommandBtn.disabled = false;
            sendCommandBtn.innerHTML = 'Send Command';
        });
}

function loadDeviceGroups() {
    deviceGroupSelect.innerHTML = '<option value="">Loading groups...</option>';
    
    db.collection('deviceGroups').get()
        .then(snapshot => {
            if (snapshot.empty) {
                deviceGroupSelect.innerHTML = '<option value="">No groups found</option>';
                return;
            }
            
            deviceGroupSelect.innerHTML = snapshot.docs.map(doc => `
                <option value="${doc.id}">${doc.data().name}</option>
            `).join('');
        })
        .catch(error => {
            console.error("Error loading groups:", error);
            deviceGroupSelect.innerHTML = '<option value="">Error loading groups</option>';
        });
}

function resetCommandForm() {
    commandType.value = '';
    commandTarget.value = 'all';
    commandPassword.value = '';
    customCommandInput.value = '';
    commandNotes.value = '';
    document.getElementById('passwordField').style.display = 'none';
    document.getElementById('customCommandField').style.display = 'none';
    document.getElementById('deviceGroupField').style.display = 'none';
}

// Initialize commands module when DOM is loaded
document.addEventListener('DOMContentLoaded', initCommands);
