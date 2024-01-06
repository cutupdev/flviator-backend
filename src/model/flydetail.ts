import { currentTime, setlog } from "../helper";

// declare interface SchemaFlyDetailModel {
//   _id: number
//   betId: string
//   betStartTime: number
//   betEndTime: number
//   flyStartTime: number
//   totalUsers: number
//   totalBets: number
//   totalBetsAmount: number
//   totalCashout: number
//   totalCashoutAmount: number
//   flyAway: number
//   flyEndTime: number
// }

import mongoose, { Types } from "mongoose";

const FlyDetailSchema = new mongoose.Schema({
  betId: {
    type: String,
  },
  betStartTime: {
    type: Number,
  },
  betEndTime: {
    type: Number,
  },
  flyStartTime: {
    type: Number,
  },
  totalUsers: {
    type: Number,
  },
  totalBets: {
    type: Number,
  },
  totalBetsAmount: {
    type: Number,
  },
  totalCashout: {
    type: Number,
  },
  totalCashoutAmount: {
    type: Number,
  },
  flyAway: {
    type: Number,
  },
  flyEndTime: {
    type: Number,
  },
});


const FlyDetailModel = mongoose.model("histories", FlyDetailSchema);

export const getAllFlyDetail = async () => {
  try {
    const flydetails = await FlyDetailModel.find({})
    return {
      status: true,
      data: flydetails
    }
  } catch (error) {
    setlog('getAllFlyDetail', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addFlyDetail = async (
  betId: string,
  betStartTime: number,
  betEndTime: number,
  flyStartTime: number,
  totalUsers: number,
  totalBets: number,
  totalBetsAmount: number,
  totalCashout: number,
  totalCashoutAmount: number,
  flyAway: number,
  flyEndTime: number,
) => {
  try {
    await FlyDetailModel.create({
      betId,
      betStartTime,
      betEndTime,
      flyStartTime,
      totalUsers,
      totalBets,
      totalBetsAmount,
      totalCashout,
      totalCashoutAmount,
      flyAway,
      flyEndTime
    })
    return true
  } catch (error) {
    setlog('addFlyDetail', error)
    return false
  }
}

export const updateFlyDetail = async (
  _id: number,
  updateData: object,
) => {
  try {
    await FlyDetailModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
    return true
  } catch (error) {
    setlog('updateFlyDetail', error)
    return false
  }
}

export const updateFlyDetailByBetId = async (
  betId: string,
  updateData: object,
) => {
  try {
    await FlyDetailModel.findOneAndUpdate({ betId }, updateData)
    return true
  } catch (error) {
    setlog('updateFlyDetail', error)
    return false
  }
}

export const deleteFlyDetail = async (
  _id: number
) => {
  try {
    await FlyDetailModel.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteFlyDetail', error)
    return false
  }
}

export default FlyDetailModel;