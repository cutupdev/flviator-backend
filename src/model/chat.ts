import { setlog } from "../helper";

// declare interface SchemaChatModel {
//   _id: number
//   userId: string
//   message: string
//   img: string
//   emoji: string
//   createdDate: number
//   likes: number
//   disLikes: number
// }

import mongoose, { Types } from "mongoose";

const ChatSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  message: {
    type: String,
  },
  img: {
    type: String,
  },
  emoji: {
    type: String,
  },
  likes: {
    type: Number,
  },
  disLikes: {
    type: Number,
  },
});

const ChatModel = mongoose.model("chat", ChatSchema);


export const getAllChatHistory = async () => {
  try {
    const cancelBet = await ChatModel.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllChat', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addChat = async (
  userId: string,
  message: string,
  img: string,
  emoji: string,
) => {
  try {
    const row: any = await ChatModel.create({
      userId,
      message,
      img,
      emoji,
      likes: 0,
      disLikes: 0,
    })
    return {
      _id: row._id,
      status: true
    }
  } catch (error) {
    setlog('addChat', error)
    return false
  }
}

export const updateChat = async (
  _id: number,
  updateData: object,
) => {
  try {
    await ChatModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
    return true
  } catch (error) {
    setlog('updateChat', error)
    return false
  }
}

export const deleteChat = async (
  _id: number
) => {
  try {
    await ChatModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteChat', error)
    return false
  }
}

export default ChatModel;