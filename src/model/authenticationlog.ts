import { setlog } from "../helper";

// declare interface SchemaAuthenticationLogModel {
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

const AuthenticationLogSchema = new mongoose.Schema({
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
    type: Number,
  },
  responseTime: {
    type: Number,
  },
});

const AuthenticationLogModel = mongoose.model("authenticationlog", AuthenticationLogSchema);

export const getAllAuthenticationLog = async () => {
  try {
    const cancelBet = await AuthenticationLogModel.find({})
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
    await AuthenticationLogModel.create({
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
    setlog('add AuthenticationLog', error)
    return false
  }
}

export const updateAuthenticationLog = async (
  _id: number,
  updateData: object,
) => {
  try {
    await AuthenticationLogModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
    return true
  } catch (error) {
    setlog('update AuthenticationLog', error)
    return false
  }
}

export const deleteAuthenticationLog = async (
  _id: number
) => {
  try {
    await AuthenticationLogModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('delete AuthenticationLog', error)
    return false
  }
}

export default AuthenticationLogModel;