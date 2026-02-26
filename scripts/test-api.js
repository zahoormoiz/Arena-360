/**
 * API Verification Script
 * 
 * Usage: node scripts/test-api.js
 * 
 * Prerequisites:
 * - Server must be running on localhost:3000
 * - Database must be connected
 */

const BASE_URL = 'http://localhost:3000/api';
const COOKIE_FILE = './.cookies.json';
const fs = require('fs');

async function testApi() {
    console.log('🚀 Starting API Verification...\n');

    let authToken = null;
    let userId = null;
    let createdBookingId = null;

    // Helper for requests
    const request = async (endpoint, method = 'GET', body = null, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Cookie'] = `auth-token=${token}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const start = performance.now();
        const res = await fetch(`${BASE_URL}${endpoint}`, opts);
        const duration = Math.round(performance.now() - start);

        const data = await res.json().catch(() => ({}));
        const cookie = res.headers.get('set-cookie');

        return { status: res.status, data, duration, cookie };
    };

    // 1. Test Login
    console.log('1️⃣ Testing Login...');
    const loginRes = await request('/auth/login', 'POST', {
        email: 'admin@arena360.com', // Assuming this user exists from seed
        password: 'password123'
    });

    if (loginRes.status === 200 && loginRes.data.success) {
        console.log(`✅ Login Successful (${loginRes.duration}ms)`);
        userId = loginRes.data.user.id;
        // Extract token
        const match = loginRes.cookie.match(/auth-token=([^;]+)/);
        if (match) authToken = match[1];
    } else {
        console.error(`❌ Login Failed: ${loginRes.data.error || 'Unknown error'}`);
        // Try registering if login fails? skipped for now to keep it simple
    }

    // 2. Fetch Sports (Public API)
    console.log('\n2️⃣ Testing Public API (Sports)...');
    const sportsRes = await request('/sports');
    if (sportsRes.status === 200 && sportsRes.data.data.length > 0) {
        console.log(`✅ Sports Fetched: ${sportsRes.data.data.length} found (${sportsRes.duration}ms)`);
        var sportId = sportsRes.data.data[0]._id;
    } else {
        console.error('❌ Failed to fetch sports');
        return;
    }

    // 3. Create Booking (Logged In)
    if (authToken && sportId) {
        console.log('\n3️⃣ Testing User Booking Creation...');
        const today = new Date().toISOString().split('T')[0];
        const bookingRes = await request('/bookings', 'POST', {
            sport: sportId,
            date: today,
            startTime: '22:00', // Late slot to avoid conflicts with real bookings hopefully
            duration: 1,
            customerName: 'Test User',
            customerEmail: 'test@example.com',
            customerPhone: '03001234567'
        }, authToken);

        if (bookingRes.status === 201) {
            console.log(`✅ Booking Created (${bookingRes.duration}ms)`);
            createdBookingId = bookingRes.data.data._id;
        } else {
            console.log(`⚠️ Booking Creation Failed (Might be conflict): ${bookingRes.data.error}`);
        }
    }

    // 4. Fetch My Bookings
    if (authToken) {
        console.log('\n4️⃣ Testing "My Bookings"...');
        const myRes = await request('/bookings/my', 'GET', null, authToken);
        if (myRes.status === 200) {
            console.log(`✅ Fetched ${myRes.data.data.length} user bookings (${myRes.duration}ms)`);
            // Verify user ID match logic indirectly
        } else {
            console.error(`❌ Failed to fetch my bookings: ${myRes.status}`);
        }
    }

    // 5. Guest Booking (No Token)
    console.log('\n5️⃣ Testing Guest Booking...');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dateStr = nextWeek.toISOString().split('T')[0];

    const guestRes = await request('/bookings', 'POST', {
        sport: sportId,
        date: dateStr,
        startTime: '10:00',
        duration: 1,
        customerName: 'Guest User',
        customerEmail: 'guest@example.com',
        customerPhone: '03000000000'
    });

    if (guestRes.status === 201) {
        console.log(`✅ Guest Booking Created (${guestRes.duration}ms)`);
    } else {
        console.log(`⚠️ Guest Booking Failed: ${guestRes.data.error}`);
    }

    console.log('\n🏁 Verification Complete');
}

testApi();
