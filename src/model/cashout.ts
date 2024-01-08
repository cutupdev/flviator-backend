import { setlog } from "../helper";

// declare interface SchemaCashoutModel {
//   _id: number
//   userId: string
//   betId: string
//   betAmount: number
//   afterBalance: number
//   cashoutId: number
//   cashoutAt: number
//   cashoutAmount: number
//   responseBalance: number
//   flyAway: number
//   sessionToken: string
//   createdDate: number
// }

import mongoose, { Types } from "mongoose";

const CashoutSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  betId: {
    type: String,
  },
  betAmount: {
    type: Number,
  },
  afterBalance: {
    type: Number,
  },
  cashoutId: {
    type: Number,
  },
  cashoutAt: {
    type: Number,
  },
  cashoutAmount: {
    type: Number,
  },
  responseBalance: {
    type: Number,
  },
  flyAway: {
    type: Number,
  },
  sessionToken: {
    type: String,
  },
}, {
  timestamps: true,
  versionKey: false
});

const CashoutModel = mongoose.model("cashout", CashoutSchema);

export const getAllCashout = async () => {
  try {
    const gameSetting = await CashoutModel.find({})
    return {
      status: true,
      data: gameSetting
    }
  } catch (error) {
    setlog('getAllCashout', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addCashout = async (
  userId: string,
  betId: string,
  betAmount: number,
  afterBalance: number,
  cashoutId: number,
  cashoutAt: number,
  cashoutAmount: number,
  responseBalance: number,
  flyAway: number,
  sessionToken: string,
) => {
  try {
    await CashoutModel.create({
      userId,
      betId,
      betAmount,
      afterBalance,
      cashoutId,
      cashoutAt,
      cashoutAmount,
      responseBalance,
      flyAway,
      sessionToken,
    })
    return true
  } catch (error) {
    setlog('addCashout', error)
    return false
  }
}

export const updateCashout = async (
  _id: number,
  updateData: object,
) => {
  try {
    await CashoutModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
    return true
  } catch (error) {
    setlog('updateCashout', error)
    return false
  }
}

export const updateCashoutByBetId = async (
  betId: string,
  updateData: object,
) => {
  try {
    await CashoutModel.updateOne({ betId }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateCashout', error)
    return false
  }
}

export const deleteCashout = async (
  _id: number
) => {
  try {
    await CashoutModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteCashout', error)
    return false
  }
}


export default CashoutModel;