import { Server, Socket } from 'socket.io'
import uniqid from 'uniqid'
import { getTime } from "../math"
import { DUsers, addHistory, addUser, getBettingAmounts, updateUserBalance } from '../model'
import { setlog } from '../helper'

// const HistoryController = require("../controllers/historyController");
// const UserController = require("../controllers/userController");
// const GameController = require("../controllers/gameController");

interface UserType {
    auto: boolean
    betted: boolean
    cashouted: boolean
    name: string
    socketId: string
    bot: boolean
    betAmount: number
    cashAmount: number
    target: number
    balance: number
    type: string
    img: string
}

const DEFAULT_USER = {
    betted: false,
    cashouted: false,
    auto: false,
    bot: false,
    name: '',
    betAmount: 0,
    balance: 0,
    cashAmount: 0,
    target: 0,
    socketId: '',
    type: '',
    img: ''
}

let mysocketIo: Server;
let sockets = [] as Socket[];
let users = {} as { [key: string]: UserType }
let previousHand = users;
let history = [] as number[];
let GameState = "BET";
const READYTIME = 1000;
const BETINGTIME = 5000;
const GAMEENDTIME = 3000;
let startTime = Date.now();
let gameTime: number;
let currentNum: number;
let currentSecondNum: number;
let info = [];
let target: number;
let RTP = 5;
let cashoutAmount = 0;
let totalBetAmount = 0;

let interval: NodeJS.Timer;
let botIds = [] as string[];



// const gameInfo = async () => {

//     let gameInfo = await GameController.find();

//     if (gameInfo.length === 0) {
//         GameController.create({
//             minBetAmount: 0.1,
//             maxBetAmount: 1000
//         })
//     }

// }

// gameInfo();



const initBots = () => {
    for (var i = 0; i < 20; i++) {
        botIds.push(uniqid());
    }
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
                let RTPAmount = cashoutAmount / totalBetAmount * 100;
                if (RTPAmount >= RTP)
                    target = currentNum;
                if (currentTime > gameTime || RTPAmount >= RTP) {
                    sendPreviousHand();
                    currentSecondNum = 0;
                    currentNum = target;
                    GameState = "GAMEEND";
                    totalBetAmount = 0;
                    cashoutAmount = 0;
                    startTime = Date.now();
                    for (const k in users) {
                        const i = users[k]
                        if (!i.bot) {
                            if (i.betted || i.cashouted) {
                                await addHistory(i.name, i.betAmount, i.target, i.cashouted)
                            }
                            i.betted = false;
                            i.cashouted = false;
                            i.betAmount = 0;
                            i.cashAmount = 0;
                            sockets.map((socket) => {
                                if (socket.id === i.socketId) {
                                    socket.emit("finishGame", i);
                                }
                            })
                        }
                    }
                    botIds.map((item) => {
                        users[item] = { ...DEFAULT_USER, bot: true, auto: true }

                        //     betted: false,
                        //     cashouted: false,
                        //     betAmount: 0,
                        //     cashAmount: 0,
                        // }
                    })
                    sendInfo();
                }
                break;
            case "GAMEEND":
                if (Date.now() - startTime > GAMEENDTIME) {
                    for (let i = 0; i < 20; i++) {
                        bet(botIds[i]);
                    }
                    startTime = Date.now();
                    GameState = "BET";
                    info = [];
                    history.unshift(target);
                    mysocketIo.emit("history", history);
                }
                break;
        }
    }, 20)
}

setInterval(() => {
    if (GameState === "PLAYING") {
        const _bots = botIds.filter(k => users[k] && users[k].target <= currentNum && users[k].betted)
        if (_bots.length) {
            for (let k of _bots) {
                users[k].cashouted = true;
                users[k].cashAmount = users[k].target * users[k].betAmount;
                users[k].betted = false;

                cashoutAmount = users[k].target * users[k].betAmount;
            }
            sendInfo()
        }
    }
}, 500);

const getRandom = () => {
    var r = Math.random();
    target = 1 / r;
    console.log(target);
    var time = getTime(target);
    return time;
}

