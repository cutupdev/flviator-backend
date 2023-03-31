const axios = require("axios");
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var express = require("express");
require("dotenv").config();
var app = express();
var cors = require("cors");
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { getTime } = require("./math");
let sockets = [];
let users = [];
let history = [];

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/build"));

app.get('/*', function (req, res) {
    res.sendFile(__dirname + '/build/index.html', function (err) {
        if (err) {
            res.status(500).send(err)
        }
    })
})

server.listen(5001, function () {
    console.log("listening --- server is running ...");
});
let GameState = "BET";
axios.defaults.headers.common["Authorization"] = process.env.SECRETCODE;

const READYTIME = 1000;
const BETINGTIME = 5000;
const GAMEENDTIME = 3000;
let startTime = Date.now();
let gameTime;
let currentNum;
let currentSecondNum;
let info = [];
let target;
// here is game playing
setInterval(() => {
    switch (GameState) {
        case "BET":
            if (Date.now() - startTime > BETINGTIME) {
                currentNum = 1;
                GameState = "READY";
                startTime = Date.now();
                gameTime = getRandom();
            }
            break;
        case "READY":
            if (Date.now() - startTime > READYTIME) {
                GameState = "PLAYING";
                startTime = Date.now();
            }
            break;
        case "PLAYING":
            var currentTime = (Date.now() - startTime) / 1000
            currentNum = 1 + 0.06 * currentTime + Math.pow((0.06 * currentTime), 2) - Math.pow((0.04 * currentTime), 3) + Math.pow((0.04 * currentTime), 4)
            currentSecondNum = currentNum;
            if (currentTime > gameTime) {
                currentSecondNum = 0;
                currentNum = target
                GameState = "GAMEEND";
                startTime = Date.now();
                sockets.map((socket) => {
                    if (users[socket.id]) {
                        users[socket.id].betted = false;
                        users[socket.id].cashouted = false;
                        users[socket.id].betamount = 0;
                        users[socket.id].cashAmount = 0;
                        socket.emit("betState", users[socket.id]);
                    }
                })
                info = [];
                sockets.map((mySocket) => {
                    if (users[mySocket.id] && users[mySocket.id].betted) {
                        info.push({
                            username: users[mySocket.id].name,
                            betAmount: users[mySocket.id].betamount,
                            cashOut: users[mySocket.id].cashAmount,
                            target: users[mySocket.id].target,
                            cashouted: users[mySocket.id].cashouted
                        })
                    }
                })
                io.emit("bettedUserInfo", info);
            }
            break;
        case "GAMEEND":
            if (Date.now() - startTime > GAMEENDTIME) {
                startTime = Date.now();
                GameState = "BET";
                info = [];

                history.push(target);
                if (history.length > 18) {
                    var data = history.slice(1, history.length);
                    history = data;
                    io.emit("history", { history: data });
                } else {
                    io.emit("history", { history: history });
                }

                // sockets.map((socket) => {
                // });

            }
            break;
    }

}, 20)

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// // Implement socket functionality
io.on("connection", function (socket) {
    sockets.push(socket);
    console.log("socket connected: " + socket.id);
    try {
        socket.on("disconnect", function () {
            console.log("socket disconnected: " + socket.id);
        });
        socket.on("enterRoom", (data) => {
            users[socket.id] = {
                betted: false,
                cashouted: false,
                name: data.name,
                betamount: 0,
                balance: 3000,
                cashAmount: 0,
                auto: false,
                target: 0
            };
            info = [];
            sockets.map((mySocket) => {
                if (users[mySocket.id] && users[mySocket.id].betted) {
                    info.push({
                        username: users[mySocket.id].name,
                        betAmount: users[mySocket.id].betamount,
                        cashOut: users[mySocket.id].cashAmount,
                        target: users[mySocket.id].target,
                        cashouted: users[mySocket.id].cashouted
                    })
                }
            })
            io.emit("bettedUserInfo", info);
            socket.broadcast.emit("userInfo", users);
            io.emit("history", { history: history });
        })

        socket.on("playerBet", (data) => {
            if (GameState === "BET") {
                if (users[socket.id].balance - data.betamount >= 0) {
                    users[socket.id].betamount = data.betamount;
                    users[socket.id].betted = true;
                    users[socket.id].balance -= data.betamount;
                    users[socket.id].auto = data.auto;
                    socket.emit("betState", users[socket.id]);
                    info = [];
                    sockets.map((mySocket) => {
                        if (users[mySocket.id] && users[mySocket.id].betted) {
                            info.push({
                                username: users[mySocket.id].name,
                                betAmount: users[mySocket.id].betamount,
                                cashOut: users[mySocket.id].cashAmount,
                                target: users[mySocket.id].target,
                                cashouted: users[mySocket.id].cashouted
                            })
                        }
                    })
                    io.emit("bettedUserInfo", info);
                }
            } else {
                socket.emit("betState", false);
            }
        });

        socket.on("cashout", (data) => {
            if (!users[socket.id].cashouted && users[socket.id].betted) {
                if (data.num <= currentSecondNum) {
                    users[socket.id].cashouted = true;
                    users[socket.id].cashAmount = data.num * users[socket.id].betamount;
                    users[socket.id].betted = false;
                    users[socket.id].balance += data.num * users[socket.id].betamount;
                    users[socket.id].target = data.num;

                    socket.emit("betFinish", users[socket.id]);
                    info = [];
                    sockets.map((mySocket) => {
                        if (users[mySocket.id]) {
                            console.log(users[mySocket.id]);
                            if (users[mySocket.id].betted || users[mySocket.id].cashouted) {
                                info.push({
                                    username: users[mySocket.id].name,
                                    betAmount: users[mySocket.id].betamount,
                                    cashOut: users[mySocket.id].cashAmount,
                                    target: users[mySocket.id].target,
                                    cashouted: users[mySocket.id].cashouted
                                })
                            }
                        }
                    })
                    io.emit("bettedUserInfo", info);
                }
            }
        });

        setInterval(() => {
            var time = Date.now() - startTime;
            socket.broadcast.emit("crash", { currentNum, GameState, time, });
        }, 100);

    } catch (err) {
        socket.emit("error message", { "errMessage": err.message })
    }
});

function getRandom() {
    var r = Math.random();
    target = 1 / r;

    console.log(target);
    var time = getTime(target);
    return time;
}
