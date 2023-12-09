import { Request, Response } from "express";

import { DEFAULT_GAMEID, DGame, DHistories, DUsers, getBettingAmounts, addUser } from "../model";
import { setlog, getPaginationMeta } from "../helper";
import axios from "axios";
import path from 'path';
import jwt from 'jsonwebtoken';


// const envUrl = process.env.NODE_ENV === 'development' ? '../../.env.development' : '../../.env.production';
// require('dotenv').config({ path: path.join(__dirname, envUrl) });

const serverURL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.SERVER_URL || 'http://45.8.22.45:3000';
const API_URL = process.env.API_URL || 'https://crashgame.vkingplays.com';
const getBalanceUrl = `${API_URL}${process.env.GET_BALANCE_URL || '/getUserInfo'}`;
const betUrl = `${API_URL}${process.env.BET_URL || '/placeBet'}`;
const cancelUrl = `${API_URL}${process.env.ORDER_URL || '/cancel'}`;
const cashoutUrl = `${API_URL}${process.env.CASHOUT_URL || '/cashout'}`;
const secret = process.env.JWT_SECRET || `brxJydVrU4agdgSSbnMNMQy01bNE8T5G`;


// console.log('jwtToken', jwtToken)

// var decoded = jwt.verify(jwtToken, 'isthissecret123?');

// console.log('decoded', decoded)

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE3MDIwNDAxMzIsImV4cCI6MTcwMjA0MzczMn0.7OX2ddbOlmuU0LWHAqEnJX9y8gAYeTezhCg8iWdfgeM

export const getUserSession = async (req: Request, res: Response) => {
    try {
        const { userName, userId, avatar = "", balance, currency } = req.body;
        if (!userId || !userName || !balance || !currency) return res.status(404).send("Invalid paramters");
        const userData = await DUsers.findOne({ "userId": userId });
        if (!userData) {
            await addUser(userName, userId, avatar, currency, balance)
            console.log('add-user', userId, balance)
        }

        var token = jwt.sign({ userId }, secret, { expiresIn: '1h' });

        res.send({
            status: true,
            data: {
                gameURL: `${serverURL}/?cert=${token}`
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).send("Something went wrong");
        // return await makeTestUser();
    }
}

export const getUserInfo = async (userId: string) => {
    try {
        console.log("get user info called")
        const resData = await axios.post(getBalanceUrl, {
            UserID: userId
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const _data = resData.data.data;
        console.log("_data", _data)
        if (!resData.data.success) {
            return {
                status: false
            }
            // return await makeTestUser();
        }

        const userData = await DUsers.findOne({ "userId": _data.userId });
        console.log("userData1", userData)
        if (!userData) {
            await addUser(_data.userName, _data.userId, _data.avatar, _data.currency, _data.balance)
            console.log('add-user', _data.userId, _data.userBalance)
        }

        console.log("userData2", userData)

        return {
            status: true,
            data: {
                userId: _data.userId,
                userName: _data.userName,
                avatar: _data.avatar,
                balance: _data.userBalance,
            }
        };

    } catch (err) {
        console.log(err);
        return {
            status: false
        }
        // return await makeTestUser();
    }
}

const makeTestUser = async () => {
    const user = await DUsers.findOne({ "userId": "1" });
    if (!user) {
        await addUser("test-user", "1", "", "INR", "5000")
    }
    const user1 = await DUsers.findOne({ "userId": "1" });
    return {
        status: true,
        data: {
            userId: user1.userId,
            userName: "test-user",
            avatar: "",
            balance: 500000,
        }
    };
}

export const bet = async (userId: number, betAmount: number) => {
    try {
        const orderNo = Date.now() + Math.floor(Math.random() * 1000);
        const resData = await axios.post(betUrl, {
            gameCode: 'Crash',
            orderNo,
            betAmount,
            userId
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
            orderNo: _data.orderNo,
            balance: _data.amount
        };

    } catch (err) {
        return {
            status: false,
            message: "Exception"
        };
    }
}

export const cashout = async (userId: string, orderNo: number, cashoutPoint: string, amount: number) => {
    try {
        const resData = await axios.post(cashoutUrl, {
            gameCode: 'Crash',
            betId: orderNo,
            currency: "INR",
            userId,
            cashoutPoint,
            amount,
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
            message: "Exception"
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
            message: "Exception"
        };
    }
}

export const getGameInfo = async (req: Request, res: Response) => {
    try {
        const data = await getBettingAmounts()
        res.json({ status: true, data });
    } catch (error) {
        setlog("getGameInfo", error)
        res.send({ status: false });
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
        let { id } = req.body as { id: number };
        if (!id) return res.status(404).send("invalid paramters")
        const data = await DHistories.find({ userId: id }).sort({ date: -1 }).limit(20).toArray();
        res.json({ status: true, data });
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