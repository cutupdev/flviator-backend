import { Server, Socket } from 'socket.io'
import uniqid from 'uniqid'

import { getTime } from "../math"
import { addHistory } from '../model'
// import { getUserInfo, bet, settle, cancelBet } from '../controllers/client';

import config from "../config.json";
import { copyObject } from '../util';
import crypto from 'crypto';
import path from 'path';

const envUrl = process.env.NODE_ENV ? (process.env.NODE_ENV === 'development' ? '../.env.development' : '.env.' + process.env.NODE_ENV) : '.env.test';
require('dotenv').config({ path: path.join(__dirname, envUrl) });

interface UserType {
    userId: number
    userName: string
    balance: number
    avatar: string
    token: string
    bot: boolean
    userType: boolean
    img: string
    orderNo: number
    socketId: string
    f: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        betAmount: number
        cashAmount: number
        target: number
    }
    s: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        betAmount: number
        cashAmount: number
        target: number
    }
}

interface preHandType {
    img: string
    userName: string
    betted: boolean
    cashouted: boolean
    betAmount: number
    cashAmount: number
    target: number
}

const DEFAULT_USER = {
    userId: 0,
    userName: 'test',
    balance: 0,
    avatar: '',
    token: '',
    img: '',
    orderNo: 0,
    socketId: '',
    f: {
        auto: false,
        betted: false,
        cashouted: false,
        betAmount: 0,
        cashAmount: 0,
        target: 0,
    },
    s: {
        auto: false,
        betted: false,
        cashouted: false,
        betAmount: 0,
        cashAmount: 0,
        target: 0,
    },
    bot: false,
    userType: true
}

let mysocketIo: Server;
let users = {} as { [key: string]: UserType }
let sockets = [] as Socket[];
let previousHand = users;
let history = [] as number[];
let GameState = "BET";
let NextGameState = "READY";
let NextState = "READY";
const READYTIME = 1000;
const BETINGTIME = 5000;
const GAMEENDTIME = 3000;
let startTime = Date.now();
let gameTime: number;
let currentNum: number;
let currentSecondNum: number;
let target: number = -1;
const RTP = config.RTP;
let cashoutAmount = 0;
let totalBetAmount = 0;

let interval: NodeJS.Timeout;
let botIds = [] as string[];
// const diffLimit = 9; // When we lost money, decrease RTP by this value, but be careful, if this value is high, the more 1.00 x will appear and users might complain.
const diffLimit = 3; // When we lost money, decrease RTP by this value, but be careful, if this value is high, the more 1.00 x will appear and users might complain.
const salt = process.env.SALT || '8783642fc5b7f51c08918793964ca303edca39823325a3729ad62f0a2';

var botNum = Math.floor(Math.random() * 15);

const initBots = () => {
    for (var i = 0; i < botNum; i++) {
        botIds.push(`${uniqid()}`);
    }
}

