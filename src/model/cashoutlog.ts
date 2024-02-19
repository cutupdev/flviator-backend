import { setlog } from "../helper";

// declare interface SchemaCashoutLogModel {
//   _id: number
//   userId: string
//   betId: string
//   cashoutID: number
//   code: number
//   message: string
//   hashKey: string
//   requestJson: object
//   responseJson: object
//   requestTime: number
//   responseTime: number
// }

import mongoose, { Types } from "mongoose";

const CashoutLogSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  betId: {
    type: String,
  },
  cashoutID: {
    type: Number,
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

const CashoutLogModel = mongoose.model("cashoutlog", CashoutLogSchema);


export const getAllCashoutLog = async () => {
  try {
    const cancelBet = await CashoutLogModel.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllCashoutLog', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addCashoutLog = async (
  userId: string,
  betId: string,
  cashoutID: number,
  code: number,
  message: string,
  hashKey: string,
  requestJson: object,
  responseJson: object,
  requestTime: number,
  responseTime: number,
) => {
  try {
    await CashoutLogModel.create({
      userId,
      betId,
      cashoutID,
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
    setlog('addCashoutLog', error)
    return false
  }
}

export const updateCashoutLog = async (
  _id: number,
  updateData: object,
) => {
  try {
    await CashoutLogModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateCashoutLog', error)
    return false
  }
}

export const deleteCashoutLog = async (
  _id: number
) => {
  try {
    await CashoutLogModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteCashoutLog', error)
    return false
  }
}

export default CashoutLogModel;