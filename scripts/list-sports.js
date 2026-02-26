const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing in .env.local');
    process.exit(1);
}

const sportSchema = new mongoose.Schema({
    name: String,
    sortOrder: { type: Number, default: 0 },
    isActive: Boolean
});

const Sport = mongoose.models.Sport || mongoose.model('Sport', sportSchema);

async function listSports() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const sports = await Sport.find({}).sort({ sortOrder: 1 });
        console.log('Current Sports:', sports.map(s => ({ id: s._id, name: s.name, sortOrder: s.sortOrder })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

listSports();
