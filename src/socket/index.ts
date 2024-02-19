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
import { updateCashoutsByFlyDetailId } from '../model/cashout';
import { addFlyDetail, updateFlyDetail } from '../model/flydetail';
import { addHistory } from '../model/history';
import { getSessionByUserId } from '../model/sessions';

let mysocketIo: Server;
let users = {} as { [key: string]: UserType }
let sockets = [] as Socket[];
let previousHand = users;
let history = [] as number[];
let GameState = "BET";
let NextGameState = "READY";
let NextState = "READY";
let flyAway = 1;
let startTime = Date.now();
let flyEndTime = Date.now();
let gameTime: number;
let currentNum: number;
let lastSecondNum: number;
let currentSecondNum: number;
let target: number = -1;
let cashoutAmount = 0;
let totalBetAmount = 0;
let flyDetailID: any = {};

const diffLimit = 9; // When we lost money, decrease RTP by this value, but be careful, if this value is high, the more 1.00 x will appear and users might complain.
const salt = process.env.SALT || '8783642fc5b7f51c08918793964ca303edca39823325a3729ad62f0a2';
var seed = crypto.createHash('sha256').update(`${Date.now()}`).digest('hex');
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

                mysocketIo.emit('gameState', { currentNum, lastSecondNum, currentSecondNum, GameState, time });
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
                let resp: any = await addFlyDetail(startTime, startTime, startTime, 0, 0, 0, 0, 0, 0, startTime);
                flyDetailID = resp._id;
                mysocketIo.emit('gameState', { currentNum, lastSecondNum, currentSecondNum, GameState, time });
            }
            break;
        case "PLAYING":
            var currentTime = (Date.now() - startTime) / 1000;
            currentNum = 1 + 0.06 * currentTime + Math.pow((0.06 * currentTime), 2) - Math.pow((0.04 * currentTime), 3) + Math.pow((0.04 * currentTime), 4)
            currentSecondNum = currentNum;
            lastSecondNum = currentNum;

            let time = Date.now() - startTime;
            if (currentTime > gameTime) {
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
            mysocketIo.emit('gameState', { currentNum, lastSecondNum, currentSecondNum, GameState, time });
            break;
        case "GAMEEND":
            if (Date.now() - startTime > GAMEENDTIME) {
                let gameEndTime = currentSecondNum;
                let i = 0;
                let interval = setInterval(() => {
                    betBot(botIds[i]);
                    i++;
                    sendInfo();
                    if (i > 15) clearInterval(interval);
                }, 100)
                startTime = Date.now();
                GameState = "BET";
                NextState = "READY";
                history.unshift(target);
                mysocketIo.emit("history", history);
                const time = Date.now() - startTime;
                mysocketIo.emit('gameState', { currentNum, lastSecondNum, currentSecondNum: gameEndTime, GameState, time });

                flyEndTime = Date.now();
                await updateFlyDetail(flyDetailID, { flyEndTime, flyAway: gameEndTime.toFixed(2) });
                await updateCashoutsByFlyDetailId(flyDetailID, { flyAway: gameEndTime.toFixed(2) });
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
                var Session_Token: string = crypto.randomUUID();
                let session: any = await getSessionByUserId(UserID) || {}
                if (session.sessionToken) {
                    Session_Token = session.sessionToken;
                }
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
                    io.emit('gameState', { currentNum, lastSecondNum, currentSecondNum, GameState, time });
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
            const { userInfo, type } = data;
            if (GameState === "BET") {
                let usrInfo: any = { ...userInfo };
                if (!!usrInfo) {
                    if (usrInfo[type].betAmount >= localconfig.betting.min && usrInfo[type].betAmount <= localconfig.betting.max) {
                        if (usrInfo.balance - usrInfo[type].betAmount >= 0) {
                            const betRes = await bet(flyDetailID, usrInfo.userId, `${usrInfo[type].betid}`, usrInfo.balance, `${usrInfo[type].betAmount}`, usrInfo.currency, usrInfo.Session_Token);
                            if (betRes.status) {
                                usrInfo.balance = betRes.balance;
                                users[socket.id] = usrInfo;

                                betNum++;
                                totalBetAmount += usrInfo[type].betAmount;
                                if (totalBetAmount > Number.MAX_SAFE_INTEGER) {
                                    totalBetAmount = usrInfo[type].betAmount;
                                    cashoutAmount = 0;
                                }
                                socket.emit("myBetState", { user: usrInfo, type });
                                await updateFlyDetail(flyDetailID, {
                                    totalUsers: betNum,
                                    totalBets: betNum,
                                    totalBetsAmount: totalBetAmount
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
            console.log(userInfo, type, endTarget);
            var player: any;
            if (type === 'f')
                player = usrInfo.f
            else if (type === 's')
                player = usrInfo.s
            if (!!usrInfo) {
                if (GameState === "PLAYING") {
                    if (!player.cashouted && player.betted) {
                        if (endTarget <= currentSecondNum && endTarget * player.betAmount) {
                            var returnData: any = await settle(usrInfo.userId, `${player.betid}`, `${flyDetailID}`, player.betAmount.toFixed(2), endTarget.toFixed(2), (endTarget * player.betAmount).toFixed(2), usrInfo.currency, usrInfo.Session_Token);
                            if (returnData.status === true) {

                                player.cashouted = true;
                                player.cashAmount = endTarget * player.betAmount;
                                player.betted = false;
                                // player.betid = '0';
                                player.target = endTarget;
                                usrInfo.balance = returnData.balance;
                                cashoutNum++;
                                cashoutAmount += endTarget * player.betAmount;
                                usrInfo[type] = player;
                                users[socket.id] = usrInfo;
                                socket.emit("finishGame", usrInfo);
                                socket.emit("success", {
                                    msg: "You have cashed out!",
                                    currency: player.currency,
                                    point: endTarget.toFixed(2),
                                    cashoutAmount: (endTarget * player.betAmount).toFixed(2),
                                });

                                await updateFlyDetail(flyDetailID, {
                                    totalCashout: cashoutNum,
                                    totalCashoutAmount: cashoutAmount
                                })
                            } else {
                                console.log("1")
                                socket.emit("error", { message: "You can't cash out!", index: type });
                            }
                        } else {
                            console.log("2")
                            socket.emit("error", { message: "You can't cash out!", index: type });
                        }
                    }
                } else {
                    console.log("3")
                    socket.emit('error', { message: "You can't cash out!", index: type });
                }
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