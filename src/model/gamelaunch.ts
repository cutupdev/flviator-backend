import { setlog } from "../helper";
import { TblGameLaunch } from "./index";

// declare interface SchemaTblGameLaunch {
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

export const getAllGameLaunch = async () => {
  try {
    const cancelBet = await TblGameLaunch.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllGameLaunch', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addGameLaunch = async (
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
    await TblGameLaunch.insertOne({
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
    setlog('addGameLaunch', error)
    return false
  }
}

export const updateGameLaunch = async (
  _id: number,
  updateData: object,
) => {
  try {
    await TblGameLaunch.updateOne({ _id }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateGameLaunch', error)
    return false
  }
}

export const deleteGameLaunch = async (
  _id: number
) => {
  try {
    await TblGameLaunch.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteGameLaunch', error)
    return false
  }
}