require('dotenv').config();

module.exports = {
    mongoURI: `mongodb://localhost:27017/crash?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000`
};