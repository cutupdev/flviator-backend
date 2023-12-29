import { setlog } from "../helper";
import { TblBetLog } from "./index";

// declare interface SchemaTblBetLog {
//   _id: number
//   userId: string
//   betId: string
//   code: number
//   message: string
//   hashKey: string
//   requestJson: object
//   responseJson: object
//   requestTime: number
//   responseTime: number
// }

export const getAllBetLog = async () => {
  try {
    const cancelBet = await TblBetLog.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllBetLog', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addBetLog = async (
  userId: string,
  betId: string,
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
    await TblBetLog.insertOne({
      _id: dt,
      userId,
      betId,
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
    setlog('addBetLog', error)
    return false
  }
}

export const updateBetLog = async (
  _id: number,
  updateData: object,
) => {
  try {
    await TblBetLog.updateOne({ _id }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateBetLog', error)
    return false
  }
}

export const deleteBetLog = async (
  _id: number
) => {
  try {
    await TblBetLog.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteBetLog', error)
    return false
  }
}