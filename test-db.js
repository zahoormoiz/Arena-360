const mongoose = require('mongoose');
const uri = "mongodb+srv://zahoormoeez5_db_user:Yxh4eHvBh7WVdT9w@cluster0.bkso1ol.mongodb.net/arena360?appName=Cluster0";

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).then(() => {
    console.log("Connected successfully!");
    process.exit(0);
}).catch(err => {
    console.error("Connection failed:", err.message);
    process.exit(1);
});
