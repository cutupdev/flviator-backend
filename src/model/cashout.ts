import { setlog } from "../helper";
import { TblCashout } from "./index";

// declare interface SchemaTblCashout {
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

export const getAllCashout = async () => {
  try {
    const gameSetting = await TblCashout.find({})
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
    let dt = Date.now();
    await TblCashout.insertOne({
      _id: dt,
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
      createdDate: dt,
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
    await TblCashout.updateOne({ _id }, {
      $set: updateData
    })
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
    await TblCashout.updateOne({ betId }, {
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
    await TblCashout.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteCashout', error)
    return false
  }
}