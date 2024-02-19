import { Request, Response } from "express";

import { setlog, getPaginationMeta, getIPAddress } from "../helper";
import axios from "axios";
import crypto from 'crypto';
import { addAuthenticationLog } from "../model/authenticationlog";
import UserModel, { addUser, getUserById, updateUserById } from "../model/users";
import { addSession, updateSessionByUserId } from "../model/sessions";
import { addBet } from "../model/bet";
import { addBetLog } from "../model/betlog";
import { addCashout, updateCashoutByBetId } from "../model/cashout";
import { addCashoutLog } from "../model/cashoutlog";
import { addGameLaunch } from "../model/gamelaunch";
import { getAllChatHistory, likesToChat } from "../model/chat";
import { addCancelBet } from "../model/cancelbet";
import { addCancelBetLog } from "../model/cancelbetlog";
import HistoryModel from "../model/history";
import GameSettingModel, { DEFAULT_GAMEID, getBettingAmounts } from "../model/gamesetting";
import { addErrorLog } from "../model/errorlog";

const serverURL = process.env.SERVER_URL || 'https://crash.casinocarnival.games';
const API_URL = process.env.API_URL || 'https://crashgame.vkingplays.com';
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


            let userData: any = await UserModel.findOne({ userId: UserID });
            // let ipAddressInfo: any = getIPAddress(req);
            // console.log(ipAddressInfo)

            var Session_Token = crypto.randomUUID();
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
            var _data = resData.data;
            // console.log("Game Launch URL Request", _data);
            if (!userData) {
                _data = _data.data;
                let balance = Number(_data.balance) || 0;
                userData = await addUser(_data.userName || "username", UserID, _data.currency || "INR", balance || 0, _data.avatar || "", "desktop", "admin", "0.0.0.0")
            }

            await addSession(UserID, Session_Token, token, userData.balance, userData.ipAddress || "0.0.0.0")

            const responseJson = {
                code: 200,
                message: "success",
                data: {
                    gameURL: `${serverURL}/?token=${encodeURIComponent(token)}&UserID=${encodeURIComponent(UserID)}&currency=${encodeURIComponent(currency)}&returnurl=${returnurl ? encodeURIComponent(returnurl) : encodeURIComponent(serverURL)}`
                }
            }
            await addGameLaunch(UserID, 200, "success", hashed, req.body, responseJson.data, Date.now(), Date.now());
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
        //         isSoundEnable: true,
        //         isMusicEnable: true,
        //         msgVisible: true,
        //         avatar: "./avatars/av-3.png",
        //     }
        // };
        // if (!Session_Token) {
        //     Session_Token = crypto.randomUUID();
        // }
        const sendData = {
            UserID,
            User_Token: token,
            Session_Token,
            currency
        }
        console.log("Authenticatoin ===> ", sendData)
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(getBalanceUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        let requestTime = Date.now()
        var _data = resData.data;
        console.log("Authentication Request", resData);
        if (_data.code === 200) {
            _data = _data.data;
            let userData: any = await UserModel.findOne({ userId: UserID });
            let balance = Number(_data.balance) || 0;
            if (!userData) {
                userData = await addUser(_data.userName, UserID, _data.currency, balance, _data.avatar, "desktop", "admin", "0.0.0.0")
            }
            await updateUserById(UserID, { balance })
            let responseTime = Date.now()
            await addAuthenticationLog(UserID, _data.code, _data.message, hashed, sendData, resData.data, requestTime, responseTime)
            return {
                status: true,
                data: {
                    userId: UserID,
                    userName: userData.userName,
                    balance,
                    currency: userData.currency,
                    isSoundEnable: userData.isSoundEnable,
                    isMusicEnable: userData.isMusicEnable,
                    msgVisible: userData.isChatEnable,
                    avatar: userData.avatar,
                    ipAddress: userData.ipAddress,
                }
            };
        } else {
            console.log(_data)
            await addErrorLog(UserID, "Authentication Request", _data.message);
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        await addErrorLog(UserID, "Authentication Request", err);
        return {
            status: false
        }
    }
}

