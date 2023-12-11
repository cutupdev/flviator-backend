import { Request, Response } from "express";

import { DEFAULT_GAMEID, DGame, DHistories, DUsers, getBettingAmounts, addUser } from "../model";
import { setlog, getPaginationMeta } from "../helper";
import axios from "axios";
import path from 'path';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const envUrl = process.env.NODE_ENV ? (process.env.NODE_ENV === 'development' ? '../../.env.development' : '.env.' + process.env.NODE_ENV) : '.env.test';
require('dotenv').config({ path: path.join(__dirname, envUrl) });

// const serverURL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.SERVER_URL || 'http://45.8.22.45:3000';
const serverURL = process.env.SERVER_URL || 'http://45.8.22.45:3000';
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

const test = async () => {
    console.log(await hashFunc({
        UserID: "Smith1#167",
        currency: "INR"
    }))
}

test()

export const GameLaunch = async (req: Request, res: Response) => {
    try {
        var hashed = await hashFunc(req.body);
        if (hashed === req.get('hashkey')) {
            // UserID,currency,returnurl

            const { UserID, currency, returnurl = "" } = req.body;

            if (!UserID || !currency) return res.status(404).send("Invalid paramters");

            const userData = await DUsers.findOne({ "userId": UserID });

            if (!userData) {
                await addUser("", UserID, '', currency, 0)
                console.log('Added new user', UserID)
            }

            var session_token = jwt.sign({ userId: UserID }, secret, { expiresIn: '1h' });

            res.send({
                status: true,
                data: {
                    gameURL: `${serverURL}/?token=${session_token}&userID=${UserID}&currency=${currency}&return_url=${returnurl ? returnurl : serverURL}`
                }
            });
        } else {
            return res.status(401).send("User token is invalid");
        }

    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal error");
    }
}

export const Authentication = async (userId: string) => {
    try {
        const sendData = {
            UserID: userId
        }
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(getBalanceUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        const _data = resData.data.data;
        if (!resData.data.status) {
            return {
                status: false
            }
        }
        console.log("_data", _data)

        const userData = await DUsers.findOne({ "userId": _data.userId });
        if (!userData) {
            await addUser(_data.userName, userId, _data.avatar, _data.currency, _data.balance)
            console.log('add-user', _data.userId, _data.balance)
        }

        return {
            status: true,
            data: {
                userId: userId,
                userName: _data.userName,
                currency: _data.currency,
                avatar: _data.avatar,
                balance: _data.balance,
            }
        };

    } catch (err) {
        console.log(err);
        return {
            status: false
        }
    }
}

// const makeTestUser = async () => {
//     const user = await DUsers.findOne({ "userId": "1" });
//     if (!user) {
//         await addUser("test-user", "1", "", "INR", 5000)
//     }
//     const user1 = await DUsers.findOne({ "userId": "1" });
//     return {
//         status: true,
//         data: {
//             userId: user1.userId,
//             userName: "test-user",
//             avatar: "",
//             balance: 500000,
//         }
//     };
// }


export const bet = async (userId: string, betAmount: string, currency: string) => {
    try {
        const orderNo = Date.now() + Math.floor(Math.random() * 1000);
        const sendData = {
            UserID: userId,
            betAmount,
            betid: `${orderNo}`,
            currency,
        }
        console.log(sendData);
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(betUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })


        const _data = resData.data;
        console.log('_data', _data)
        if (!_data.status) {
            return {
                status: false,
                message: "Service Exception"
            };
        }

        return {
            status: true,
            orderNo: orderNo,
            balance: _data.updatedBalance
        };

    } catch (err) {
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

export const settle = async (userId: string, orderNo: string, cashoutPoint: string, amount: string, currency: string) => {
    try {
        const sendData = {
            UserID: userId,
            betid: orderNo,
            currency,
            cashoutPoint,
            amount,
        }
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(cashoutUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        const _data = resData.data;
        if (!resData.data.success) {
            return {
                status: false,
                message: "Service Exception"
            };
        }

        return {
            status: true,
            balance: _data.updatedBalance,
            orderNo: orderNo
        };

    } catch (err) {
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

export const cancelBet = async (orderNo: number, balance: number, token: string) => {
    try {
        const resData = await axios.post(cancelUrl, {
            gameCode: 'Crash',
            orderNo,
            amount: balance,
            // token: testToken
            token
        })
        const _data = resData.data.data;
        if (!resData.data.success) {
            return {
                status: false,
                message: "Service Exception"
            };
        }

        return {
            status: true,
            balance: _data.amount,
            orderNo: _data.orderNo
        };

    } catch (err) {
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
        const sendData = req.body
        var hashed = await hashFunc(sendData);
        if (hashed === req.get('hashkey')) {
            let { id } = req.body as { id: string };
            if (!id) return res.status(404).send("invalid paramters")
            const data = await DHistories.find({ userId: id }).sort({ date: -1 }).limit(20).toArray();
            res.json({ status: true, data });
        } else {
            return res.status(401).send("User token is invalid");
        }
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}

export const dayHistory = async (req: Request, res: Response) => {
    try {
        let nowDate_ = Date.now();
        let nowDate = Math.round(nowDate_ / 1000)
        let oneDay = 60 * 60 * 24;
        // limit = Number(limit) || 20
        // if (limit < 10) limit = 10
        // if (limit > 100) limit = 100
        // const count = await DHistories.count({})
        // const meta = getPaginationMeta(Number(page) || 0, count, limit)
        // const result = await DHistories.find({ _id: { $gte: meta.page * meta.limit, $lt: (meta.page * meta.limit + meta.limit) } }).sort({ date: -1 }).toArray()
        const result = await DHistories.find({ cashouted: true, date: { $gte: (nowDate - oneDay), $lt: nowDate } }).sort({ cashoutAt: -1 }).limit(20).toArray()
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}

export const monthHistory = async (req: Request, res: Response) => {
    try {
        let nowDate_ = Date.now();
        let nowDate = Math.round(nowDate_ / 1000)
        let oneDay = 60 * 60 * 24 * 30;
        const result = await DHistories.find({ cashouted: true, date: { $gte: (nowDate - oneDay), $lt: nowDate } }).sort({ cashoutAt: -1 }).limit(20).toArray()
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}

export const yearHistory = async (req: Request, res: Response) => {
    try {
        let nowDate_ = Date.now();
        let nowDate = Math.round(nowDate_ / 1000)
        let oneDay = 60 * 60 * 24 * 365;
        const result = await DHistories.find({ cashouted: true, date: { $gte: (nowDate - oneDay), $lt: nowDate } }).sort({ cashoutAt: -1 }).limit(20).toArray()
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}