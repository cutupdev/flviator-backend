import { setlog } from "../helper";

// declare interface SchemaGameSettingModel {
//   _id: number
//   minBetAmount: number
//   maxBetAmount: number
//   RTP: number
//   userSessionTime: number
//   isChatEnable: boolean
//   isBetAllow: boolean
//   isGameEnable: boolean
// }

import mongoose, { Types } from "mongoose";

const GameSettingSchema = new mongoose.Schema({
  userName: {
    type: String,
  },
});

const GameSettingModel = mongoose.model("gamesetting", GameSettingSchema);


export const getAllGameSetting = async () => {
  try {
    const flydetails = await GameSettingModel.find({})
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
    await GameSettingModel.create({
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
    await GameSettingModel.updateOne({ _id: new Types.ObjectId(_id) }, updateData)
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
    await GameSettingModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteGameSetting', error)
    return false
  }
}

export default GameSettingModel;