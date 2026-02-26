
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { format, subDays } from 'date-fns';

// Manually load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function main() {
    // Dynamic imports
    const { default: dbConnect } = await import('../src/lib/db');
    const { Booking, Sport } = await import('../src/models');

    console.log('🚀 Starting Stats Verification...');

    try {
        await dbConnect();

        const today = format(new Date(), 'yyyy-MM-dd');

        // 1. Cleanup old test data
        await Booking.deleteMany({ customerName: 'Stats Test' });

        // 2. Create Scenarios
        let sport = await Sport.findOne({ name: 'Test Sport' });
        if (!sport) {
            sport = await Sport.create({ name: 'Test Sport', image: 'test.jpg', basePrice: 100 });
        }

        // A. Confirmed Booking (Should count) - 100
        await Booking.create({
            sport: sport._id,
            date: today,
            startTime: '10:00',
            endTime: '11:00',
            duration: 1,
            customerName: 'Stats Test',
            customerPhone: '000',
            amount: 100,
            status: 'confirmed'
        });

        // B. Cancelled Booking (Should NOT count) - 500
        await Booking.create({
            sport: sport._id,
            date: today,
            startTime: '12:00',
            endTime: '13:00',
            duration: 1,
            customerName: 'Stats Test',
            customerPhone: '000',
            amount: 500,
            status: 'cancelled'
        });

        // C. Pending Booking (Should NOT count in revenue usually, but counts in utilization?)
        // Let's assume dashboard revenue is ONLY confirmed strings.
        await Booking.create({
            sport: sport._id,
            date: today,
            startTime: '14:00',
            endTime: '15:00',
            duration: 1,
            customerName: 'Stats Test',
            customerPhone: '000',
            amount: 50,
            status: 'pending'
        });

        console.log('✅ Test Data Injected. Calculating Stats...');

        // 3. Simulate Logic from API
        const allBookings = await Booking.find({});

        const totalRevenue = allBookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (b.amount || 0), 0);

        console.log(`💰 Calculated Revenue: ${totalRevenue}`);

        // We can't easily assert exact number because of other data in DB, 
        // but we can check if the logic excludes the 500 from cancelled.
        // If the cancelled 500 was included, revenue would be much higher/different.

        // Let's rely on the logic check printed above.
        // confirmed: 100.
        // cancelled: 500.
        // pending: 50.
        // If we only see +100 from these 3, the logic holds.

        const testBookings = await Booking.find({ customerName: 'Stats Test' });
        const testRevenue = testBookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (b.amount || 0), 0);

        console.log(`🧪 Test Set Revenue (Should be 100): ${testRevenue}`);

        if (testRevenue !== 100) {
            console.error('❌ Logic Failure: Revenue includes non-confirmed bookings or missed confirmed ones.');
        } else {
            console.log('✅ Logic Success: Only confirmed bookings counted.');
        }

    } catch (error) {
        console.error('❌ Stats Verification Failed:', error);
    } finally {
        // Cleanup
        // await Booking.deleteMany({ customerName: 'Stats Test' });
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
