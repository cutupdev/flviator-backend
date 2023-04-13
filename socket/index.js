const uniqid = require("uniqid");
const { getTime } = require("../math");
const HistoryController = require("../controllers/historyController");
const UserController = require("../controllers/userController");

let mysocketIo;
let sockets = [];
let users = [];
let previousHand = users;
let history = [];
let GameState = "BET";
const READYTIME = 1000;
const BETINGTIME = 5000;
const GAMEENDTIME = 3000;
let startTime = Date.now();
let gameTime;
let currentNum;
let currentSecondNum;
let info = [];
let target;
let interval;
let botIds = [];

module.exports = (io) => {
    mysocketIo = io;
    io.on("connection", async (socket) => {
        console.log("new User connected:" + socket.id);
        gameRun();
        sockets.push(socket);
        // try {
        socket.on("disconnect", () => {
            console.log("socket disconnected " + socket.id);
        })
        socket.on("enterRoom", async (data) => {
            console.log("New User Create");
            let userData = await UserController.find({ "name": data.myToken });
            if (userData.length === 0) {
                await UserController.create({
                    name: data.myToken,
                    balance: 5000,
                    img: "av-5.png"
                })
            }
            users[data.token] = {
                betted: false,
                cashouted: false,
                auto: false,
                name: data.myToken,
                betAmount: 0,
                balance: userData.length > 0 ? userData[0].balance : 5000,
                cashAmount: 0,
                target: 0,
                socketId: socket.id,
                type: data.type,
                img: userData.length > 0 ? userData[0].img : ""
            }
            sendInfo();
            socket.emit("myInfo", users[data.token]);
            mysocketIo.emit("history", { history: history });
        })
        socket.on("playBet", async (data) => {
            if (GameState === "BET") {
                if (users[data.token]) {
                    console.log(users[data.token].name);
                    let result = await UserController.find({ name: users[data.token].name });
                    let balance = result[0].balance - data.betAmount;
                    if (balance >= 0) {
                        await UserController.update({ filter: { name: users[data.token].name }, opt: { balance: balance } });
                        users[data.token].betAmount = data.betAmount;
                        users[data.token].betted = true;
                        users[data.token].balance = balance;
                        users[data.token].auto = data.auto;
                        users[data.token].target = data.target;
                        socket.emit("myBetState", users[data.token]);
                        sendInfo();
                    } else {
                        socket.emit("error", "Your balance is not enough!");
                    }
                }
            } else {
                socket.emit("error", "You can't bet. Try again at next round!");
            }
        })
        socket.on("cashOut", async (data) => {
            if (!users[data.token].cashouted && users[data.token].betted) {
                if (data.at <= currentSecondNum) {
                    let result = await UserController.find({ name: users[data.token].name });
                    let balance = result[0].balance + data.at * users[data.token].betAmount;
                    await UserController.update({ filter: { name: users[data.token].name }, opt: { balance: balance } });
                    users[data.token].cashouted = true;
                    users[data.token].cashAmount = data.at * users[data.token].betAmount;
                    users[data.token].betted = false;
                    users[data.token].balance = balance;
                    users[data.token].target = data.at;
                    socket.emit("finishGame", users[data.token]);
                    socket.emit("success", `Successfully CashOuted ${Number(users[data.token].cashAmount).toFixed(2)}`)
                    sendInfo();
                }
            }
        })
        setInterval(() => {
            const time = Date.now() - startTime;
            socket.broadcast.emit("gameState", { currentNum, currentSecondNum, GameState, time });
        }, 20);
    });
};

for (var i = 0; i < 100; i++) {
    botIds.push(uniqid());
}

const gameRun = () => {

    if (interval) {
        clearInterval(interval);
    }
    interval = setInterval(async () => {
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
                var currentTime = (Date.now() - startTime) / 1000;
                currentNum = 1 + 0.06 * currentTime + Math.pow((0.06 * currentTime), 2) - Math.pow((0.04 * currentTime), 3) + Math.pow((0.04 * currentTime), 4)
                currentSecondNum = currentNum;
                if (currentTime > gameTime) {
                    sendPreviousHand();
                    currentSecondNum = 0;
                    currentNum = target;
                    GameState = "GAMEEND";
                    startTime = Date.now();
                    for (let i in users) {
                        if (!users[i].bot) {
                            if (users[i].betted || users[i].cashouted) {
                                let data = {
                                    name: users[i].name,
                                    betAmount: users[i].betAmount,
                                    cashoutAt: users[i].target,
                                    cashouted: users[i].cashouted,
                                    date: Date.now(),
                                }
                                await HistoryController.create(data);
                            }
                            users[i].betted = false;
                            users[i].cashouted = false;
                            users[i].betAmount = 0;
                            users[i].cashAmount = 0;
                            sockets.map((socket) => {
                                if (socket.id === users[i].socketId) {
                                    socket.emit("finishGame", users[i]);
                                }
                            })
                        }
                    }
                    botIds.map((item) => {
                        users[item] = {
                            betted: false,
                            cashouted: false,
                            betAmount: 0,
                            cashAmount: 0,
                        }
                    })
                    sendInfo();
                }
                break;
            case "GAMEEND":
                if (Date.now() - startTime > GAMEENDTIME) {
                    for (let i = 0; i < 100; i++) {
                        bet(botIds[i]);
                    }
                    startTime = Date.now();
                    GameState = "BET";
                    info = [];
                    history.unshift(target);
                    mysocketIo.emit("history", { history: history });
                }
                break;
        }
    }, 20)
}

setInterval(() => {
    if (GameState === "PLAYING") {
        botIds.map((item) => {
            if (users[item] && users[item].target <= currentNum) {
                if (users[item].betted) {
                    cashOut(item);
                }
            }
        })
    }
}, 100);

const getRandom = () => {
    var r = Math.random();
    target = 1 / r;
    console.log(target);
    var time = getTime(target);
    return time;
}

const sendInfo = () => {
    info = [];
    for (let i in users) {
        if (users[i] && users[i].betted || users[i].cashouted) {
            info.push({
                name: users[i].name,
                betAmount: users[i].betAmount,
                cashOut: users[i].cashAmount,
                cashouted: users[i].cashouted,
                target: users[i].target,
                img: users[i].img
            })
        }
    }
    mysocketIo.emit("bettedUserInfo", info);
}

const sendPreviousHand = () => {
    let myPreHand = [];
    for (let i in previousHand) {
        if (previousHand[i].betted || previousHand[i].cashouted)
            myPreHand.push(previousHand[i]);
    }
    mysocketIo.emit("previousHand", myPreHand);
}

function bet(id) {
    let betAmount = (Math.random() * 1000) + 1
    let target = (Math.random() * (1 / Math.random() - 0.01)) + 1.01
    users[id] = {
        betted: true,
        cashouted: false,
        name: id,
        socketId: id,
        bot: true,
        betAmount: betAmount,
        cashAmount: 0,
        target: target,
    }
    sendInfo();
}

function cashOut(id) {
    users[id].cashouted = true;
    users[id].cashAmount = users[id].target * users[id].betAmount;
    users[id].betted = false;
    sendInfo();
}