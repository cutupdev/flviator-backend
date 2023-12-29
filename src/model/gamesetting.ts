import { setlog } from "../helper";
import { TblGameSetting } from "./index";

// declare interface SchemaTblGameSetting {
//   _id: number
//   minBetAmount: number
//   maxBetAmount: number
//   RTP: number
//   userSessionTime: number
//   isChatEnable: boolean
//   isBetAllow: boolean
//   isGameEnable: boolean
// }

export const getAllGameSetting = async () => {
  try {
    const flydetails = await TblGameSetting.find({})
    return {
      status: true,
      data: flydetails
    }
  } catch (error) {
    setlog('getAllGameSetting', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addGameSetting = async (
  minBetAmount: number,
  maxBetAmount: number,
  RTP: number,
  userSessionTime: number,
  isChatEnable: boolean,
  isBetAllow: boolean,
  isGameEnable: boolean,
) => {
  try {
    let dt = Date.now();
    await TblGameSetting.insertOne({
      _id: dt,
      minBetAmount,
      maxBetAmount,
      RTP,
      userSessionTime,
      isChatEnable,
      isBetAllow,
      isGameEnable,
    })
    return true
  } catch (error) {
    setlog('addGameSetting', error)
    return false
  }
}

export const updateGameSetting = async (
  _id: number,
  updateData: object,
) => {
  try {
    await TblGameSetting.updateOne({ _id }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateGameSetting', error)
    return false
  }
}

export const deleteGameSetting = async (
  _id: number
) => {
  try {
    await TblGameSetting.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteGameSetting', error)
    return false
  }
}