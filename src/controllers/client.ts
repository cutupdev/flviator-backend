import { Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';

import { DEFAULT_GAMEID, DGame, DHistories, DUsers, getBettingAmounts, updateUserBalance } from "../model";
import { setlog, getPaginationMeta } from "../helper";
import axios from "axios";



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
        let { name } = req.body as { name: string };
        name = String(name).trim()
        if (name === '') return res.status(404).send("invalid paramters")
        const data = await DHistories.find({ name }).sort({ date: -1 }).limit(20).toArray();
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

export const refound = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        let userData = await DUsers.findOne({ "name": userId });
        if (userData) {
            const refoundAmount = await axios.post(`http://annie.ihk.vipnps.vip/iGaming/igaming/credit`,
                { userId: userId, balance: userData.balance, ptxid: uuidv4() },
                { headers: { 'Content-Type': 'application/json', gamecode: 'crashGame', packageId: '4' } });
            if (refoundAmount.data.success) {
                await updateUserBalance(userId, 0);
                res.status(200).json({ status: true, message: "Successfully refunded" });
            } else {
                res.json({ status: false, message: "Server is busy now!" });
            }
        } else {
            res.json({ status: false, message: "Not registered user!" });
        }
    } catch (error) {
        res.json({ status: false, message: "Server is busy now!" });
    }
}