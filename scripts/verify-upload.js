
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

// Admin Credentials
const ADMIN_EMAIL = 'test_crud_admin@arena360.com'; // Using user created by verify-admin-crud.js
const ADMIN_PASSWORD = 'password123';

async function main() {
    console.log('🚀 Starting Upload Verification...');

    // 1. Login
    console.log('\n1️⃣ Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!loginRes.ok) {
        console.error('❌ Login failed:', await loginRes.text());
        process.exit(1);
    }

    const cookie = loginRes.headers.get('set-cookie');
    const token = cookie.match(/auth-token=([^;]+)/)[1];
    console.log('✅ Login successful.');

    // 2. Prepare File
    console.log('\n2️⃣ Preparing Test File...');
    const testFilePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testFilePath, 'This is a test image content for upload verification.');

    // 3. Upload File
    console.log('\n3️⃣ Uploading File...');
    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(testFilePath)], { type: 'text/plain' });
    formData.append('file', fileBlob, 'test-image.txt');

    const uploadRes = await fetch(`${BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
            'Cookie': `auth-token=${token}`
        },
        body: formData
    });

    if (!uploadRes.ok) {
        console.error('❌ Upload Request failed:', await uploadRes.text());
        process.exit(1);
    }

    const data = await uploadRes.json();
    if (!data.success || !data.url) {
        console.error('❌ Upload failed response:', data);
        process.exit(1);
    }

    console.log(`✅ Upload Successful. URL: ${data.url}`);

    // 4. Verify File Exists
    console.log('\n4️⃣ Verifying File Existence...');
    const publicPath = path.join(__dirname, '../public', data.url);
    if (fs.existsSync(publicPath)) {
        console.log('✅ File exists on disk.');
    } else {
        console.error(`❌ File not found at ${publicPath}`);
        process.exit(1);
    }

    // Cleanup
    fs.unlinkSync(testFilePath);
    fs.unlinkSync(publicPath); // Optional: clean up upload
    console.log('✅ Cleanup done.');

    console.log('\n🏁 Upload Verification Complete');
}

main().catch(console.error);
