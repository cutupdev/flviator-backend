import { setlog } from "../helper";
import { TblChat } from "./index";

// declare interface SchemaTblChat {
//   _id: number
//   userId: string
//   message: string
//   img: string
//   emoji: string
//   createdDate: number
//   likes: number
//   disLikes: number
// }

export const getAllChatHistory = async () => {
  try {
    const cancelBet = await TblChat.find({})
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
    let dt = Date.now();
    await TblChat.insertOne({
      _id: dt,
      userId,
      message,
      img,
      emoji,
      createdDate: dt,
      likes: 0,
      disLikes: 0,
    })
    return {
      _id: dt,
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
    await TblChat.updateOne({ _id }, {
      $set: updateData
    })
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
    await TblChat.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteChat', error)
    return false
  }
}