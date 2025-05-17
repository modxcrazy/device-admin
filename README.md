# Device Monitoring Dashboard

A professional admin dashboard for monitoring and managing connected devices.

## Features

- Real-time device statistics (total, active, locked, inactive)
- Interactive map showing device locations
- Detailed device management interface
- Remote device control (lock/unlock/deactivate)
- Activity logging

## Setup Instructions

1. **Firebase Configuration**:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Copy your Firebase config to `js/firebase.js`
   - Enable Realtime Database in Firebase Console

2. **Mapbox Configuration**:
   - Sign up at [Mapbox](https://www.mapbox.com/)
   - Get your access token and add it to `js/firebase.js`

3. **Deploy to GitHub Pages**:
   - Push this repository to GitHub
   - Go to Repository Settings > Pages
   - Select "main branch" as source and click Save

4. **Android App Integration**:
   - Configure the Android app to write data to the same Firebase database
   - Ensure device status updates are sent to the `devices` node
   - Location data should be under `devices/{deviceId}/location`

## Data Structure

Firebase database should have the following structure:
