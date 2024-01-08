import { setlog } from "../helper";

// declare interface SchemaGameLaunchModel {
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

import mongoose, { Types } from "mongoose";

const GameLaunchSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  code: {
    type: Number,
  },
  message: {
    type: String,
  },
  hashKey: {
    type: String,
  },
  requestJson: {
    type: Object,
  },
  responseJson: {
    type: Object,
  },
  requestTime: {
    type: Date,
  },
  responseTime: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false
});

const GameLaunchModel = mongoose.model("gamelaunch", GameLaunchSchema);

export const getAllGameLaunch = async () => {
  try {
    const cancelBet = await GameLaunchModel.find({})
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
    await GameLaunchModel.create({
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
    await GameLaunchModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
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
    await GameLaunchModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteGameLaunch', error)
    return false
  }
}


export default GameLaunchModel;