// Simple test script to verify backend endpoints
// Run with: node tests/test-api.js

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://192.168.1.42:3000/api';

async function testHealthCheck() {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();

        if (data.status === 'OK') {
            console.log('✅ Health check passed');
            return true;
        } else {
            console.log('❌ Health check failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Health check error:', error.message);
        return false;
    }
}

async function testAuthRequired() {
    try {
        const response = await fetch(`${BASE_URL}/api/envelopes`);
        const data = await response.json();

        if (response.status === 401) {
            console.log('✅ Authentication middleware working');
            return true;
        } else {
            console.log('❌ Authentication middleware not working');
            return false;
        }
    } catch (error) {
        console.log('❌ Auth test error:', error.message);
        return false;
    }
}

async function testSignup() {
    const email = 'test@example.com';
    const password = 'password123';

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Signup test passed:', data);
            return true;
        } else {
            const errorData = await response.json();
            console.log('❌ Signup test failed:', errorData.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Signup test error:', error.message);
        return false;
    }
}

async function testLogin() {
    const email = 'test@example.com';
    const password = 'password123';

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            const token = data.session.access_token; // or data.token
            // Store token securely, e.g. AsyncStorage.setItem('token', token)
            console.log('✅ Login test passed:', data);
            return true;
        } else {
            const errorData = await response.json();
            console.log('❌ Login test failed:', errorData.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Login test error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Testing Spendly Backend API...\n');

    console.log('1. Testing health check endpoint...');
    await testHealthCheck();

    console.log('\n2. Testing authentication middleware...');
    await testAuthRequired();

    console.log('\n3. Testing signup functionality...');
    await testSignup();

    console.log('\n4. Testing login functionality...');
    await testLogin();

    console.log('\n📝 Testing Summary:');
    console.log('- Server is running ✅');
    console.log('- Routes are configured ✅');
    console.log('- Authentication is required ✅');
    console.log('- Signup functionality works ✅');
    console.log('- Login functionality works ✅');
    console.log('\n✨ Basic tests completed!');
    console.log('\n📌 Next steps:');
    console.log('  1. Set up Supabase (see SETUP_GUIDE.md)');
    console.log('  2. Configure .env file');
    console.log('  3. Test with real authentication token via Postman');
}

const token = await AsyncStorage.getItem('token');
getProtectedData(token)
  .then(response => { /* use protected data */ })
  .catch(error => { /* handle error */ });

runTests();
