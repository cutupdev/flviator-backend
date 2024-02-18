import { setlog } from "../helper";

// declare interface SchemaBetModel {
//   _id: number
//   userId: string
//   betId: string
//   beforeBalance: number
//   betAmount: number
//   afterBalance: number
//   responseBalance: number
//   currency: string
//   sessionToken: string
//   platform: string
//   isCancel: boolean
//   cancelTime: number
// }

import mongoose, { Types } from "mongoose";

const BetSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  betId: {
    type: String,
  },
  beforeBalance: {
    type: Number,
  },
  betAmount: {
    type: Number,
  },
  afterBalance: {
    type: Number,
  },
  responseBalance: {
    type: Number,
  },
  currency: {
    type: String,
  },
  sessionToken: {
    type: String,
  },
  platform: {
    type: String,
  },
  isCancel: {
    type: Boolean,
  },
  cancelTime: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false
});

const BetModel = mongoose.model("bet", BetSchema);

export const getAllBet = async () => {
  try {
    const gameSetting = await BetModel.find({})
    return {
      status: true,
      data: gameSetting
    }
  } catch (error) {
    setlog('getAllBet', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addBet = async (
  userId: string,
  betId: string,
  beforeBalance: number,
  betAmount: number,
  afterBalance: number,
  responseBalance: number,
  currency: string,
  sessionToken: string,
  platform: string,
  isCancel: boolean,
  cancelTime: number,
) => {
  try {
    await BetModel.create({
      userId,
      betId,
      beforeBalance,
      betAmount,
      afterBalance,
      responseBalance,
      currency,
      sessionToken,
      platform,
      isCancel,
      cancelTime,
    })
    return true
  } catch (error) {
    setlog('addBet', error)
    return false
  }
}

export const updateBet = async (
  _id: number,
  updateData: object,
) => {
  try {
    await BetModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateBet', error)
    return false
  }
}

export const updateBetByBetId = async (
  betId: string,
  updateData: object,
) => {
  try {
    await BetModel.updateOne({ betId }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateBet', error)
    return false
  }
}

export const deleteBet = async (
  _id: number
) => {
  try {
    await BetModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteBet', error)
    return false
  }
}

export default BetModel;