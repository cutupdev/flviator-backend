import { setlog } from "../helper";

// declare interface SchemaBlockModel {
//   _id: number
//   text: string
//   emails: string
//   phoneno: string
//   urls: string
//   users: string
// }

import mongoose, { Types } from "mongoose";

const BlockSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  emails: {
    type: String,
  },
  phoneno: {
    type: String,
  },
  urls: {
    type: String,
  },
  users: {
    type: String,
  },
}, {
  timestamps: true,
  versionKey: false
});

const BlockModel = mongoose.model("block", BlockSchema);


export const getAllBlock = async () => {
  try {
    const cancelBet = await BlockModel.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllBlock', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addBlock = async (
  text: string,
  emails: string,
  phoneno: string,
  urls: string,
  users: string,
) => {
  try {
    await BlockModel.create({
      text,
      emails,
      phoneno,
      urls,
      users,
    })
    return true
  } catch (error) {
    setlog('addBlock', error)
    return false
  }
}

export const updateBlock = async (
  _id: number,
  updateData: object,
) => {
  try {
    await BlockModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
    return true
  } catch (error) {
    setlog('updateBlock', error)
    return false
  }
}

export const deleteBlock = async (
  _id: number
) => {
  try {
    await BlockModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteBlock', error)
    return false
  }
}

export default BlockModel;