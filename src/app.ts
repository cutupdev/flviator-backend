import http from 'http'
import express from 'express'
import cors from 'cors'
import bodyParser from "body-parser";
import { Server } from 'socket.io'
import path from 'path';

import { setlog } from './helper'
import { connect } from './model'
import routers from './routers'
import { initSocket } from './socket'
import { config } from "dotenv";

const envUrl = process.env.NODE_ENV === 'development' ? '../../.env.development' : '../../.env.prod'; 
config({ path: path.join(__dirname, envUrl) });
require('dotenv').config({ path: path.join(__dirname, envUrl) });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.on("uncaughtException", (error) => setlog('exception', error));
process.on("unhandledRejection", (error) => setlog('rejection', error));

// const router = express.Router();

// ConnectDatabase(config.mongoURI);

// let botIds = [];

// for (var i = 0; i < 100; i++) {
//     var id = uniqid();
//     botIds.push(id);
// }

const port = process.env.PORT || 5001;
const app = express();
const server = http.createServer(app);
// const socket = require("./socket/index.js");


connect().then(async loaded => {
    if (loaded === true) {
        setlog('connected to MongoDB')

        app.use(cors({ origin: "*" }));
        app.use(express.urlencoded({ extended: true }));
        // app.use("/api", routers);
        app.use(bodyParser.json({ type: "application/json" }));
        app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
        app.use(bodyParser.text({ type: "text/html" }));
        app.use("/api", routers);
        app.get("*", (req, res) => res.sendFile(__dirname + "/build/index.html"));

        const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
        initSocket(io);

        app.set("io", io);

        server.listen({ port: port, host: '0.0.0.0' }, () => setlog(`Started HTTP service on port ${port}`));
        console.log("server successfully updated");
    } else {
        setlog('Connection to MongoDB failed', loaded);
    }
})
