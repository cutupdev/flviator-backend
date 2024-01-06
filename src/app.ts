import http from 'http'
import express from 'express'
import cors from 'cors'
import bodyParser from "body-parser";
import { Server } from 'socket.io'
import path from 'path';

import { setlog } from './helper'
import routers from './routers'
import { initSocket } from './socket'
import connectDB from './model/db';

const envUrl = process.env.NODE_ENV === 'development' ? '../.env.development' : '../.env.prod';
require('dotenv').config({ path: path.join(__dirname, envUrl) });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.on("uncaughtException", (error) => setlog('exception', error));
process.on("unhandledRejection", (error) => setlog('rejection', error));

const port = process.env.PORT || 5001;
const app = express();
const server = http.createServer(app);

try {
    connectDB()
    setlog('connected to MongoDB')
    try {
        app.use(cors({ origin: "*" }));
        app.use(express.urlencoded({ extended: true }));
        app.use(bodyParser.json({ type: "application/json" }));
        app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
        app.use(bodyParser.text({ type: "text/html" }));
        app.use("/api", routers);
        app.use(express.static(path.join(__dirname, "../build")));
        app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../build/index.html")));

        const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
        initSocket(io);

        app.set("io", io);

        server.listen({ port: port, host: '0.0.0.0' }, () => setlog(`Started HTTP service on port ${port}`));
        console.log("server successfully updated");
    } catch (error) {
        console.log('error', error)
    }
} catch (error) {
    setlog('Connection to MongoDB failed', error);
}