export const bet = async (flyDetailID: number, UserID: string, betid: string, beforeBalance: number, betAmount: string, currency: string, Session_Token: string) => {
    try {
        // return {
        //     status: true,
        //     betid: "_data.betid",
        //     currency: "INR",
        //     balance: 5000
        // };
        // if (!Session_Token) {
        //     Session_Token = crypto.randomUUID();
        // }
        const sendData = {
            UserID,
            betAmount,
            betid,
            currency,
            Session_Token
        }
        console.log("PlaceBet ===> ", sendData)
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
            await addBet(flyDetailID, UserID, betid, beforeBalance, Number(betAmount), resBalance, resBalance, currency, Session_Token, "platform", false, 0);
            await addBetLog(UserID, betid, _data.code, _data.message, hashed, sendData, _data.data, requestTime, responseTime);
            return {
                status: true,
                betid: _data.betid,
                currency: _data.currency,
                balance: resBalance
            };
        } else {
            console.log(_data)
            await addErrorLog(UserID, "Place Bet Request", _data.message);
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        await addErrorLog(UserID, "Place Bet Request", err);
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

export const settle = async (
    UserID: string,
    betid: string,
    flyDetailID: string,
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
        // if (!Session_Token) {
        //     Session_Token = crypto.randomUUID();
        // }
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
        console.log("Cashout ===> ", sendData)
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
            await addCashout(UserID, betid, flyDetailID, Number(betAmount), afterBalance, Number(cashoutid), Number(cashoutPoint), Number(amount), afterBalance, 0, Session_Token);
            await addCashoutLog(UserID, betid, Number(cashoutid), _data.code, _data.message, hashed, sendData, _data.data, requestTime, responseTime);
            return {
                status: true,
                balance: afterBalance,
                betid: betid
            };
        } else {
            console.log(_data)
            await addErrorLog(UserID, "Cashout Request", _data.message);
            await cancelBet(UserID, betid, amount, currency, Session_Token);
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        await addErrorLog(UserID, "Place Bet Request", err);
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
        // if (!Session_Token) {
        //     Session_Token = crypto.randomUUID();
        // }
        const sendData = {
            userID: UserID,
            betid,
            amount,
            currency,
            Session_Token,
            cancelbetid: cancelbetid,
        }
        console.log("CancelBet ===> ", sendData)
        let userData: any = await getUserById(UserID);
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
            await addCancelBetLog(UserID, betid, cancelbetid, _data.code, _data.message, hashed, sendData, _data.data, requestTime, responseTime);
            return {
                status: true,
                balance: Number(_data.data.updatedBalance) || 0,
                betid: betid
            };
        } else {
            console.log(_data)
            await addErrorLog(UserID, "Cancel Bet Request", _data.message);
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        console.log(err);
        await addErrorLog(UserID, "Cancel Bet Request", err);
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

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
        await updateUserById(userId, updateData)
        if (updateData.ipAddress) {
            await updateSessionByUserId(userId, {
                ipAddress: updateData.ipAddress
            })
        }
        res.json({ status: true });
    } catch (error) {
        setlog("updateUserInfo", error)
        res.json({ status: false });
    }
}

export const updateCashout = async (req: Request, res: Response) => {
    try {
        const { betid, flyAway } = req.body as { betid: string, flyAway: number }
        if (!betid || !flyAway) return res.status(404).send("Invalid paramters")
        await updateCashoutByBetId(betid, {
            flyAway
        })
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
        await GameSettingModel.findOneAndUpdate({ _id: DEFAULT_GAMEID }, { minBetAmount, maxBetAmount }, { upsert: true });
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
        const data = await HistoryModel.find({ userId }).sort({ date: -1 }).limit(20);
        res.json({ status: true, data });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}

export const dayHistory = async (req: Request, res: Response) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await HistoryModel.aggregate([
            {
                $match: {
                    userId: { $ne: "0" },
                    cashouted: true,
                    createdAt: { $gte: oneDayAgo }
                }
            },
            {
                $lookup: {
                    from: "users", // The name of the collection to join
                    localField: "userId",
                    foreignField: "userId",
                    as: "userinfo" // The name of the field to add the joined data
                }
            },

            {
                $sort: { createdAt: -1 } // Sort by createdAt field in descending order (-1 for descending, 1 for ascending)
            },
            {
                $limit: 20
            }
        ]).exec();

        res.json({ status: true, data: result });
    } catch (error) {
        setlog('dayHistory', error)
        res.json({ status: false });
    }
}

export const monthHistory = async (req: Request, res: Response) => {
    try {
        const oneMonthAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

        const result = await HistoryModel.aggregate([
            {
                $match: {
                    userId: { $ne: "0" },
                    cashouted: true,
                    createdAt: { $gte: oneMonthAgo }
                }
            },
            {
                $lookup: {
                    from: "users", // The name of the collection to join
                    localField: "userId",
                    foreignField: "userId",
                    as: "userinfo" // The name of the field to add the joined data
                }
            },

            {
                $sort: { createdAt: -1 } // Sort by createdAt field in descending order (-1 for descending, 1 for ascending)
            },
            {
                $limit: 20
            }
        ]).exec();

        res.json({ status: true, data: result });
    } catch (error) {
        setlog('monthHistory', error)
        res.json({ status: false });
    }
}

export const yearHistory = async (req: Request, res: Response) => {
    try {
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

        const result = await HistoryModel.aggregate([
            {
                $match: {
                    userId: { $ne: "0" },
                    cashouted: true,
                    createdAt: { $gte: oneYearAgo }
                }
            },
            {
                $lookup: {
                    from: "users", // The name of the collection to join
                    localField: "userId",
                    foreignField: "userId",
                    as: "userinfo" // The name of the field to add the joined data
                }
            },

            {
                $sort: { createdAt: -1 } // Sort by createdAt field in descending order (-1 for descending, 1 for ascending)
            },
            {
                $limit: 20
            }
        ]).exec();
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