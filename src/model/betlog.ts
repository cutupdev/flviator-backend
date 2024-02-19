import { setlog } from "../helper";

// declare interface SchemaBetLogModel {
//   _id: number
//   userId: string
//   betId: string
//   code: number
//   message: string
//   hashKey: string
//   requestJson: object
//   responseJson: object
//   requestTime: number
//   responseTime: number
// }

import mongoose, { Types } from "mongoose";

const BetLogSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  betId: {
    type: String,
  },
  code: {
    type: Number,
  },
  message: {
    type: String,
  },
  hashKey: {
    type: String,
  },
  requestJson: {
    type: Object,
  },
  responseJson: {
    type: Object,
  },
  requestTime: {
    type: Date,
  },
  responseTime: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false
});

const BetLogModel = mongoose.model("betlog", BetLogSchema);

export const getAllBetLog = async () => {
  try {
    const cancelBet = await BetLogModel.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllBetLog', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addBetLog = async (
  userId: string,
  betId: string,
  code: number,
  message: string,
  hashKey: string,
  requestJson: object,
  responseJson: object,
  requestTime: number,
  responseTime: number,
) => {
  try {
    await BetLogModel.create({
      userId,
      betId,
      code,
      message,
      hashKey,
      requestJson,
      responseJson,
      requestTime,
      responseTime,
    })
    return true
  } catch (error) {
    setlog('addBetLog', error)
    return false
  }
}

export const updateBetLog = async (
  _id: number,
  updateData: object,
) => {
  try {
    await BetLogModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateBetLog', error)
    return false
  }
}

export const deleteBetLog = async (
  _id: number
) => {
  try {
    await BetLogModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteBetLog', error)
    return false
  }
}

export default BetLogModel;