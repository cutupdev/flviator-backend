import { setlog } from "../helper";
import { TblAuthenticationLog } from "./index";

// declare interface SchemaTblAuthenticationLog {
//   _id: number
//   userId: string
//   code: number
//   message: string
//   hashKey: string
//   requestJson: object
//   responseJson: object
//   requestTime: number
//   responseTime: number
// }

export const getAllAuthenticationLog = async () => {
  try {
    const cancelBet = await TblAuthenticationLog.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllAuthenticationLog', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addAuthenticationLog = async (
  userId: string,
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
    await TblAuthenticationLog.insertOne({
      _id: dt,
      userId,
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
    setlog('addAuthenticationLog', error)
    return false
  }
}

export const updateAuthenticationLog = async (
  _id: number,
  updateData: object,
) => {
  try {
    await TblAuthenticationLog.updateOne({ _id }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateAuthenticationLog', error)
    return false
  }
}

export const deleteAuthenticationLog = async (
  _id: number
) => {
  try {
    await TblAuthenticationLog.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteAuthenticationLog', error)
    return false
  }
}