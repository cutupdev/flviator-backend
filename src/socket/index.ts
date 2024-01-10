import { Server, Socket } from 'socket.io'
import crypto from 'crypto';
import path from 'path';
import { config } from "dotenv";
import { getTime } from "../math"
// import { addChatHistory, getAllChatHistory } from '../model'
import { Authentication, bet, settle, cancelBet } from '../controllers/client';

import localconfig from "../config.json";
import {
    UserType,
    PreHandType
} from "../types"
import {
    DEFAULT_USER,
    READYTIME,
    BETINGTIME,
    GAMEENDTIME,
    RTP,
    getRandomName,
    getBotRandomBetAmount,
    getRandomAvatar,
} from "./config"
import { botIds, initBots } from "./bots"
import { addChat } from '../model/chat';
import { updateBetByBetId } from '../model/bet';
import { updateCashoutByBetId } from '../model/cashout';
import { addFlyDetail, updateFlyDetailByBetId } from '../model/flydetail';
import { addHistory } from '../model/history';
import {
    addSocketUser,
    getSocketUserById,
    getUserBySocketId,
    updateSocketUserByUserId
} from '../model/socketuser';

let mysocketIo: Server;
let users = {} as { [key: string]: UserType }
let sockets = [] as Socket[];
let previousHand = users;
let history = [] as number[];
let GameState = "BET";
let NextGameState = "READY";
let NextState = "READY";
let startTime = Date.now();
let gameTime: number;
let currentNum: number;
let currentSecondNum: number;
let target: number = -1;
let cashoutAmount = 0;
let totalBetAmount = 0;

const diffLimit = 9; // When we lost money, decrease RTP by this value, but be careful, if this value is high, the more 1.00 x will appear and users might complain.
const salt = process.env.SALT || '8783642fc5b7f51c08918793964ca303edca39823325a3729ad62f0a2';
var seed = crypto.createHash('sha256').update(`${Date.now()}`).digest('hex');
let fbetid = 0;
let fbeted = false;
let sbetid = 0;
let sbeted = false;
let betNum = 0;
let cashoutNum = 0;

