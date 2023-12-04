import { Server, Socket } from 'socket.io'
import uniqid from 'uniqid'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';

import { getTime } from "../math"
import { DUsers, addHistory, addUser, getBettingAmounts, updateUserBalance } from '../model'
import { setlog } from '../helper';
import config from "../config.json";
import { copyObject } from '../util';

interface UserType {
    balance: number
    userType: boolean
    img: string
    userName: string
    bot: boolean
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
    balance: 0,
    userType: false,
    img: '',
    userName: 'test',
    socketId: '',
    bot: false,
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
    }
}

let mysocketIo: Server;
let sockets = [] as Socket[];
let socketUsers = {} as { [key: string]: { userId: string, fToken: string, sToken: string } };
let users = {} as { [key: string]: UserType }
let userIds = {} as { [key: string]: string };
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
let target: number;
let RTP = 200;
let cashoutAmount = 0;
let totalBetAmount = 0;

// let interval: NodeJS.Timer;
let interval: any;
let botIds = [] as string[];
let packageId = '';

const initBots = () => {
    for (var i = 0; i < 15; i++) {
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
                    NextState = "PLAYING";
                    startTime = Date.now();
                    gameTime = getRandom();
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
                currentSecondNum = currentNum;
                let RTPAmount = cashoutAmount / totalBetAmount * 100;
                if (RTPAmount >= RTP)
                    target = currentNum;
                if (currentTime > gameTime || RTPAmount >= RTP) {
                    sendPreviousHand();
                    currentSecondNum = 0;
                    currentNum = target;
                    GameState = "GAMEEND";
                    NextState = "BET";
                    totalBetAmount = 0;
                    cashoutAmount = 0;
                    startTime = Date.now();
                    for (const k in users) {
                        const i = users[k];
                        if (!i.bot) {
                            let orders = [];
                            if (i.f.betted || i.f.cashouted) {
                                // console.log(i.f.target);
                                await addHistory(i.userName, i.f.betAmount, i.f.target, i.f.cashouted)
                            }
                            if (i.userType && i.f.betted && !i.f.cashouted) {
                                let time = new Date().getTime();
                                orders.push({
                                    'packageId': packageId,
                                    'userId': userIds[i.socketId],
                                    'odds': '0',
                                    'wonAmount': '0',
                                    'betAmount': (i.f.betAmount * 100).toString(),
                                    'status': 0,
                                    'timestamp': time
                                })
                            }
                            i.f.betted = false;
                            i.f.cashouted = false;
                            i.f.betAmount = 0;
                            i.f.cashAmount = 0;
                            if (i.s.betted || i.s.cashouted) {
                                await addHistory(i.userName, i.s.betAmount, i.s.target, i.s.cashouted)
                            }
                            if (i.userType && i.s.betted && !i.s.cashouted) {
                                let time = new Date().getTime();
                                orders.push({
                                    'packageId': packageId,
                                    'userId': userIds[i.socketId],
                                    'odds': '0',
                                    'wonAmount': '0',
                                    'betAmount': (i.s.betAmount * 100).toString(),
                                    'status': 0,
                                    'timestamp': time
                                })
                            }
                            i.s.betted = false;
                            i.s.cashouted = false;
                            i.s.betAmount = 0;
                            i.s.cashAmount = 0;
                            if (orders.length > 0) {
                                let sendOrders = await axios.post(
                                    config.orderURL,
                                    {
                                        ptxid: uuidv4(),
                                        iGamingOrders: orders
                                    }, {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'packageId': packageId,
                                        'gamecode': 'crashGame'
                                    }
                                });
                                console.log(sendOrders.data);
                            }
                            sockets.map((socket) => {
                                if (socket.id === i.socketId) {
                                    socket.emit("finishGame", i);
                                }
                            })
                        }
                    }

                    const time = Date.now() - startTime;
                    mysocketIo.emit('gameState', { currentNum, currentSecondNum, GameState, time });
                    botIds.map((item) => {
                        users[item] = { ...DEFAULT_USER, bot: true, userType: false }
                    })
                }
                break;
            case "GAMEEND":
                if (Date.now() - startTime > GAMEENDTIME) {
                    let i = 0;
                    let interval = setInterval(() => {
                        bet(botIds[i]);
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
                }
                break;
        }
    }, 20)
}

