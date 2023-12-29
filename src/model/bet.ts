import { setlog } from "../helper";
import { TblBet } from "./index";

// declare interface SchemaTblBet {
//   _id: number
//   userId: string
//   betId: string
//   beforeBalance: number
//   betAmount: number
//   afterBalance: number
//   responseBalance: number
//   currency: string
//   sessionToken: string
//   createdDate: string
//   platform: string
//   isCancel: boolean
//   cancelTime: number
// }

export const getAllBet = async () => {
  try {
    const gameSetting = await TblBet.find({})
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
    let dt = Date.now();
    await TblBet.insertOne({
      _id: dt,
      userId,
      betId,
      beforeBalance,
      betAmount,
      afterBalance,
      responseBalance,
      currency,
      sessionToken,
      createdDate: dt,
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
    await TblBet.updateOne({ _id }, {
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
    await TblBet.updateOne({ betId }, {
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
    await TblBet.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteBet', error)
    return false
  }
}