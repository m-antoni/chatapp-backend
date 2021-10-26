const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        
        // const MONGO_LOCAL = 'mongodb://127.0.0.1:27017/<DB_NAME>';
        const MONGO_URI = process.env.MONGO_URI;
        
        await mongoose.connect(MONGO_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
        });

        console.log('MongoDB Connected');

    } catch (err) {
        console.log(err.message);
        // Exit process with failure
        process.exit(1);       
    }
}

module.exports = connectDB;