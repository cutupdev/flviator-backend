import mongoose from "mongoose";

export default function connectDB() {
    const url = "mongodb://127.0.0.1:27017";

    try {
        mongoose.connect(url, {
            dbName: "crash"
        });
    } catch (err) {
        console.error(err.message);
        return;
    }
    const dbConnection = mongoose.connection;
    dbConnection.once("open", (_) => {
        console.log(`Database connected: ${url}`);
    });

    dbConnection.on("error", (err) => {
        console.error(`connection error: ${err}`);
    });
    return;
}