/**
 * API Configuration for Spendly App
 */

import { Platform } from 'react-native';

// Backend API URL
// For iOS Simulator: use localhost
// For Android Emulator: use 10.0.2.2
// For Physical Device: use your computer's IP address
const getApiUrl = () => {
    if (__DEV__) {
        // Find your IP: Windows -> ipconfig, Mac -> ifconfig
        return 'http://192.168.1.9:3000/api';
    } else {
        // Production mode - replace with your deployed backend URL
        return 'https://your-backend-url.com/api';
    }
};

export const API_URL = getApiUrl();

export const API_CONFIG = {
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
};