const gameRun = async () => {
    setTimeout(() => {
        gameRun();
    }, 20)

    switch (GameState) {
        case "BET":
            if (target == -1) {
                const nBits = 52;
                const seed = crypto.createHash('sha256').update(`${Date.now()}`).digest('hex');
                let hash = crypto.createHmac("sha256", salt).update(seed).digest('hex');
                hash = hash.slice(0, nBits / 4);
                const r = parseInt(hash, 16);
                let X = r / Math.pow(2, nBits);
                X = parseFloat(X.toPrecision(9));
                let RTPAmount = totalBetAmount > 0 ? cashoutAmount / totalBetAmount * 100 : 0;
                if (RTPAmount > RTP) {
                    let diff = Math.floor(RTPAmount - RTP);
                    if (diff > diffLimit) diff = diffLimit;
                    X = (RTP - diff) / (1 - X);
                } else {
                    X = RTP / (1 - X);
                }
                target = Math.max(1, Math.floor(X) / 100);
            }
            if (Date.now() - startTime > BETINGTIME) {
                currentNum = 1;
                GameState = "READY";
                NextState = "PLAYING";
                startTime = Date.now();
                gameTime = getTime(target);
                const time = Date.now() - startTime;

                mysocketIo.emit('gameState', { currentNum, currentSecondNum, GameState, time });
            }
            break;
        case "READY":
            if (Date.now() - startTime > READYTIME) {
                GameState = "PLAYING";
                NextState = "GAMEEND";
                startTime = Date.now();
                const time = Date.now() - startTime;
                mysocketIo.emit('gameState', { currentNum, currentSecondNum, GameState, time });
            }
            break;
        case "PLAYING":
            var currentTime = (Date.now() - startTime) / 1000;
            currentNum = 1 + 0.06 * currentTime + Math.pow((0.06 * currentTime), 2) - Math.pow((0.04 * currentTime), 3) + Math.pow((0.04 * currentTime), 4)
            // for (const k in users) {
            //     const i = users[k];
            //     if (i.f.target >= 1.01 && i.f.betted && !i.f.cashouted && target >= i.f.target && currentNum >= i.f.target) {
            //         settle(i.orderNo, i.f.target * i.f.betAmount, i.token);
            //         i.f.cashouted = true;
            //         i.f.cashAmount = i.f.target * i.f.betAmount;
            //         i.f.betted = false;
            //         i.balance += i.f.target * i.f.betAmount;
            //         i.orderNo = 0;
            //         cashoutAmount += i.f.target * i.f.betAmount;
            //         mysocketIo.emit("finishGame", i);
            //         mysocketIo.emit("success", `Successfully 111 CashOuted ${Number(i.f.cashAmount).toFixed(2)}`);
            //     }
            //     if (i.s.target >= 1.01 && i.s.betted && !i.s.cashouted && target >= i.s.target && currentNum >= i.s.target) {
            //         settle(i.orderNo, i.s.target * i.s.betAmount, i.token);
            //         i.s.cashouted = true;
            //         i.s.cashAmount = i.s.target * i.s.betAmount;
            //         i.s.betted = false;
            //         i.balance += i.s.target * i.s.betAmount;
            //         i.orderNo = 0;
            //         cashoutAmount += i.s.target * i.s.betAmount;
            //         mysocketIo.emit("finishGame", i);
            //         mysocketIo.emit("success", `Successfully 222 CashOuted ${Number(i.s.cashAmount).toFixed(2)}`);
            //     }
            // }
            currentSecondNum = currentNum;
            if (currentTime > gameTime) {
                sendPreviousHand();
                currentSecondNum = 0;
                currentNum = target;
                GameState = "GAMEEND";
                NextState = "BET";
                startTime = Date.now();
                for (const k in users) {
                    const i = users[k];
                    let fBetted = i.f.betted;
                    if (i.f.betted || i.f.cashouted) {
                        addHistory(i.userId, i.f.betAmount, i.f.target, i.f.cashouted)
                    }
                    i.f.betted = false;
                    i.f.cashouted = false;
                    i.f.betAmount = 0;
                    i.f.cashAmount = 0;
                    let sBetted = i.s.betted;
                    if (i.s.betted || i.s.cashouted) {
                        addHistory(i.userId, i.s.betAmount, i.s.target, i.s.cashouted)
                    }
                    i.s.betted = false;
                    i.s.cashouted = false;
                    i.s.betAmount = 0;
                    i.s.cashAmount = 0;
                    sockets.map((socket) => {
                        if (socket.id === i.socketId && (fBetted || sBetted)) {
                            socket.emit("finishGame", i);
                        }
                    })
                }

                const time = Date.now() - startTime;
                mysocketIo.emit('gameState', { currentNum, currentSecondNum, GameState, time });
                botIds.map((item) => {
                    users[item] = { ...DEFAULT_USER, bot: true, userType: false }
                })
            }
            break;
        case "GAMEEND":
            botNum = Math.floor(Math.random() * 15);
            initBots()
            if (Date.now() - startTime > GAMEENDTIME) {
                let i = 0;
                let interval = setInterval(() => {
                    betBot(botIds[i]);
                    i++;
                    if (i > botNum)
                        clearInterval(interval);
                }, 100)
                startTime = Date.now();
                GameState = "BET";
                NextState = "READY";
                history.unshift(target);
                mysocketIo.emit("history", history);
                const time = Date.now() - startTime;
                mysocketIo.emit('gameState', { currentNum, currentSecondNum, GameState, time });
                target = -1;
            }
            break;
    }
}

gameRun();

const getRandom = () => {
    var r = Math.random();
    target = 1 / r;
    console.log(target);
    var time = getTime(target);
    return time;
}

const sendInfo = () => {
    if (GameState !== "GAMEEND") {
        const info = [] as Array<{
            name: string
            betAmount: number
            cashOut: number
            cashouted: boolean
            target: number
            img: string
        }>

        for (let i in users) {
            if (!!users[i]) {
                let u = users[i];
                if (u.f.betted || u.f.cashouted) {
                    info.push({
                        name: u.userName,
                        betAmount: u.f.betAmount,
                        cashOut: u.f.cashAmount,
                        cashouted: u.f.cashouted,
                        target: u.f.target,
                        img: u.img
                    })
                }

                if (u.s.betted || u.s.cashouted) {
                    info.push({
                        name: u.userName,
                        betAmount: u.s.betAmount,
                        cashOut: u.s.cashAmount,
                        cashouted: u.s.cashouted,
                        target: u.s.target,
                        img: u.img
                    })
                }
            }
        }
        if (info.length) mysocketIo.emit("bettedUserInfo", info);
    }
}

