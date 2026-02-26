const BASE_URL = 'http://localhost:3000/api';

async function testBookingFlow() {
    console.log('1. Checking Health...');
    try {
        const health = await fetch(`${BASE_URL}/health`).then(res => res.json());
        console.log('Health:', health);
    } catch (e) {
        console.error('Server not running or unreachable');
        return;
    }

    // 1. Get a sport ID
    console.log('\n2. Fetching Sports...');
    const sportsRes = await fetch(`${BASE_URL}/sports`);
    const sportsData = await sportsRes.json();
    if (!sportsData.success || sportsData.data.length === 0) {
        console.error('No sports found');
        return;
    }
    const sport = sportsData.data[0];
    console.log(`Selected Sport: ${sport.name} (${sport._id})`);

    // 2. Check Availability
    const date = '2025-05-20'; // Future date
    console.log(`\n3. Checking Availability for ${date}...`);
    const availRes = await fetch(`${BASE_URL}/availability?date=${date}&sportId=${sport._id}`);
    const availData = await availRes.json();
    console.log('Slots available:', availData.data.length > 0);

    if (availData.data.length === 0) {
        console.log('No slots to test booking');
        return;
    }
    const slotObj = availData.data.find(s => s.status === 'available');
    if (!slotObj) {
        console.log('No available slots to test booking');
        return;
    }
    const slot = slotObj.startTime;
    console.log(`Target Slot: ${slot}`);

    // 3. Create a Guest Booking
    console.log(`\n4. Creating Guest Booking...`);
    const bookingPayload = {
        sport: sport._id,
        date: date,
        startTime: slot,
        duration: 1,
        customerName: 'Test QA Bot',
        customerEmail: 'qa@test.com',
        customerPhone: '1234567890',
        amount: sport.basePrice
    };

    const bookRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
    });
    const bookData = await bookRes.json();

    if (bookData.success) {
        console.log('Booking Created:', bookData.data._id);
    } else {
        console.error('Booking Failed Details:', JSON.stringify(bookData, null, 2));
        return;
    }

    // 4. Verify Slot is now taken
    console.log(`\n5. Verifying Availability after booking...`);
    const availRes2 = await fetch(`${BASE_URL}/availability?date=${date}&sportId=${sport._id}`);
    const availData2 = await availRes2.json();
    const targetSlotAfter = availData2.data.find(s => s.startTime === slot);
    const isBooked = targetSlotAfter && targetSlotAfter.status === 'booked';
    console.log(`Slot ${slot} is booked? ${isBooked} (Expected: true)`);

    // 5. Cleanup (Optional, but good for idempotent tests if we had delete API public)
    // Since we don't have public delete, we'll leave it or manually delete if we had admin access script.
    // For now, determining success is enough.
}

testBookingFlow();
