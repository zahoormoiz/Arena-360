const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena360';
console.log('Using URI:', MONGODB_URI.split('?')[0] + '...'); // Log partial URI for security/debug

const sports = [
    {
        name: "Indoor Cricket",
        image: "/gallery-cricket-original.jpg",
        basePrice: 2700,
        isActive: true,
        sortOrder: 1
    },
    {
        name: "Padel Tennis",
        image: "https://i.postimg.cc/LXzvQ3YB/492504973-699583945788465-3811430876632720397-n.jpg",
        basePrice: 3500,
        isActive: true,
        sortOrder: 2
    },
    {
        name: "Futsal",
        image: "https://i.postimg.cc/Kv5w8xYB/Gemini-Generated-Image-qk0as4qk0as4qk0a-(1).png",
        basePrice: 2700,
        isActive: true,
        sortOrder: 3
    }
];

async function seed() {
    try {
        console.log('Connecting to: ' + MONGODB_URI);
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to DB');

        // Check if sports exist
        const sportCount = await mongoose.connection.collection('sports').countDocuments();

        let sportsMap = {};

        if (sportCount === 0) {
            console.log('Seeding Sports...');
            const inserted = await mongoose.connection.collection('sports').insertMany(sports);
            console.log('Seeded Sports successfully: ' + inserted.insertedCount);

            // Map names to IDs for pricing rules
            Object.values(inserted.insertedIds).forEach((id, idx) => {
                sportsMap[sports[idx].name] = id;
            });
        } else {
            console.log('Sports already exist. Fetching IDs...');
            const fetched = await mongoose.connection.collection('sports').find({}).toArray();
            fetched.forEach(s => sportsMap[s.name] = s._id);
        }

        // Seed Pricing Rules
        const rules = [
            {
                sportId: sportsMap['Indoor Cricket'],
                name: 'Weekend Peak',
                type: 'weekend',
                startTime: '00:00',
                endTime: '24:00',
                priceMultiplier: 1,
                overridePrice: 3500,
                isActive: true
            },
            {
                sportId: sportsMap['Futsal'],
                name: 'Weekend Peak',
                type: 'weekend',
                startTime: '00:00',
                endTime: '24:00',
                priceMultiplier: 1,
                overridePrice: 3500,
                isActive: true
            },
            {
                sportId: sportsMap['Padel Tennis'],
                name: 'Weekend Peak',
                type: 'weekend',
                startTime: '00:00',
                endTime: '24:00',
                priceMultiplier: 1,
                overridePrice: 5000,
                isActive: true
            }
        ].filter(r => r.sportId); // Safety check

        if (rules.length > 0) {
            console.log('Seeding Pricing Rules...');
            // Clear existing rules to be safe or upsert? Let's clear for this restore task.
            await mongoose.connection.collection('pricingrules').deleteMany({});
            await mongoose.connection.collection('pricingrules').insertMany(rules);
            console.log('Seeded Pricing Rules successfully');
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error('Seed Error:', e);
        process.exit(1);
    }
}

seed();