gameRun();

const getRandom = () => {
    var r = Math.random();
    target = 1 / r;
    // console.log(target);
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
                img: u.img,
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
                img: u.img,
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
setInterval(() => {
    if (GameState === "PLAYING") {
        let _bots = botIds.filter(k => users[k] && users[k].f.target <= currentNum && users[k].f.betted)
        if (_bots.length) {
            for (let k of _bots) {
                users[k].f.cashouted = true;
                users[k].f.cashAmount = users[k].f.target * users[k].f.betAmount;
                users[k].f.betted = false;

                cashoutAmount += users[k].f.target * users[k].f.betAmount;
            }
        }

        _bots = botIds.filter(k => users[k] && users[k].s.target <= currentNum && users[k].s.betted)
        if (_bots.length) {
            for (let k of _bots) {
                users[k].s.cashouted = true;
                users[k].s.cashAmount = users[k].s.target * users[k].s.betAmount;
                users[k].s.betted = false;

                cashoutAmount += users[k].s.target * users[k].s.betAmount;
            }
        }
    }
}, 500);

// Bots bet in here.
function bet(id: string) {
    let fbetAmount = (Math.random() * 1000) + 1
    let sbetAmount = (Math.random() * 1000) + 1
    users[id] = {
        ...DEFAULT_USER,
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
        }
    }
    totalBetAmount += fbetAmount;
}

