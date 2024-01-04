import { Request, Response } from "express";

import { DEFAULT_GAMEID, DGame, DHistories, TblUser, getBettingAmounts, likesToChat } from "../model";
import { setlog, getPaginationMeta } from "../helper";
import axios from "axios";
import crypto from 'crypto';
import { addAuthenticationLog } from "../model/authenticationlog";
import { addUser, getUserById, updateUserById } from "../model/users";
import { addSession } from "../model/sessions";
import { addBet } from "../model/bet";
import { addBetLog } from "../model/betlog";
import { addCashout } from "../model/cashout";
import { addCashoutLog } from "../model/cashoutlog";
import { addGameLaunch } from "../model/gamelaunch";
import { getAllChatHistory } from "../model/chat";
import { addCancelBet } from "../model/cancelbet";
import { addCancelBetLog } from "../model/cancelbetlog";

const serverURL = process.env.SERVER_URL || 'https://crashgameapi.vkingplays.com';
const API_URL = process.env.API_URL || 'https://crash.casinocarnival.games';
const getBalanceUrl = `${API_URL}${process.env.GET_BALANCE_URL || '/Authentication'}`;
const betUrl = `${API_URL}${process.env.BET_URL || '/placeBet'}`;
const cancelUrl = `${API_URL}${process.env.ORDER_URL || '/cancel'}`;
const cashoutUrl = `${API_URL}${process.env.CASHOUT_URL || '/cashout'}`;
const secret = process.env.JWT_SECRET || `brxJydVrU4agdgSSbnMNMQy01bNE8T5G`;

export const hashFunc = async (obj: any) => {
    var hmac = await crypto.createHmac('SHA256', secret)
        .update(JSON.stringify(obj).trim())
        .digest('base64');

    return hmac;
}

export const GameLaunch = async (req: Request, res: Response) => {
    try {
        var hashed = await hashFunc(req.body);
        if (hashed === req.get('hashkey')) {
            const { UserID, token, currency, returnurl = "" } = req.body;

            if (!UserID || !token || !currency) return res.status(404).send("Invalid paramters");

            const userData = await TblUser.findOne({ "userId": UserID });
            let ipAddress = req.socket.remoteAddress;

            if (!userData) {
                await addUser("userName", UserID, currency, 0, "", "", "admin", ipAddress)
            }
            const responseJson = {
                code: 200,
                message: "success",
                data: {
                    gameURL: `${serverURL}/?token=${encodeURIComponent(token)}&UserID=${encodeURIComponent(UserID)}&currency=${encodeURIComponent(currency)}&returnurl=${returnurl ? encodeURIComponent(returnurl) : encodeURIComponent(serverURL)}`
                }
            }
            await addGameLaunch(UserID, 200, "success", hashed, req.body, responseJson, Date.now(), Date.now());
            res.status(200).send(responseJson);
        } else {
            return res.status(401).send("User token is invalid");
        }

    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal error");
    }
}

