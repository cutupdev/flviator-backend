import { Request, Response } from "express";

import { DEFAULT_GAMEID, DGame, DHistories, DUsers, getBettingAmounts, addUser } from "../model";
import { setlog, getPaginationMeta } from "../helper";
import axios from "axios";
import crypto from 'crypto';

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

export const GameLaunch = async (req: Request, res: Response) => {
    try {
        var hashed = await hashFunc(req.body);
        if (hashed === req.get('hashkey')) {
            const { UserID, token, currency, returnurl = "" } = req.body;

            if (!UserID || !token || !currency) return res.status(404).send("Invalid paramters");

            const userData = await DUsers.findOne({ "userId": UserID });

            if (!userData) {
                await addUser(UserID, "", 0, currency, '')
            }

            res.status(200).send({
                code: 200,
                message: "success",
                data: {
                    gameURL: `${serverURL}/?token=${encodeURIComponent(token)}&UserID=${encodeURIComponent(UserID)}&currency=${encodeURIComponent(currency)}&returnurl=${returnurl ? encodeURIComponent(returnurl) : encodeURIComponent(serverURL)}`
                }
            });
        } else {
            return res.status(401).send("User token is invalid");
        }

    } catch (err) {
        return res.status(500).send("Internal error");
    }
}

export const Authentication = async (token: string, UserID: string, currency: string, Session_Token: string) => {
    try {
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
        if (_data.code === 200) {
            _data = _data.data;
            const userData = await DUsers.findOne({ "userId": UserID });
            if (!userData) {
                await addUser(UserID, _data.username, _data.balance, _data.currency, _data.avatar)
            }
            // Code,Message,data:[userid,username,balance,currency,avatar]
            return {
                status: true,
                data: {
                    userId: UserID,
                    userName: _data.username,
                    balance: Number(_data.balance) || 0,
                    currency: _data.currency,
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


export const bet = async (UserID: string, betid: string, betAmount: string, currency: string, Session_Token: string) => {
    try {
        const sendData = {
            UserID,
            betAmount,
            betid,
            currency,
            Session_Token
        }
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(betUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })

        const _data = resData.data;
        if (_data.code === 200) {
            return {
                status: true,
                orderNo: _data.betid,
                currency: _data.currency,
                balance: Number(_data.data.updatedBalance) || 0
            };
        } else {
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

export const settle = async (UserID: string, orderNo: string, cashoutPoint: string, amount: string, currency: string, Session_Token: string) => {
    try {
        const cashoutid = `${Date.now() + Math.floor(Math.random() * 1000)}`;
        const sendData = {
            UserID,
            betid: orderNo,
            cashoutPoint,
            amount,
            currency,
            Session_Token,
            cashoutid
        }
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(cashoutUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        const _data = resData.data;
        if (_data.code === 200) {
            return {
                status: true,
                balance: Number(_data.data.updatedBalance) || 0,
                orderNo: orderNo
            };
        } else {
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

export const cancelBet = async (UserID: string, betid: string, amount: string, currency: string, Session_Token: string) => {
    try {
        const cancelbetid = Date.now() + Math.floor(Math.random() * 1000);
        const sendData = {
            userID: UserID,
            betid,
            amount,
            currency,
            Session_Token,
            cancelbetid: "CAN1702461170676",
        }
        var hashed = await hashFunc(sendData);
        const resData = await axios.post(cancelUrl, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'hashkey': hashed
            }
        })
        const _data = resData.data;
        if (_data.code === 200) {
            return {
                status: true,
                balance: Number(_data.data.updatedBalance) || 0,
                orderNo: betid
            };
        } else {
            return {
                status: false,
                message: _data.message
            };
        }

    } catch (err) {
        return {
            status: false,
            message: "Internal Exception"
        };
    }
}

// export const cancelBet = async (orderNo: number, balance: number, token: string) => {
//     try {
//         const resData = await axios.post(cancelUrl, {
//             gameCode: 'Crash',
//             orderNo,
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
//             orderNo: _data.orderNo
//         };

//     } catch (err) {
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




// const testFunc = async () => {
//     // var sendData = {"userID":"Smith#167","betid":"1702461168478","amount":"22.12","currency":"INR","Session_Token":"069eed7f-7f90-4882-b79a-8e5e5bf32c8b","cancelbetid":"CAN1702461170676"}
//     // var hash = await hashFunc(sendData)
//     // const resData = await axios.post(betUrl, sendData, {
//     //     headers: {
//     //         'Content-Type': 'application/json',
//     //         'hashkey': hash
//     //     }
//     // })
//     var result = await cancelBet("Smith#167", "1702461168478", "22.12", "INR", "069eed7f-7f90-4882-b79a-8e5e5bf32c8b")
// }

// testFunc();