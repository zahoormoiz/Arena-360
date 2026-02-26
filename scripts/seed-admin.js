const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena360';

async function seedAdmin() {
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to DB');

        const hashedPassword = await bcrypt.hash('adminarena9361', 10);

        const result = await mongoose.connection.collection('users').updateOne(
            { email: 'admin1@arena360.com' },
            {
                $set: {
                    name: 'admin1',
                    email: 'admin1@arena360.com',
                    password: hashedPassword,
                    role: 'admin',
                    phone: '',
                    updatedAt: new Date()
                },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        console.log(result.upsertedCount ? '✅ Admin user created!' : '✅ Admin user updated!');
        console.log('Email: admin1@arena360.com');
        console.log('Password: 9361');

        await mongoose.disconnect();
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

seedAdmin();