const sendPreviousHand = () => {
    let myPreHand = [] as preHandType[];
    for (let i in previousHand) {
        let u = previousHand[i];
        if (u.f.betted || u.f.cashouted) {
            myPreHand.push({
                img: u.avatar,
                userName: u.userName,
                betted: u.f.betted,
                cashouted: u.f.cashouted,
                betAmount: u.f.betAmount,
                cashAmount: u.f.cashAmount,
                target: u.f.target,
            });
        }
        if (u.s.betted || u.s.cashouted) {
            myPreHand.push({
                img: u.avatar,
                userName: u.userName,
                betted: u.s.betted,
                cashouted: u.s.cashouted,
                betAmount: u.s.betAmount,
                cashAmount: u.s.cashAmount,
                target: u.s.target,
            });
        }
    }
    mysocketIo.emit("previousHand", myPreHand);
}

// bot cash out here.
setInterval(() => {
    if (GameState === "PLAYING") {
        let _bots = botIds.filter(k => users[k] && users[k].f.target <= currentNum && users[k].f.betted)
        if (_bots.length) {
            for (let k of _bots) {
                users[k].f.cashouted = true;
                users[k].f.cashAmount = users[k].f.target * users[k].f.betAmount;
                users[k].f.betted = false;

                // cashoutAmount += users[k].f.target * users[k].f.betAmount;
            }
        }

        _bots = botIds.filter(k => users[k] && users[k].s.target <= currentNum && users[k].s.betted)
        if (_bots.length) {
            for (let k of _bots) {
                users[k].s.cashouted = true;
                users[k].s.cashAmount = users[k].s.target * users[k].s.betAmount;
                users[k].s.betted = false;

                // cashoutAmount += users[k].s.target * users[k].s.betAmount;
            }
        }
    }
}, 500);

function getMultiValue(num: number) {
    return (Math.floor(Math.random() * 10) + 1) * num;
}

function getBotRandomBetAmount() {
    let a = 20, b = 50, c = 100;

    var rd = Math.floor(Math.random() * 6) + 1;

    if (rd === 1) {
        return getMultiValue(a);
    } else if (rd === 2) {
        return getMultiValue(b);
    } else if (rd === 3) {
        return getMultiValue(c);
    } else if (rd === 4) {
        return getMultiValue(a) + getMultiValue(b);
    } else if (rd === 5) {
        return getMultiValue(a) + getMultiValue(b) + getMultiValue(c);
    } else {
        return (Math.random() * 1000) + 1;
    }

}

// Bots bet in here.
function betBot(id: string) {
    // let fbetAmount = (Math.random() * 1000) + 1
    // let sbetAmount = (Math.random() * 1000) + 1
    let fbetAmount = getBotRandomBetAmount();
    let sbetAmount = getBotRandomBetAmount();
    users[id] = {
        ...DEFAULT_USER,
        bot: true,
        f: {
            auto: false,
            betted: true,
            cashouted: false,
            betAmount: fbetAmount,
            cashAmount: 0,
            target: (Math.random() * (1 / Math.random() - 0.01)) + 1.01,
        },
        s: {
            auto: false,
            betted: false,
            cashouted: false,
            betAmount: sbetAmount,
            cashAmount: 0,
            target: (Math.random() * (1 / Math.random() - 0.01)) + 1.01,
        },
    }
    // totalBetAmount += fbetAmount;
}

