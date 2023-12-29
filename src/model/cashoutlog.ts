import { setlog } from "../helper";
import { TblCashoutLog } from "./index";

// declare interface SchemaTblCashoutLog {
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

export const getAllCashoutLog = async () => {
  try {
    const cancelBet = await TblCashoutLog.find({})
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
    let dt = Date.now();
    await TblCashoutLog.insertOne({
      _id: dt,
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
    await TblCashoutLog.updateOne({ _id }, {
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
    await TblCashoutLog.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteCashoutLog', error)
    return false
  }
}