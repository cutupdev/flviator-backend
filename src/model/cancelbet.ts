import { setlog } from "../helper";

// declare interface SchemaCancelBetModel {
//   _id: number
//   userId: string
//   betId: string
//   betAmount: number
//   cancelBetId: string
//   sessionToken: string
//   beforeBalance: number
//   afterBalance: number
//   responseBalance: number
//   createdDate: number
// }

import mongoose, { Types } from "mongoose";

const CancelBetSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  betId: {
    type: String,
  },
  betAmount: {
    type: Number,
  },
  cancelBetId: {
    type: String,
  },
  sessionToken: {
    type: String,
  },
  beforeBalance: {
    type: Number,
  },
  afterBalance: {
    type: Number,
  },
  responseBalance: {
    type: Number,
  },
  createdDate: {
    type: Number,
  },
}, {
  timestamps: true,
  versionKey: false
});

const CancelBetModel = mongoose.model("cancelbet", CancelBetSchema);

export const getAllCancelBet = async () => {
  try {
    const cancelBet = await CancelBetModel.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllCancelBet', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addCancelBet = async (
  userId: string,
  betId: string,
  betAmount: number,
  cancelBetId: string,
  sessionToken: string,
  beforeBalance: number,
  afterBalance: number,
  responseBalance: number,
  createdDate: number,
) => {
  try {
    await CancelBetModel.create({
      userId,
      betId,
      betAmount,
      cancelBetId,
      sessionToken,
      beforeBalance,
      afterBalance,
      responseBalance,
      createdDate,
    })
    return true
  } catch (error) {
    setlog('addCancelBet', error)
    return false
  }
}

export const updateCancelBet = async (
  _id: number,
  updateData: object,
) => {
  try {
    await CancelBetModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateCancelBet', error)
    return false
  }
}

export const deleteCancelBet = async (
  _id: number
) => {
  try {
    await CancelBetModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteCancelBet', error)
    return false
  }
}


export default CancelBetModel;