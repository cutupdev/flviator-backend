import { setlog } from "../helper";
import { TblCancelBetLog } from "./index";

// declare interface SchemaTblCancelBetLog {
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

export const getAllCancelBetLog = async () => {
  try {
    const cancelBet = await TblCancelBetLog.find({})
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
    let dt = Date.now();
    await TblCancelBetLog.insertOne({
      _id: dt,
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
    await TblCancelBetLog.updateOne({ _id }, {
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
    await TblCancelBetLog.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteCancelBetLog', error)
    return false
  }
}