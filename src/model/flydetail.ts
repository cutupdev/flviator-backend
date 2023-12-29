import { setlog } from "../helper";
import { TblFlyDetail } from "./index";

// declare interface SchemaTblFlyDetail {
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

export const getAllFlyDetail = async () => {
  try {
    const flydetails = await TblFlyDetail.find({})
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
    let dt = Date.now();
    await TblFlyDetail.insertOne({
      _id: dt,
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
    await TblFlyDetail.updateOne({ _id }, {
      $set: updateData
    })
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
    await TblFlyDetail.updateOne({ betId }, {
      $set: updateData
    })
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
    await TblFlyDetail.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteFlyDetail', error)
    return false
  }
}