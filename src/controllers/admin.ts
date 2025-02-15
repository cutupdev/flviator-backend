import { Request, Response } from "express";
import { getPaginationMeta, setlog } from "../helper";
import UserModel from "../model/users";
import HistoryModel from "../model/history";

export const totalHistory = async (req: Request, res: Response) => {
    try {
        let { page, limit } = req.body as { page: number, limit: number }
        limit = Number(limit) || 20
        if (limit < 10) limit = 10
        if (limit > 100) limit = 100
        const count = await HistoryModel.count({})
        const meta = getPaginationMeta(Number(page) || 0, count, limit)
        const result = await HistoryModel.find({ _id: { $gte: meta.page * meta.limit, $lt: (meta.page * meta.limit + meta.limit) } }).sort({ date: -1 })
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}

export const totalUsers = async (req: Request, res: Response) => {
    try {
        let { page, limit } = req.body as { page: number, limit: number }
        limit = Number(limit) || 20
        if (limit < 10) limit = 10
        if (limit > 100) limit = 100
        const count = await UserModel.count({})
        const meta = getPaginationMeta(Number(page) || 0, count, limit)
        const result = await UserModel.find({ _id: { $gte: meta.page * meta.limit, $lt: (meta.page * meta.limit + meta.limit) } }).sort({ date: -1 })
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}