export const initSocket = (io: Server) => {
    // create bots
    initBots()

    mysocketIo = io;
    io.on("connection", async (socket) => {
        console.log("new User connected:" + socket.id);
        sockets.push(socket);
        socket.on('disconnect', async () => {
            console.log("Disconnected User : ", socket.id, users[socket.id]);
            const checkIndex = sockets.findIndex((s) => (
                s.id === socket.id
            ))

            if (checkIndex > -1) {
                console.log("Disconnected User : ", socket.id);
                if (users[socket.id].orderNo > 0) {
                    let betAmount = 0;
                    if (users[socket.id].f.betted && !users[socket.id].f.cashouted) betAmount += users[socket.id].f.betAmount;
                    if (users[socket.id].s.betted && !users[socket.id].s.cashouted) betAmount += users[socket.id].s.betAmount;
                    if (betAmount > 0) {
                        // cancelBet(users[socket.id].orderNo, betAmount, users[socket.id].token);
                    }
                }
                sockets.splice(checkIndex, 1);
                delete users[socket.id];
            }
        })
        socket.on('enterRoom', async (props) => {
            // const { token } = props;
            socket.emit('getBetLimits', { max: config.betting.max, min: config.betting.min });
            // if (token !== null && token !== undefined) {
            //     let tokenSplit = token.split('&');
            //     const userInfo = await getUserInfo(tokenSplit[0]);
            //     if (userInfo.status) {
            //         console.log("userInfo", userInfo);
            //         users[socket.id] = {
            //             ...DEFAULT_USER,
            //             userId: userInfo.data.userId,
            //             userName: userInfo.data.userName,
            //             balance: userInfo.data.balance,
            //             avatar: userInfo.data.avatar,
            //             token: tokenSplit[0],
            //             socketId: socket.id
            //         }
            //         socket.emit('myInfo', users[socket.id]);
            //         io.emit('history', history);
            //         const time = Date.now() - startTime;
            //         io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
            //     } else {
            //         socket.emit("deny", { message: "Unregistered User" });
            //     }
            // } else {
            //     users[socket.id] = {
            //         ...DEFAULT_USER,
            //         balance: 50000,
            //         socketId: socket.id
            //     }
            // }
            users[socket.id] = {
                ...DEFAULT_USER,
                balance: 50000,
                socketId: socket.id
            }
            socket.emit('myInfo', users[socket.id]);
            io.emit('history', history);
            const time = Date.now() - startTime;
            io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
        })
        socket.on('playBet', async (data) => {
            const { betAmount, target, type, auto } = data;
            if (GameState === "BET") {
                let u = users[socket.id];

                if (!!u) {
                    if (betAmount >= config.betting.min && betAmount <= config.betting.max) {
                        if (u.balance - betAmount >= 0) {
                            const orderNo = Date.now() + Math.floor(Math.random() * 1000);
                            if (type === 'f') {
                                u.f.betAmount = betAmount;
                                u.f.betted = true;
                                u.f.auto = auto;
                                u.f.target = target;
                            } else if (type === 's') {
                                u.s.betAmount = betAmount;
                                u.s.betted = true;
                                u.s.auto = auto;
                                u.s.target = target;
                            }
                            u.balance = u.balance - betAmount;
                            u.orderNo = orderNo;
                            // users[socket.id] = u;
                            totalBetAmount += betAmount;
                            if (totalBetAmount > Number.MAX_SAFE_INTEGER) {
                                totalBetAmount = betAmount;
                                cashoutAmount = 0;
                            }

                            console.log("UserId >>", users[socket.id].userId);
                            // socket.emit("myBetState", { user: u, type });
                            socket.emit("myBetState", u);
                            // const betRes = await bet(betAmount, u.token);
                            // if (betRes.status) {
                            // } else {
                            //     socket.emit('error', { message: betRes.message, index: type });
                            // }
                        } else {
                            socket.emit('error', { message: "Your balance is not enough", index: type });
                        }
                    }
                } else {
                    socket.emit('error', { message: "Undefined User", index: type });
                }
            } else {
                socket.emit('error', { message: "You can't bet. Try again at next round!", index: type });
            }
        })
        socket.on('cashOut', async (data) => {
            const { type, endTarget } = data;
            console.log("Cashout>>", users[socket.id].userId);
            let u = users[socket.id];
            let player;
            if (type === 'f')
                player = u.f
            else if (type === 's')
                player = u.s
            if (!!u) {
                if (GameState === "PLAYING") {
                    if (!player.cashouted && player.betted) {
                        if (endTarget <= currentSecondNum) {
                            // settle(u.orderNo, endTarget * player.betAmount, u.token);
                            player.cashouted = true;
                            player.cashAmount = endTarget * player.betAmount;
                            player.betted = false;
                            player.target = endTarget;
                            u.balance += endTarget * player.betAmount;
                            u.orderNo = 0;
                            cashoutAmount += endTarget * player.betAmount;
                            // users[socket.id] = u;
                            socket.emit("finishGame", u);
                            socket.emit("success", `Successfully CashOuted ${Number(player.cashAmount).toFixed(2)}`);
                        } else {
                            socket.emit("error", { message: "You can't cash out!", index: type });
                        }
                    }
                } else
                    socket.emit('error', { message: "You can't cash out!", index: type });
            } else
                socket.emit('error', { message: 'Undefined User', index: type });
        })

        setInterval(() => {
            // if (GameState === NextGameState) {
            // NextGameState = NextState;
            const time = Date.now() - startTime;
            io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
            // }
            sendInfo();
        }, 100)
    });

    const closeServer = () => {
        io.close(() => {
            console.log('Socket server closed');
            process.exit(0);
        });
    }

    process.on('SIGINT', closeServer); // Handle CTRL+C
    process.on('SIGTERM', closeServer); // Handle termination signals
};