const gameRun = async () => {
    setTimeout(() => {
        gameRun();
    }, 20)

    switch (GameState) {
        case "BET":
            if (target == -1) {
                const nBits = 52;
                seed = crypto.createHash('sha256').update(`${Date.now()}`).digest('hex');
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
                // fbeted = false;
                // sbeted = false;
                // fbetid = Date.now() + Math.floor(Math.random() * 1000);
                // sbetid = Date.now() + Math.floor(Math.random() * 1000);
                const time = Date.now() - startTime;
                await addFlyDetail(`${fbetid}`, startTime, startTime, startTime, 0, 0, 0, 0, 0, 0, 0);
                await addFlyDetail(`${sbetid}`, startTime, startTime, startTime, 0, 0, 0, 0, 0, 0, 0);
                mysocketIo.emit('gameState', { currentNum, currentSecondNum, GameState, time });
            }
            break;
        case "PLAYING":
            var currentTime = (Date.now() - startTime) / 1000;
            currentNum = 1 + 0.06 * currentTime + Math.pow((0.06 * currentTime), 2) - Math.pow((0.04 * currentTime), 3) + Math.pow((0.04 * currentTime), 4)
            currentSecondNum = currentNum;

            let time = Date.now() - startTime;
            if (currentTime > gameTime) {
                // let cancelTime = Date.now()
                // if (fbeted === true) {
                //     await updateFlyDetailByBetId(`${fbetid}`, {
                //         flyEndTime: cancelTime,
                //         flyAway: currentSecondNum
                //     })
                //     await updateBetByBetId(`${fbetid}`, {
                //         isCancel: true,
                //         cancelTime
                //     })
                //     await updateCashoutByBetId(`${fbetid}`, {
                //         flyAway: currentSecondNum
                //     })
                // }
                // if (sbeted === true) {
                //     await updateFlyDetailByBetId(`${sbetid}`, {
                //         flyEndTime: cancelTime,
                //         flyAway: currentSecondNum
                //     })
                //     await updateBetByBetId(`${sbetid}`, {
                //         isCancel: true,
                //         cancelTime
                //     })
                //     await updateCashoutByBetId(`${sbetid}`, {
                //         flyAway: currentSecondNum
                //     })
                // }
                // previousHand = users;
                sendPreviousHand();
                currentSecondNum = 0;
                currentNum = target;
                GameState = "GAMEEND";
                NextState = "BET";
                startTime = Date.now();
                for (const k in users) {
                    const i = users[k];
                    // let fBetted = i.f.betted;
                    if (i.f.betted || i.f.cashouted) {
                        addHistory(i.userId, i.f.betAmount, i.f.target, i.f.cashouted)
                    }
                    i.f.betted = false;
                    i.f.cashouted = false;
                    i.f.betAmount = 0;
                    i.f.cashAmount = 0;
                    // let sBetted = i.s.betted;
                    if (i.s.betted || i.s.cashouted) {
                        addHistory(i.userId, i.s.betAmount, i.s.target, i.s.cashouted)
                    }
                    i.s.betted = false;
                    i.s.cashouted = false;
                    i.s.betAmount = 0;
                    i.s.cashAmount = 0;
                    sockets.map((socket) => {
                        // if (socket.id === i.socketId && (fBetted || sBetted)) {
                        //     console.log("Here")
                        //     socket.emit("finishGame", i);
                        // }
                        if (socket.id === i.socketId) {
                            socket.emit("finishGame", i);
                        }
                    })
                }

                time = Date.now() - startTime;

                botIds.map((item) => {
                    let userItem = { ...DEFAULT_USER, userName: getRandomName(), bot: true, userType: false }
                    users[item] = userItem
                })
            }
            mysocketIo.emit('gameState', { currentNum, currentSecondNum, GameState, time });
            break;
        case "GAMEEND":
            if (Date.now() - startTime > GAMEENDTIME) {

                let i = 0;
                let interval = setInterval(() => {
                    betBot(botIds[i]);
                    i++;
                    if (i > 15) clearInterval(interval);
                }, 100)
                sendInfo();

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

const sendInfo = () => {
    const info = [] as Array<{
        name: string
        betAmount: number
        cashOut: number
        cashouted: boolean
        target: number
        avatar: string
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
                    avatar: u.avatar
                })
            }

            if (u.s.betted || u.s.cashouted) {
                info.push({
                    name: u.userName,
                    betAmount: u.s.betAmount,
                    cashOut: u.s.cashAmount,
                    cashouted: u.s.cashouted,
                    target: u.s.target,
                    avatar: u.avatar
                })
            }
        }
    }
    if (info.length) mysocketIo.emit("bettedUserInfo", info);
}

const sendPreviousHand = () => {
    let myPreHand = [] as PreHandType[];
    for (let i in previousHand) {
        let u = previousHand[i];
        if (u.f.betted || u.f.cashouted) {
            myPreHand.push({
                name: u.userName,
                betAmount: u.f.betAmount,
                cashOut: u.f.cashAmount,
                target: u.f.target,
                avatar: u.avatar,
                cashouted: u.f.cashouted,
            });
        }
        if (u.s.betted || u.s.cashouted) {
            myPreHand.push({
                name: u.userName,
                betAmount: u.s.betAmount,
                cashOut: u.s.cashAmount,
                target: u.s.target,
                avatar: u.avatar,
                cashouted: u.s.cashouted,
            });
        }
    }
    mysocketIo.emit("previousHand", myPreHand);
}

// Bots bet in here.
function betBot(id: string) {
    let fbetAmount = getBotRandomBetAmount();
    let sbetAmount = getBotRandomBetAmount();
    users[id] = {
        ...DEFAULT_USER,
        userName: getRandomName(),
        avatar: getRandomAvatar(),
        bot: true,
        f: {
            auto: false,
            betted: true,
            cashouted: false,
            betAmount: fbetAmount,
            cashAmount: 0,
            betid: Date.now() + Math.floor(Math.random() * 1000),
            target: (Math.random() * (1 / Math.random() - 0.01)) + 1.01,
        },
        s: {
            auto: false,
            betted: false,
            cashouted: false,
            betAmount: sbetAmount,
            cashAmount: 0,
            betid: Date.now() + Math.floor(Math.random() * 1000),
            target: (Math.random() * (1 / Math.random() - 0.01)) + 1.01,
        },
    }
    // totalBetAmount += fbetAmount;
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
        sendInfo();
    }
}, 500);

