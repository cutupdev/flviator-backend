import { Server, Socket } from 'socket.io'
import crypto from 'crypto';
import path from 'path';
import { config } from "dotenv";
import { getTime } from "../math"
import { addHistory } from '../model'
import { Authentication, bet, settle, cancelBet } from '../controllers/client';

import localconfig from "../config.json";

const envUrl = process.env.NODE_ENV === 'development' ? '../../.env.development' : '../../.env.prod';
config({ path: path.join(__dirname, envUrl) });
require('dotenv').config({ path: path.join(__dirname, envUrl) });

interface UserType {
    userId: string
    userName: string
    currency: string
    balance: number
    avatar: string
    token: string
    socketId: string
    Session_Token: string
    f: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        orderNo: number
        betAmount: number
        cashAmount: number
        target: number
    }
    s: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        orderNo: number
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
    userId: '0',
    userName: 'test',
    currency: 'INR',
    balance: 0,
    avatar: '',
    token: '',
    socketId: '',
    Session_Token: '',
    f: {
        auto: false,
        betted: false,
        cashouted: false,
        orderNo: 0,
        betAmount: 0,
        cashAmount: 0,
        target: 0,
    },
    s: {
        auto: false,
        betted: false,
        cashouted: false,
        orderNo: 0,
        betAmount: 0,
        cashAmount: 0,
        target: 0,
    }
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
const RTP = localconfig.RTP;
let cashoutAmount = 0;
let totalBetAmount = 0;

let interval: any;
let botIds = [] as string[];
const diffLimit = 9; // When we lost money, decrease RTP by this value, but be careful, if this value is high, the more 1.00 x will appear and users might complain.
const salt = process.env.SALT || '8783642fc5b7f51c08918793964ca303edca39823325a3729ad62f0a2';