export const initSocket = (io: Server) => {
    // create bots
    initBots()

    mysocketIo = io;
    io.on("connection", async (socket) => {
        console.log("new User connected:" + socket.id);
        sockets.push(socket);
        socket.on('disconnect', async () => {
            const checkIndex = sockets.findIndex((s) => (
                s.id === socket.id
            ))

            if (checkIndex !== -1) {
                console.log("Disconnected User : ", socket.id);
                if (userIds[socket.id] && users[userIds[socket.id]] && users[userIds[socket.id]].userType) {
                    let userData = await DUsers.findOne({ "name": userIds[socket.id] });
                    const refoundAmount = await axios.post(config.reFundURL,
                        { userId: userIds[socket.id], balance: userData.balance * 100, ptxid: uuidv4() },
                        { headers: { 'Content-Type': 'application/json', gamecode: 'crashGame', packageId: packageId } });
                    if (refoundAmount.data.success) {
                        await updateUserBalance(userIds[socket.id], 0);
                        console.log("Successfully refund : ", userIds[socket.id]);
                    } else {
                        console.log(refoundAmount.data);
                    }
                }

                sockets.splice(checkIndex, 1);
                delete userIds[socket.id];
            }
        })
        socket.on('enterRoom', async (props) => {
            const { token } = props;
            const bettingLimits = await getBettingAmounts();
            socket.emit('getBetLimits', { max: bettingLimits.maxBetAmount, min: bettingLimits.minBetAmount });
            let balance = 5000;
            let id = socket.id;
            let userName = uuidv4();
            let userType = false;
            let img = '';
            if (token !== null && token !== undefined) {
                let tokenSplit = token.split('&');
                const getUserInfo = await axios.post(config.getUserTokenURL, { token: tokenSplit[0], ptxid: uuidv4() });
                if (getUserInfo.data.success) {
                    let userInfo: any = getUserInfo.data.data;
                    id = userInfo.userId;
                    packageId = userInfo.packageId;
                    userName = userInfo.userName;
                    img = userInfo.avatar;
                    const getBalance = await axios.post(
                        config.getBalanceURL,
                        { userId: userInfo.userId, token: userInfo.userToken, ptxid: uuidv4() },
                        { headers: { 'Content-Type': 'application/json', gamecode: 'crashGame', packageId: packageId } },
                    )
                    balance = getBalance.data.data.balance / 100;
                    let userData = await DUsers.findOne({ "name": id });
                    if (balance > 0) {
                        userType = true;
                        if (!userData) {
                            await addUser(userInfo.userId, balance, userInfo.avatar);
                        } else {
                            await updateUserBalance(userInfo.userId, balance);
                        }
                    } else {
                        socket.emit("recharge");
                        return;
                    }
                }
            }
            users[id] = {
                ...DEFAULT_USER,
                userType,
                userName,
                balance,
                img,
                socketId: socket.id
            }
            userIds[socket.id] = id;
            console.log(userIds[socket.id]);
            socket.emit('myInfo', users[id]);
            io.emit('history', history);
            const time = Date.now() - startTime;
            io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
        })
        socket.on('playBet', async (data) => {
            const { betAmount, target, type, auto } = data;
            if (GameState === "BET") {
                let u = copyObject(users[userIds[socket.id]])

                if (!!u) {
                    const { minBetAmount, maxBetAmount } = await getBettingAmounts()

                    if (betAmount >= minBetAmount && betAmount <= maxBetAmount) {
                        let balance;
                        if (u.userType) {
                            let d = await DUsers.findOne({ name: userIds[socket.id] });
                            if (d.balance - betAmount >= 0) {
                                balance = d.balance - betAmount;
                                await updateUserBalance(userIds[socket.id], balance);
                            } else {
                                socket.emit('error', { message: "Your balance is not enough", index: type });
                                return;
                            }
                        } else {
                            balance = u.balance - betAmount;
                        }

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
                        u.balance = balance;
                        users[userIds[socket.id]] = u;
                        totalBetAmount += betAmount;

                        console.log("UserId >>", userIds[socket.id]);

                        socket.emit("myBetState", u);
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
            console.log("Cashout>>", userIds[socket.id]);
            let u = copyObject(users[userIds[socket.id]]);
            let player;
            if (type === 'f')
                player = u.f
            else if (type === 's')
                player = u.s
            if (!!u) {
                if (GameState === "PLAYING") {
                    if (!player.cashouted && player.betted) {
                        if (endTarget <= currentSecondNum) {
                            let balance;
                            if (u.userType) {
                                player.cashouted = true;
                                users[userIds[socket.id]] = u;
                                let d = await DUsers.findOne({ name: userIds[socket.id] });
                                balance = d.balance + endTarget * player.betAmount;
                                await updateUserBalance(userIds[socket.id], balance);
                                let currentTime = new Date().getTime();
                                let odds = '0';
                                let status = 0;
                                let wonAmount = 0;
                                if (endTarget > 1) {
                                    status = 1;
                                    odds = (endTarget * player.betAmount / player.betAmount).toFixed(2);
                                    wonAmount = endTarget * player.betAmount * 100;
                                }
                                await axios.post(
                                    config.orderURL,
                                    {
                                        ptxid: uuidv4(),
                                        iGamingOrders: [
                                            {
                                                'packageId': packageId,
                                                'userId': userIds[socket.id],
                                                'odds': odds,
                                                'wonAmount': wonAmount.toString(),
                                                'betAmount': (player.betAmount * 100).toString(),
                                                'status': status,
                                                'timestamp': currentTime
                                            }
                                        ]
                                    }, {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'packageId': packageId,
                                        'gamecode': 'crashGame'
                                    }
                                });
                            } else {
                                balance = u.balance + endTarget * player.betAmount;
                                player.cashouted = true;
                            }
                            player.cashAmount = endTarget * player.betAmount;
                            player.betted = false;
                            player.target = endTarget;
                            u.balance = balance;
                            cashoutAmount += endTarget * player.betAmount;
                            users[userIds[socket.id]] = u;
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