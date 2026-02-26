const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
}

const sportSchema = new mongoose.Schema({
    name: String,
    sortOrder: { type: Number, default: 0 },
    isActive: Boolean
});

const Sport = mongoose.models.Sport || mongoose.model('Sport', sportSchema);

async function updateOrder() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const sports = await Sport.find({});

        // Target order: Others first, then Badminton, then Volleyball
        const bottomSports = ['Badminton', 'Volleyball'];

        // Sort others alphabetically to be deterministic
        const others = sports.filter(s => !bottomSports.some(name => s.name.toLowerCase().includes(name.toLowerCase()))).sort((a, b) => a.name.localeCompare(b.name));

        const badminton = sports.find(s => s.name.toLowerCase().includes('badminton'));
        const volleyball = sports.find(s => s.name.toLowerCase().includes('volleyball'));

        let order = 1;

        // Set order for others
        for (const sport of others) {
            console.log(`Setting ${sport.name} to order ${order}`);
            await Sport.updateOne({ _id: sport._id }, { sortOrder: order++ });
        }

        // Set order for Badminton
        if (badminton) {
            console.log(`Setting ${badminton.name} to order ${order}`);
            await Sport.updateOne({ _id: badminton._id }, { sortOrder: order++ });
        } else {
            console.warn('Badminton not found');
        }

        // Set order for Volleyball
        if (volleyball) {
            console.log(`Setting ${volleyball.name} to order ${order}`);
            await Sport.updateOne({ _id: volleyball._id }, { sortOrder: order++ });
        } else {
            console.warn('Volleyball not found');
        }

        console.log('Order updated successfully');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

updateOrder();
