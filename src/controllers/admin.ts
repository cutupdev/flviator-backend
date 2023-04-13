import { Request, Response } from "express";
import { DHistories, DUsers } from "../model";
import { getPaginationMeta, setlog } from "../helper";

export const totalHistory = async (req: Request, res: Response) => {
    try {
        let {page, limit} = req.body as {page: number, limit: number}
        limit = Number(limit) || 20
        if (limit < 10) limit = 10
        if (limit > 100) limit = 100
        const count = await DHistories.count({})
        const meta = getPaginationMeta(Number(page) || 0, count, limit)
        const result = await DHistories.find({_id: {$gte: meta.page * meta.limit, $lt: (meta.page * meta.limit + meta.limit)}}).sort({date: -1}).toArray()
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}

export const totalUsers = async (req: Request, res: Response) => {
    try {
        let {page, limit} = req.body as {page: number, limit: number}
        limit = Number(limit) || 20
        if (limit < 10) limit = 10
        if (limit > 100) limit = 100
        const count = await DUsers.count({})
        const meta = getPaginationMeta(Number(page) || 0, count, limit)
        const result = await DUsers.find({_id: {$gte: meta.page * meta.limit, $lt: (meta.page * meta.limit + meta.limit)}}).sort({date: -1}).toArray()
        res.json({ status: true, data: result });
    } catch (error) {
        setlog('myInfo', error)
        res.json({ status: false });
    }
}