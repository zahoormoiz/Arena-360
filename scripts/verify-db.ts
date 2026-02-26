
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Manually load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Import code - using dynamic imports to ensure env is loaded first
// import dbConnect from '../src/lib/db';
// import { Booking, Sport } from '../src/models';

async function main() {
    // Dynamic imports
    const { default: dbConnect } = await import('../src/lib/db');
    const { Booking, Sport } = await import('../src/models');

    console.log('🚀 Starting Verification Script...');

    try {
        await dbConnect();

        // 1. Check Sport
        let sport = await Sport.findOne({ name: 'Test Sport' });
        if (!sport) {
            console.log('Creating Test Sport...');
            sport = await Sport.create({
                name: 'Test Sport',
                image: '/images/test.jpg',
                basePrice: 100,
                description: 'A test sport'
            });
        }
        console.log('✅ Sport Verified:', sport._id);

        // 2. Create Booking
        const bookingDate = '2025-12-25'; // Future date
        const existingBooking = await Booking.findOne({ date: bookingDate, customerName: 'Verify Script' });

        if (!existingBooking) {
            console.log('Creating Test Booking...');
            await Booking.create({
                sport: sport._id, // Passing ObjectId
                date: bookingDate,
                startTime: '10:00',
                endTime: '11:00',
                duration: 1,
                customerName: 'Verify Script',
                customerPhone: '1234567890',
                amount: 100,
                status: 'confirmed'
            });
        }

        // 3. Query with Populate (Admin View Simulation)
        console.log('🔍 Testing Admin Query (Population)...');
        const adminBookings = await Booking.find({ customerName: 'Verify Script' })
            .populate('sport', 'name basePrice');

        if (adminBookings.length > 0) {
            const b = adminBookings[0];
            // Check if population worked
            if (b.sport && typeof b.sport === 'object' && 'name' in b.sport) {
                console.log('✅ Population Successful:', b.sport.name);
            } else {
                console.error('❌ Population FAILED. sport field is:', b.sport);
            }
        } else {
            console.log('⚠️ No bookings found to verify population.');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