const sendInfo = () => {
    const info = [] as Array<{
        name: string
        betAmount: number
        cashOut: number
        cashouted: boolean
        target: number
        img: string
    }>

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
    if (info.length) mysocketIo.emit("bettedUserInfo", info);
}

const sendPreviousHand = () => {
    let myPreHand = [] as UserType[];
    for (let i in previousHand) {
        if (previousHand[i].betted || previousHand[i].cashouted)
            myPreHand.push(previousHand[i]);
    }
    mysocketIo.emit("previousHand", myPreHand);
}

function bet(id: string) {
    let betAmount = (Math.random() * 1000) + 1
    let target = (Math.random() * (1 / Math.random() - 0.01)) + 1.01
    users[id] = {
        ...DEFAULT_USER,
        betted: true,
        cashouted: false,
        name: id,
        socketId: id,
        bot: true,
        betAmount: betAmount,
        cashAmount: 0,
        target: target,
    }
    totalBetAmount += betAmount;
    sendInfo();
}

export const initSocket = (io: Server) => {
    // create bots
    initBots()

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
            const betting = await getBettingAmounts()
            socket.emit("getBetLimits", { max: betting.maxBetAmount, min: betting.minBetAmount });
            let userData = await DUsers.findOne({ "name": data.myToken });
            if (!userData) {
                await addUser(data.myToken, 5000, "av-5.png")
            }
            users[data.token] = {
                ...DEFAULT_USER,
                name: data.myToken,
                balance: userData?.balance || 5000,
                cashAmount: 0,
                target: 0,
                socketId: socket.id,
                type: data.type,
                img: userData?.img || ""
            }
            sendInfo();
            socket.emit("myInfo", users[data.token]);
            mysocketIo.emit("history", history);
        })
        socket.on("playBet", async (data) => {
            if (GameState === "BET") {
                const u = users[data.token]

                if (u) {
                    let d = await DUsers.findOne({ name: u.name });
                    if (!!d) {
                        const { minBetAmount, maxBetAmount } = await getBettingAmounts()
                        let balance = d.balance - data.betAmount;
                        if (data.betAmount >= minBetAmount && data.betAmount <= maxBetAmount) {
                            if (data.betAmount >= 0) {
                                totalBetAmount += data.betAmount;
                                await updateUserBalance(u.name, balance)
                                u.betAmount = data.betAmount;
                                u.betted = true;
                                u.balance = balance;
                                u.auto = data.auto;
                                u.target = data.target;
                                socket.emit("myBetState", u);
                                sendInfo();
                            } else {
                                socket.emit("error", "Your balance is not enough!");
                            }
                        } else {
                            socket.emit("error", "Your bet Amount is not correct");
                        }
                    } else {
                        setlog("undefined user", u.name)
                    }
                }
            } else {
                socket.emit("error", "You can't bet. Try again at next round!");
            }
        })
        socket.on("cashOut", async (data) => {
            const u = users[data.token]
            if (!!u) {
                if (!u.cashouted && u.betted) {
                    if (data.at <= currentSecondNum) {
                        let d = await DUsers.findOne({ name: u.name });
                        if (!!d) {
                            cashoutAmount += data.at * u.betAmount;
                            let balance = d.balance + data.at * u.betAmount;
                            await updateUserBalance(u.name, balance)
                            u.cashouted = true;
                            u.cashAmount = data.at * u.betAmount;
                            u.betted = false;
                            u.balance = balance;
                            u.target = data.at;
                            socket.emit("finishGame", u);
                            socket.emit("success", `Successfully CashOuted ${Number(u.cashAmount).toFixed(2)}`)
                            sendInfo();
                        } else {
                            setlog("undefined user", u.name)
                        }
                    }
                }
            } else {
                setlog("undefined user", data.token)
            }

        })
        setInterval(() => {
            const time = Date.now() - startTime;
            io.emit("gameState", { currentNum, currentSecondNum, GameState, time });
        }, 50);
    });
};