export const Authentication = async (token: string, UserID: string, currency: string, Session_Token: string) => {
    try {
        // return {
        //     status: true,
        //     data: {
        //         userId: UserID,
        //         userName: "_data.userName",
        //         balance: 50000,
        //         currency: "INR",
        //         audioStatus: true,
        //         musicStatus: true,
        //         msgVisible: true,
        //         avatar: "./avatars/av-3.png",
        //     }
        // };
        const sendData = {
            UserID,
            User_Token: token,
            Session_Token,
            currency
        }
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(getBalanceUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        let requestTime = Date.now()
        var _data = resData.data;
        if (_data.code === 200) {
            _data = _data.data;
            const userData: any = await TblUser.findOne({ "userId": UserID });
            let balance = Number(_data.balance) || 0;
            if (!userData) {
                await addUser(_data.userName, UserID, _data.currency, balance, _data.avatar, "", "admin", "server")
            }
            await updateUserById(UserID, { balance })
            let responseTime = Date.now()
            await addAuthenticationLog(UserID, _data.code, _data.message, hashed, sendData, resData.data, requestTime, responseTime)
            await addSession(UserID, Session_Token, token, balance, userData.ipAddress || "server")
            return {
                status: true,
                data: {
                    userId: UserID,
                    userName: _data.userName,
                    balance,
                    currency: _data.currency,
                    audioStatus: userData.audioStatus,
                    musicStatus: userData.musicStatus,
                    msgVisible: userData.msgVisible,
                    avatar: _data.avatar,
                }
            };
        } else {
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        return {
            status: false
        }
    }
}

export const bet = async (UserID: string, betid: string, beforeBalance: number, betAmount: string, currency: string, Session_Token: string) => {
    try {
        // return {
        //     status: true,
        //     betid: "_data.betid",
        //     currency: "INR",
        //     balance: 5000
        // };
        const sendData = {
            UserID,
            betAmount,
            betid,
            currency,
            Session_Token
        }
        var hashed = await hashFunc(sendData);
        let requestTime = Date.now();
        const resData = await axios.post(betUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })

        const _data = resData.data;
        if (_data.code === 200) {
            let resBalance = Number(_data.data.updatedBalance) || 0;
            let responseTime = Date.now();
            await updateUserById(UserID, { balance: resBalance })
            await addBet(UserID, betid, beforeBalance, Number(betAmount), resBalance, resBalance, currency, Session_Token, "platform", false, 0);
            await addBetLog(UserID, betid, _data.code, _data.message, hashed, sendData, _data, requestTime, responseTime);
            return {
                status: true,
                betid: _data.betid,
                currency: _data.currency,
                balance: resBalance
            };
        } else {
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

export const settle = async (
    UserID: string,
    betid: string,
    betAmount: string,
    cashoutPoint: string,
    amount: string,
    currency: string,
    Session_Token: string
) => {
    try {
        // return {
        //     status: true,
        //     balance: 5000,
        //     betid: "_data.betid",
        // };
        const cashoutid = `${Date.now() + Math.floor(Math.random() * 1000)}`;
        const sendData = {
            UserID,
            betid,
            cashoutPoint,
            amount,
            currency,
            Session_Token,
            cashoutid
        }
        var hashed = await hashFunc(sendData);
        let requestTime = Date.now();
        const resData = await axios.post(cashoutUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        const _data = resData.data;
        if (_data.code === 200) {
            let afterBalance = Number(_data.data.updatedBalance) || 0
            let responseTime = Date.now();
            await updateUserById(UserID, { balance: afterBalance })
            await addCashout(UserID, betid, Number(betAmount), afterBalance, Number(cashoutid), Number(cashoutPoint), Number(amount), afterBalance, 0, Session_Token);
            await addCashoutLog(UserID, betid, Number(cashoutid), _data.code, _data.message, hashed, sendData, _data, requestTime, responseTime);
            return {
                status: true,
                balance: afterBalance,
                betid: betid
            };
        } else {
            await cancelBet(UserID, betid, amount, currency, Session_Token);
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        await cancelBet(UserID, betid, amount, currency, Session_Token);
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

export const cancelBet = async (UserID: string, betid: string, amount: string, currency: string, Session_Token: string) => {
    try {
        const cancelbetid = `CAN${Date.now() + Math.floor(Math.random() * 1000)}`;
        const sendData = {
            userID: UserID,
            betid,
            amount,
            currency,
            Session_Token,
            cancelbetid: cancelbetid,
        }
        const userData: any = await getUserById(UserID);
        var hashed = await hashFunc(sendData);
        let requestTime = Date.now();
        const resData = await axios.post(cancelUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        const _data = resData.data;
        if (_data.code === 200) {
            let responseTime = Date.now();
            await addCancelBet(UserID, betid, Number(amount), `${cancelbetid}`, Session_Token, userData.data.balance, userData.data.balance, userData.data.balance, Date.now())
            await addCancelBetLog(UserID, betid, cancelbetid, _data.code, _data.message, hashed, sendData, _data, requestTime, responseTime);
            return {
                status: true,
                balance: Number(_data.data.updatedBalance) || 0,
                betid: betid
            };
        } else {
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

// export const cancelBet = async (betid: number, balance: number, token: string) => {
//     try {
//         const resData = await axios.post(cancelUrl, {
//             gameCode: 'Crash',
//             betid,
//             amount: balance,
//             // token: testToken
//             token
//         })
//         const _data = resData.data.data;
//         if (!resData.data.success) {
//             return {
//                 status: false,
//                 message: "Service Exception"
//             };
//         }

//         return {
//             status: true,
//             balance: _data.amount,
//             betid: _data.betid
//         };

//     } catch (err) {
    // console.log(err);
//         return {
//             status: false,
//             message: "Internal Exception"
//         };
//     }
// }

export const getGameInfo = async (req: Request, res: Response) => {
    try {
        const data = await getBettingAmounts()
        res.json({ status: true, data });
    } catch (error) {
        setlog("getGameInfo", error)
        return res.status(500).send("Internal error");
    }
}

export const updateUserInfo = async (req: Request, res: Response) => {
    try {
        const { userId, updateData } = req.body as { userId: string, updateData: any }
        if (!userId || !updateData) return res.status(404).send("Invalid paramters")
        await TblUser.updateOne({ userId }, { $set: { ...updateData } }, { upsert: true });
        res.json({ status: true });
    } catch (error) {
        setlog("updateUserInfo", error)
        res.json({ status: false });
    }
}

export const updateGameInfo = async (req: Request, res: Response) => {
    try {
        const { min, max } = req.body as { min: number, max: number }
        const minBetAmount = Number(min)
        const maxBetAmount = Number(max)
        if (isNaN(minBetAmount) || isNaN(maxBetAmount)) return res.status(404).send("invalid paramters")
        await DGame.updateOne({ _id: DEFAULT_GAMEID }, { $set: { minBetAmount, maxBetAmount } }, { upsert: true });
        res.json({ status: true });
    } catch (error) {
        setlog("updateGameInfo", error)
        res.json({ status: false });
    }
}

export const myInfo = async (req: Request, res: Response) => {
    try {
        let { userId } = req.body as { userId: string };
        if (!userId) return res.status(404).send("invalid paramters")
        const data = await DHistories.find({ userId }).sort({ date: -1 }).limit(20).toArray();
        res.json({ status: true, data });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}

export const dayHistory = async (req: Request, res: Response) => {
    try {
        let nowDate_ = Date.now();
        let nowDate = Math.round(nowDate_)
        let oneDay = 60 * 60 * 24 * 1000;

        const result = await DHistories.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "userId",
                    as: "userinfo"
                }
            },
            {
                $match: {
                    userId: { $ne: "0" },
                    cashouted: true,
                    date: { $gte: (nowDate - oneDay), $lt: nowDate }
                }
            },
            {
                $sort: { date: -1 }
            },
            {
                $limit: 20
            }
        ]).toArray();

        res.json({ status: true, data: result });
    } catch (error) {
        setlog('dayHistory', error)
        res.json({ status: false });
    }
}

export const monthHistory = async (req: Request, res: Response) => {
    try {
        let nowDate_ = Date.now();
        let nowDate = Math.round(nowDate_)
        let oneDay = 60 * 60 * 24 * 30 * 1000;

        const result = await DHistories.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "userId",
                    as: "userinfo"
                }
            },
            {
                $match: {
                    userId: { $ne: "0" },
                    cashouted: true,
                    date: { $gte: (nowDate - oneDay), $lt: nowDate }
                }
            },
            {
                $sort: { date: -1 }
            },
            {
                $limit: 20
            }
        ]).toArray();

        res.json({ status: true, data: result });
    } catch (error) {
        setlog('monthHistory', error)
        res.json({ status: false });
    }
}

export const yearHistory = async (req: Request, res: Response) => {
    try {
        let nowDate_ = Date.now();
        let nowDate = Math.round(nowDate_)
        let oneDay = 60 * 60 * 24 * 365 * 1000;
        const result = await DHistories.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "userId",
                    as: "userinfo"
                }
            },
            {
                $match: {
                    userId: { $ne: "0" },
                    cashouted: true,
                    date: { $gte: (nowDate - oneDay), $lt: nowDate }
                }
            },
            {
                $sort: { date: -1 }
            },
            {
                $limit: 20
            }
        ]).toArray();
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('yearHistory', error)
        res.json({ status: false });
    }
}

export const getAllChats = async (req: Request, res: Response) => {
    try {
        const data = await getAllChatHistory();
        res.json({ status: true, data });
    } catch (error) {
        setlog('get all chats', error)
        res.json({ status: false });
    }
}

export const likesToChatFunc = async (req: Request, res: Response) => {
    try {
        let { chatID, userId } = req.body as { chatID: number, userId: string };
        if (!chatID || !userId) return res.status(404).send("Invalid Paramters");
        const data = await likesToChat(chatID, userId);
        res.json({ ...data });
    } catch (error) {
        setlog('like chats', error)
        res.json({ status: false });
    }
}