import { setlog } from "../helper";

// declare interface SchemaSessionModel {
//   _id: number
//   userId: string
//   sessionToken: string
//   userToken: string
//   userBalance: number
//   startTime: number
//   endTime: number
//   ipAddress: string
// }

import mongoose, { Types } from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  sessionToken: {
    type: String,
  },
  userToken: {
    type: String,
  },
  userBalance: {
    type: Number,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  ipAddress: {
    type: String,
  },
}, {
  timestamps: true,
  versionKey: false
});

const SessionModel = mongoose.model("session", SessionSchema);

export const getAllSessions = async () => {
  try {
    const sessions = await SessionModel.find({})
    return {
      status: true,
      data: sessions
    }
  } catch (error) {
    setlog('getAllSessions', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addSession = async (
  userId: string,
  sessionToken: string,
  userToken: string,
  userBalance: number,
  ipAddress: string
) => {
  try {
    const dt = Date.now();
    await SessionModel.create({
      userId,
      sessionToken,
      userToken,
      userBalance,
      startTime: dt,
      endTime: dt + 2 * 60 * 60 * 1000,
      ipAddress,
    })
    return true
  } catch (error) {
    setlog('addSession', error)
    return false
  }
}

export const updateSession = async (
  _id: number,
  updateData: object,
) => {
  try {
    await SessionModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
    return true
  } catch (error) {
    setlog('updateSession', error)
    return false
  }
}

export const deleteSession = async (
  _id: number
) => {
  try {
    await SessionModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteSession', error)
    return false
  }
}


export default SessionModel;