// const initBots = () => {
//     for (var i = 0; i < 20; i++) {
//         botIds.push(uniqid());
//     }
// }
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

            //         settle(i.userId, i.orderNo, i.f.target, i.f.target * i.f.betAmount, i.currency);

            //         i.f.cashouted = true;
            //         i.f.cashAmount = i.f.target * i.f.betAmount;
            //         i.f.betted = false;
            //         i.balance += i.f.target * i.f.betAmount;
            //         i.orderNo = 0;
            //         cashoutAmount += i.f.target * i.f.betAmount;
            //         mysocketIo.emit("finishGame", i);
            //         mysocketIo.emit("success", `Successfully CashOuted ${Number(i.f.cashAmount).toFixed(2)}`);
            //     }
            //     if (i.s.target >= 1.01 && i.s.betted && !i.s.cashouted && target >= i.s.target && currentNum >= i.s.target) {
            //         settle(i.userId, i.orderNo, i.s.target, i.s.target * i.s.betAmount, i.currency);
            //         i.s.cashouted = true;
            //         i.s.cashAmount = i.s.target * i.s.betAmount;
            //         i.s.betted = false;
            //         i.balance += i.s.target * i.s.betAmount;
            //         i.orderNo = 0;
            //         cashoutAmount += i.s.target * i.s.betAmount;
            //         mysocketIo.emit("finishGame", i);
            //         mysocketIo.emit("success", `Successfully CashOuted ${Number(i.s.cashAmount).toFixed(2)}`);
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
            }
            break;
        case "GAMEEND":
            if (Date.now() - startTime > GAMEENDTIME) {
                let i = 0;
                let interval = setInterval(() => {
                    // bet(botIds[i]);
                    i++;
                    if (i > 19)
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

// const sendInfo = () => {
//     if (GameState !== "GAMEEND") {
//         const info = [] as Array<{
//             name: string
//             betAmount: number
//             cashOut: number
//             cashouted: boolean
//             target: number
//             img: string
//         }>

//         for (let i in users) {
//             if (!!users[i]) {
//                 let u = users[i];
//                 if (u.f.betted || u.f.cashouted) {
//                     info.push({
//                         name: u.userName,
//                         betAmount: u.f.betAmount,
//                         cashOut: u.f.cashAmount,
//                         cashouted: u.f.cashouted,
//                         target: u.f.target,
//                         img: u.img
//                     })
//                 }

//                 if (u.s.betted || u.s.cashouted) {
//                     info.push({
//                         name: u.userName,
//                         betAmount: u.s.betAmount,
//                         cashOut: u.s.cashAmount,
//                         cashouted: u.s.cashouted,
//                         target: u.s.target,
//                         img: u.img
//                     })
//                 }
//             }
//         }
//         if (info.length) mysocketIo.emit("bettedUserInfo", info);
//     }
// }

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

//bot cash out here.
// setInterval(() => {
//     if (GameState === "PLAYING") {
//         let _bots = botIds.filter(k => users[k] && users[k].f.target <= currentNum && users[k].f.betted)
//         if (_bots.length) {
//             for (let k of _bots) {
//                 users[k].f.cashouted = true;
//                 users[k].f.cashAmount = users[k].f.target * users[k].f.betAmount;
//                 users[k].f.betted = false;

//                 cashoutAmount += users[k].f.target * users[k].f.betAmount;
//             }
//         }

//         _bots = botIds.filter(k => users[k] && users[k].s.target <= currentNum && users[k].s.betted)
//         if (_bots.length) {
//             for (let k of _bots) {
//                 users[k].s.cashouted = true;
//                 users[k].s.cashAmount = users[k].s.target * users[k].s.betAmount;
//                 users[k].s.betted = false;

//                 cashoutAmount += users[k].s.target * users[k].s.betAmount;
//             }
//         }
//     }
// }, 500);

// Bots bet in here.
// function bet(id: string) {
//     let fbetAmount = (Math.random() * 1000) + 1
//     let sbetAmount = (Math.random() * 1000) + 1
//     users[id] = {
//         ...DEFAULT_USER,
//         f: {
//             auto: false,
//             betted: true,
//             cashouted: false,
//             betAmount: fbetAmount,
//             cashAmount: 0,
//             target: (Math.random() * (1 / Math.random() - 0.01)) + 1.01,
//         },
//         s: {
//             auto: false,
//             betted: false,
//             cashouted: false,
//             betAmount: sbetAmount,
//             cashAmount: 0,
//             target: (Math.random() * (1 / Math.random() - 0.01)) + 1.01,
//         }
//     }
//     totalBetAmount += fbetAmount;
// }

export const initSocket = (io: Server) => {
    // create bots
    // initBots()

    mysocketIo = io;
    io.on("connection", async (socket) => {

        socket.on('sessionCheck', async ({ token, UserID, currency, returnurl }) => {
            socket.emit('sessionSecure', { sessionStatus: true })
        })

        console.log("new User connected:" + socket.id);
        sockets.push(socket);
        socket.on('disconnect', async () => {
            console.log("Disconnected User : ", socket.id, users[socket.id]);
            const checkIndex = sockets.findIndex((s) => (
                s.id === socket.id
            ))

            if (checkIndex > -1) {
                console.log("Disconnected User : ", socket.id);
                if (users[socket.id]?.f?.orderNo > 0 || users[socket.id]?.s?.orderNo > 0) {
                    let betAmount = 0;
                    if (users[socket.id].f.betted && !users[socket.id].f.cashouted) {
                        betAmount += users[socket.id].f.betAmount;
                        cancelBet(users[socket.id].userId, `${users[socket.id].f.orderNo}`, `${betAmount}`, users[socket.id].token, users[socket.id].Session_Token);
                    }
                    if (users[socket.id].s.betted && !users[socket.id].s.cashouted) {
                        betAmount += users[socket.id].s.betAmount;
                        cancelBet(users[socket.id].userId, `${users[socket.id].s.orderNo}`, `${betAmount}`, users[socket.id].token, users[socket.id].Session_Token);
                    }
                }
                sockets.splice(checkIndex, 1);
                delete users[socket.id];
            }
        })
        socket.on('enterRoom', async (props) => {
            var { token, UserID, currency } = props;
            token = decodeURIComponent(token);
            UserID = decodeURIComponent(UserID);
            currency = decodeURIComponent(currency);

            console.log(`${UserID} entered the crash with ${token} token and currency is ${currency}`);

            socket.emit('getBetLimits', { max: localconfig.betting.max, min: localconfig.betting.min });
            if (token !== null && token !== undefined) {
                var Session_Token = crypto.randomUUID();
                const userInfo = await Authentication(token, UserID, currency, Session_Token);
                if (userInfo.status) {
                    users[socket.id] = {
                        ...DEFAULT_USER,
                        userId: userInfo.data.userId,
                        userName: userInfo.data.userName,
                        balance: userInfo.data.balance,
                        avatar: userInfo.data.avatar,
                        currency: userInfo.data.currency,
                        Session_Token,
                        token,
                        socketId: socket.id
                    }
                    socket.emit('myInfo', users[socket.id]);
                    io.emit('history', history);
                    const time = Date.now() - startTime;
                    io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
                } else {
                    socket.emit("deny", { message: "Unregistered User" });
                }
            } else {
                // users[socket.id] = {
                //     ...DEFAULT_USER,
                //     balance: 50000,
                //     socketId: socket.id
                // }
                socket.emit("deny", { message: "User token is invalid" });
            }
        })
        socket.on('playBet', async (data: any) => {
            const { betAmount, target, type, auto } = data;
            if (GameState === "BET") {
                let u = users[socket.id];

                if (!!u) {
                    if (betAmount >= localconfig.betting.min && betAmount <= localconfig.betting.max) {
                        if (u.balance - betAmount >= 0) {
                            const betid = Date.now() + Math.floor(Math.random() * 1000);
                            console.log(`the user is playing bet bet type is ${type} bet id is ${betid}`)
                            const betRes = await bet(users[socket.id].userId, `${betid}`, `${betAmount}`, u.currency, u.Session_Token);
                            if (betRes.status) {
                                if (type === 'f') {
                                    u.f.betAmount = betAmount;
                                    u.f.betted = true;
                                    u.f.orderNo = betid;
                                    u.f.auto = auto;
                                    u.f.target = target;
                                } else if (type === 's') {
                                    u.s.betAmount = betAmount;
                                    u.s.betted = true;
                                    u.s.orderNo = betid;
                                    u.s.auto = auto;
                                    u.s.target = target;
                                }
                                u.balance = betRes.balance;
                                // users[socket.id] = u;
                                totalBetAmount += betAmount;
                                if (totalBetAmount > Number.MAX_SAFE_INTEGER) {
                                    totalBetAmount = betAmount;
                                    cashoutAmount = 0;
                                }

                                console.log("UserId >>", users[socket.id].userId);
                                socket.emit("myBetState", { user: u, type });
                            } else {
                                socket.emit('error', { message: betRes.message, index: type, userInfo: u });
                            }
                        } else {
                            socket.emit('error', { message: "Your balance is not enough", index: type });
                        }
                    } else {
                        socket.emit('error', { message: `Your bet range is ${localconfig.betting.min}~${localconfig.betting.max}`, index: type });
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
                            var returnData: any = await settle(users[socket.id].userId, `${type === 'f' ? u.f.orderNo : u.s.orderNo}`, endTarget.toFixed(2), (endTarget * player.betAmount).toFixed(2), u.currency, u.Session_Token);
                            player.cashouted = true;
                            player.cashAmount = endTarget * player.betAmount;
                            if (u.f.betted === false && u.s.betted === false) {
                                player.betted = false;
                                u.f.orderNo = 0;
                                u.s.orderNo = 0;
                            }
                            player.target = endTarget;
                            // u.balance += endTarget * player.betAmount;
                            console.log(Number(returnData.balance))
                            u.balance = Number(returnData.balance);
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

        // setInterval(() => {
        //     // if (GameState === NextGameState) {
        //     // NextGameState = NextState;
        //     const time = Date.now() - startTime;
        //     io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
        //     // }
        //     // sendInfo();
        // }, 100)
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