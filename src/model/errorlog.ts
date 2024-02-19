import { setlog } from "../helper";

// declare interface SchemaErrorLogModel {
//   _id: number
//   userId: string
//   action: string
//   error: string
// }

import mongoose, { Types } from "mongoose";

const ErrorLogSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  action: {
    type: String,
  },
  error: {
    type: String,
  },
}, {
  timestamps: true,
  versionKey: false
});


const ErrorLogModel = mongoose.model("errorlog", ErrorLogSchema);


export const getAllErrorLog = async () => {
  try {
    const allErrorLog = await ErrorLogModel.find({})
    return {
      status: true,
      data: allErrorLog
    }
  } catch (error) {
    setlog('getAllErrorLog', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addErrorLog = async (
  userId: string,
  action: string,
  error: string,
) => {
  try {
    await ErrorLogModel.create({
      userId,
      action,
      error,
    })
    return true
  } catch (error) {
    setlog('addErrorLog', error)
    return false
  }
}

export const updateErrorLog = async (
  _id: number,
  updateData: object,
) => {
  try {
    await ErrorLogModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateErrorLog', error)
    return false
  }
}

export const deleteErrorLog = async (
  _id: number
) => {
  try {
    await ErrorLogModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteErrorLog', error)
    return false
  }
}

export default ErrorLogModel;