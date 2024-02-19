import { setlog } from "../helper";

// declare interface SchemaCancelBetLogModel {
//   _id: number
//   userId: string
//   betId: string
//   cancelBetID: string
//   code: number
//   message: string
//   hashKey: string
//   requestJson: object
//   responseJson: object
//   requestTime: number
//   responseTime: number
// }

import mongoose, { Types } from "mongoose";

const CancelBetLogSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  betId: {
    type: String,
  },
  cancelBetID: {
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

const CancelBetLogModel = mongoose.model("cancelbetlog", CancelBetLogSchema);


export const getAllCancelBetLog = async () => {
  try {
    const cancelBet = await CancelBetLogModel.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllCancelBetLog', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addCancelBetLog = async (
  userId: string,
  betId: string,
  cancelBetID: string,
  code: number,
  message: string,
  hashKey: string,
  requestJson: object,
  responseJson: object,
  requestTime: number,
  responseTime: number,
) => {
  try {
    await CancelBetLogModel.create({
      userId,
      betId,
      cancelBetID,
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
    setlog('addCancelBetLog', error)
    return false
  }
}

export const updateCancelBetLog = async (
  _id: number,
  updateData: object,
) => {
  try {
    await CancelBetLogModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateCancelBetLog', error)
    return false
  }
}

export const deleteCancelBetLog = async (
  _id: number
) => {
  try {
    await CancelBetLogModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteCancelBetLog', error)
    return false
  }
}

export default CancelBetLogModel;