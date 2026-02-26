const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arena360';

async function fixImages() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const updates = [
            { name: "Indoor Cricket", image: "/gallery-cricket-original.jpg" },
            { name: "Padel Tennis", image: "https://i.postimg.cc/LXzvQ3YB/492504973-699583945788465-3811430876632720397-n.jpg" },
            { name: "Futsal", image: "https://i.postimg.cc/Kv5w8xYB/Gemini-Generated-Image-qk0as4qk0as4qk0a-(1).png" }
        ];

        for (const update of updates) {
            const res = await mongoose.connection.collection('sports').updateOne(
                { name: update.name },
                { $set: { image: update.image } }
            );
            console.log(`Updated ${update.name}: ${res.modifiedCount} matches`);
        }

        console.log('Done!');
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

fixImages();
