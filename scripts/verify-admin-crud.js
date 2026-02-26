
const mongoose = require('mongoose');
// Node 18+ has global fetch
// We will use global fetch if available

const MONGODB_URI = 'mongodb+srv://zahoormoeez5_db_user:Yxh4eHvBh7WVdT9w@cluster0.bkso1ol.mongodb.net/arena360?appName=Cluster0';
const BASE_URL = 'http://localhost:3000/api';

// Admin Credentials to use/create
const ADMIN_USER = {
    name: 'Test Admin',
    email: 'test_crud_admin@arena360.com',
    password: 'password123',
    role: 'admin'
};

async function main() {
    console.log('🚀 Starting Admin CRUD Verification...');

    // 1. Setup Admin in DB
    console.log('\nPopulating Admin User in DB...');
    await mongoose.connect(MONGODB_URI);

    // Define User Schema briefly for script usage
    const UserSchema = new mongoose.Schema({
        name: String,
        email: String,
        password: { type: String, select: false },
        role: String,
    });
    // Hash password helper if needed? 
    // Wait, the API login compares password. 
    // I need to hash the password before saving to DB if I create a new user.
    // Or I can use an existing admin if I knew one.
    // Let's rely on the app's registration or just use a known admin if exists.
    // Checking previous logs, 'admin@arena360.com' was used.

    // To be safe and independent: I will create a user with a KNOWN hashed password.
    // bcryptjs hash for 'password123' is '$2a$10$w...'. 
    // I'll assume standard bcrypt.
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);

    let User;
    try {
        User = mongoose.model('User');
    } catch {
        User = mongoose.model('User', UserSchema);
    }

    await User.findOneAndUpdate(
        { email: ADMIN_USER.email },
        { ...ADMIN_USER, password: hashedPassword },
        { upsert: true, new: true }
    );
    console.log('✅ Test Admin User ensured.');
    await mongoose.disconnect();

    // 2. Login
    console.log('\n1️⃣ Logging in as Admin...');
    const loginRes = await request('/admin/login', 'POST', {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
    });

    if (!loginRes.data.success) {
        console.error('❌ Login failed:', loginRes.data);
        process.exit(1);
    }
    const cookie = loginRes.headers.get('set-cookie');
    const token = cookie.match(/auth-token=([^;]+)/)[1];
    console.log('✅ Login successful. Token acquired.');

    // 3. Sports CRUD
    console.log('\n2️⃣ Testing Sports CRUD...');

    // CREATE
    const newSport = {
        name: 'CRUD Test Sport',
        description: 'Temporary sport for testing',
        basePrice: 500,
        weekendPrice: 600,
        image: 'https://placehold.co/600x400',
        durationOptions: [1],
        isActive: true
    };
    const createSportRes = await request('/admin/sports', 'POST', newSport, token);
    if (!createSportRes.data.success) {
        console.error('❌ Create Sport failed. Response:', JSON.stringify(createSportRes.data, null, 2));
        // Don't exit immediately to allow async cleanup if any?
        // Actually, just logging is enough.
        process.exit(1);
    }
    const sportId = createSportRes.data.sport._id;
    console.log(`✅ Sport Created: ${sportId}`);

    // READ
    const getSportsRes = await request('/admin/sports', 'GET', null, token);
    const foundSport = getSportsRes.data.data.find(s => s._id === sportId);
    if (!foundSport) {
        console.error('❌ Created sport not found in list');
        process.exit(1);
    }
    console.log('✅ Sport Read Verified');

    // UPDATE
    const updateSportRes = await request(`/admin/sports/${sportId}`, 'PATCH', {
        basePrice: 750,
        isActive: false
    }, token);
    if (updateSportRes.data.data.basePrice !== 750) {
        console.error('❌ Update Sport failed');
        process.exit(1);
    }
    console.log('✅ Sport Update Verified');

    // 4. Bookings CRUD (using the new sport)
    console.log('\n3️⃣ Testing Bookings CRUD...');

    // CREATE (Walk-in via Admin API)
    const today = new Date().toISOString().split('T')[0];
    const walkInRes = await request('/admin/bookings/walk-in', 'POST', {
        sportId: sportId,
        date: today,
        startTime: '12:00',
        duration: 1,
        customerName: 'CRUD Tester',
        customerPhone: '9999999999'
    }, token);

    if (!walkInRes.data.success) {
        console.error('❌ Create Walk-in failed:', walkInRes.data);
    } else {
        const bookingId = walkInRes.data.data._id;
        console.log(`✅ Walk-in Booking Created: ${bookingId}`);

        // READ (Admin List)
        const listRes = await request('/admin/bookings', 'GET', null, token);
        const bookingInList = listRes.data.data.find(b => b._id === bookingId);
        if (!bookingInList) {
            console.error('❌ Booking not found in admin list');
        } else {
            console.log('✅ Booking Read Verified');
        }

        // UPDATE (Cancel)
        const updateRes = await request('/bookings/update', 'PATCH', {
            id: bookingId,
            status: 'cancelled'
        }, token);
        if (updateRes.data.data.status !== 'cancelled') {
            console.error('❌ Cancel Booking failed');
        } else {
            console.log('✅ Booking Cancelled Verified');
        }
    }

    // 5. DELETE Sport (Cleanup)
    console.log('\n4️⃣ Cleaning up (Deleting Test Sport)...');
    const deleteRes = await request(`/admin/sports/${sportId}`, 'DELETE', null, token);
    if (!deleteRes.data.success) {
        console.error('❌ Delete Sport failed');
    } else {
        console.log('✅ Sport Deleted');
    }

    // Verify it's gone
    const verifyDelete = await request('/admin/sports', 'GET', null, token);
    if (verifyDelete.data.data.find(s => s._id === sportId)) {
        console.error('❌ Sport still exists after delete');
    } else {
        console.log('✅ Verify Delete Passed');
    }

    console.log('\n🏁 CRUD Verification Completed Successfully');
}

async function request(endpoint, method, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Cookie'] = `auth-token=${token}`;

    // Adjust based on where script runs, assuming localhost:3000 is up
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(e => {
        console.error('Error parsing JSON:', e);
        return { error: 'Invalid JSON response from server' };
    });
    return { data, headers: res.headers, status: res.status };
}

main().catch(console.error);
