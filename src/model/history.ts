import { currentTime, setlog } from "../helper";

import mongoose, { Types } from "mongoose";

const HistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        require: true
    },
    betAmount: {
        type: Number,
    },
    cashoutAt: {
        type: Number,
        require: true
    },
    cashouted: {
        type: Boolean,
        require: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
});


const HistoryModel = mongoose.model("histories", HistorySchema);

export const addHistory = async (userId: string, betAmount: number, cashoutAt: number, cashouted: boolean) => {
    try {
        await HistoryModel.create({
            // _id: ++lastIds.lastHistoryId,
            userId,
            betAmount,
            cashoutAt,
            cashouted,
            date: currentTime()
        })
        return true
    } catch (error) {
        setlog('add History', error)
        return false
    }
}

export default HistoryModel;