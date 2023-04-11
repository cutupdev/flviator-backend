
const mongoose = require("mongoose");
require("dotenv").config();

const ConnectDatabase = async (mongoUrl) => {
    try {
        mongoose.set('strictQuery', true);
        const connectOptions = {
            autoCreate: true,
            keepAlive: true,
            retryReads: true
        };

        const result = await mongoose.connect(mongoUrl, connectOptions);
        if (result) {
            console.log('MongoDB connected');
        }
    } catch (err) {
        console.log(err);
        await ConnectDatabase(mongoUrl);
    }
};

module.exports = { ConnectDatabase }