export const initSocket = (io: Server) => {
    // create bots
    initBots()
    mysocketIo = io;
    io.on("connection", async (socket) => {

        sockets.push(socket);

        const sessionCheckHandler = async ({ token, UserID, currency, returnurl }: any) => {
            if (token && UserID && currency && returnurl)
                socket.emit('sessionSecure', { sessionStatus: true })
        }

        const getSeedHandler = () => {
            socket.emit("serverSeed", seed);
        }

        const sendMsgHandler = async ({ msgType, msgContent }: any) => {
            var u: any = users[socket.id];
            let data: any = await addChat(
                u.userId,
                u.userName,
                u.avatar,
                msgContent,
                msgType === "gif" ? msgContent : "")
            let emptyArray: any[] = [];
            let sendObj = {
                _id: data._id,
                userId: u.userId,
                userName: u.userName,
                avatar: u.avatar,
                message: msgContent,
                img: msgType === "gif" ? msgContent : "",
                likes: 0,
                likesIDs: emptyArray,
                disLikes: 0,
                disLikesIDs: emptyArray,
            }
            socket.emit("newMsg", sendObj);
            socket.broadcast.emit("newMsg", sendObj);
        }

        const enterRoomHandler = async (props: any) => {
            var { token, UserID, currency } = props;
            token = decodeURIComponent(token);
            UserID = decodeURIComponent(UserID);
            currency = decodeURIComponent(currency);

            socket.emit('getBetLimits', { max: localconfig.betting.max, min: localconfig.betting.min });
            if (token !== null && token !== undefined) {
                var Session_Token = crypto.randomUUID();
                const userInfo = await Authentication(token, UserID, currency, Session_Token);
                if (userInfo.status) {
                    users[socket.id] = {
                        ...DEFAULT_USER,
                        userId: UserID,
                        userName: userInfo.data.userName || getRandomName(),
                        balance: userInfo.data.balance,
                        avatar: userInfo.data.avatar,
                        currency: userInfo.data.currency,
                        isSoundEnable: userInfo.data.isSoundEnable,
                        isMusicEnable: userInfo.data.isMusicEnable,
                        ipAddress: userInfo.data.ipAddress,
                        Session_Token,
                        token,
                        socketId: socket.id
                    }
                    socket.emit('myInfo', users[socket.id]);
                    sendInfo();
                    io.emit('history', history);
                    const time = Date.now() - startTime;
                    io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
                } else {
                    console.log("Unregistered User at https://uat.vkingplays.com/")
                    socket.emit("deny", { message: "Unregistered User at https://uat.vkingplays.com/" });
                }
            } else {
                console.log("User token is invalid")
                socket.emit("deny", { message: "User token is invalid" });
            }
        }

        const playBetHandler = async (data: any) => {
            const { userInfo, betAmount, target, type, auto } = data;
            if (GameState === "BET") {
                let usrInfo: any = { ...userInfo };
                if (!!usrInfo) {
                    if (betAmount >= localconfig.betting.min && betAmount <= localconfig.betting.max) {
                        if (usrInfo.balance - betAmount >= 0) {

                            let betid = Date.now();
                            const betRes = await bet(usrInfo.userId, `${betid}`, usrInfo.balance, `${betAmount}`, usrInfo.currency, usrInfo.Session_Token);
                            if (betRes.status) {
                                if (type === 'f') {
                                    usrInfo.f.betAmount = betAmount;
                                    usrInfo.f.betted = true;
                                    usrInfo.f.betid = betid;
                                    usrInfo.f.auto = auto;
                                    usrInfo.f.target = target;
                                } else if (type === 's') {
                                    usrInfo.s.betAmount = betAmount;
                                    usrInfo.s.betted = true;
                                    usrInfo.s.betid = betid;
                                    usrInfo.s.auto = auto;
                                    usrInfo.s.target = target;
                                }
                                usrInfo.balance = betRes.balance;
                                users[socket.id] = usrInfo;

                                betNum++;
                                totalBetAmount += betAmount;
                                if (totalBetAmount > Number.MAX_SAFE_INTEGER) {
                                    totalBetAmount = betAmount;
                                    cashoutAmount = 0;
                                }

                                socket.emit("myBetState", { user: usrInfo, type });
                                await updateFlyDetailByBetId(`${betid}`, {
                                    totalUsers: betNum,
                                    totalBets: betNum,
                                    totalBetsAmount: totalBetAmount,
                                    flyEndTime: Date.now()
                                })
                            } else {
                                socket.emit('error', { message: betRes.message, index: type, userInfo: usrInfo });
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
        }

        const cashoutHandler = async (data: { userInfo: any, usrId: string, type: string, endTarget: number }) => {
            const { userInfo, type, endTarget } = data;
            let usrInfo: any = { ...userInfo };
            var player: any;
            if (type === 'f')
                player = usrInfo.f
            else if (type === 's')
                player = usrInfo.s
            if (!!usrInfo) {
                if (GameState === "PLAYING") {
                    if (!player.cashouted && player.betted) {
                        if (endTarget <= currentSecondNum && endTarget * player.betAmount) {
                            var returnData: any = await settle(usrInfo.userId, `${player.betid}`, player.betAmount.toFixed(2), endTarget.toFixed(2), (endTarget * player.betAmount).toFixed(2), usrInfo.currency, usrInfo.Session_Token);
                            if (returnData.status === true) {

                                player.cashouted = true;
                                player.cashAmount = endTarget * player.betAmount;
                                player.betted = false;
                                player.betid = 0;
                                player.target = endTarget;
                                usrInfo.balance = returnData.balance;
                                cashoutNum++;
                                cashoutAmount += endTarget * player.betAmount;

                                users[socket.id] = usrInfo;

                                let betid = 0;
                                if (type === 'f') betid = fbetid;
                                if (type === 's') betid = sbetid;
                                await updateFlyDetailByBetId(`${betid}`, {
                                    totalCashout: cashoutNum,
                                    totalCashoutAmount: cashoutAmount
                                })
                                socket.emit("finishGame", usrInfo);
                                socket.emit("success", {
                                    msg: "You have cashed out!",
                                    currency: player.currency,
                                    point: endTarget.toFixed(2),
                                    cashoutAmount: (endTarget * player.betAmount).toFixed(2),
                                });
                            } else {
                                socket.emit("error", { message: "You can't cash out!", index: type });
                            }
                        } else {
                            socket.emit("error", { message: "You can't cash out!", index: type });
                        }
                    }
                } else
                    socket.emit('error', { message: "You can't cash out!", index: type });
            } else
                socket.emit('error', { message: 'Undefined User', index: type });
        }

        const disconnectHandler = async () => {
            // var u: any = { ...await getUserBySocketId(socket.id) };
            var u: any = users[socket.id];
            const checkIndex = sockets.findIndex((s) => (
                s.id === socket.id
            ))

            if (checkIndex > -1) {
                if (u?.f?.betid > 0 || u?.s?.betid > 0) {
                    let betAmount = 0;
                    if (u.f.betted && !u.f.cashouted) {
                        betAmount += u.f.betAmount;
                        cancelBet(u.userId, `${u.f.betid}`, `${betAmount}`, u.token, u.Session_Token);
                    }
                    if (u.s.betted && !u.s.cashouted) {
                        betAmount += u.s.betAmount;
                        cancelBet(u.userId, `${u.s.betid}`, `${betAmount}`, u.token, u.Session_Token);
                    }
                }
                sockets.splice(checkIndex, 1);
                delete users[socket.id];
                // await deleteSocketUserBySocketId(socket.id);
            }
        }



        socket.on('sessionCheck', sessionCheckHandler)
        socket.on('getSeed', getSeedHandler)
        socket.on('sendMsg', sendMsgHandler)
        socket.on('enterRoom', enterRoomHandler)
        socket.on('playBet', playBetHandler)
        socket.on('cashOut', cashoutHandler)
        socket.on('disconnect', disconnectHandler)

        return () => {
            socket.off('sessionCheck', sessionCheckHandler)
            socket.off('getSeed', getSeedHandler)
            socket.off('sendMsg', sendMsgHandler)
            socket.off('enterRoom', enterRoomHandler)
            socket.off('playBet', playBetHandler)
            socket.off('cashOut', cashoutHandler)
            socket.off('disconnect', disconnectHandler)
        }

        // setInterval(() => {
        // if (GameState === NextGameState) {
        // NextGameState = NextState;
        // const time = Date.now() - startTime;
        // io.emit('gameState', { currentNum, currentSecondNum, GameState, time });
        // }
        // }, 100)
        // sendInfo();
    });

    const closeServer = () => {
        io.close(() => {
            process.exit(0);
        });
    }

    process.on('SIGINT', closeServer); // Handle CTRL+C
    process.on('SIGTERM', closeServer); // Handle termination signals
};