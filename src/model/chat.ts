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
  userName: {
    type: String,
  },
  avatar: {
    type: String,
  },
  message: {
    type: String,
  },
  img: {
    type: String,
  },
  likes: {
    type: Number,
  },
  likesIDs: {
    type: Array<String>,
  },
  disLikes: {
    type: Number,
  },
  disLikesIDs: {
    type: Array<String>,
  },
}, {
  timestamps: true,
  versionKey: false
});

const ChatModel = mongoose.model("chat", ChatSchema);


export const getAllChatHistory = async () => {
  try {
    const chathistory = await ChatModel.find({})
    return chathistory
  } catch (error) {
    setlog('getAllChat', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addChat = async (
  userId: string,
  userName: string,
  avatar: string,
  message: string,
  img: string,
) => {
  try {
    const row: any = await ChatModel.create({
      userId,
      userName,
      avatar,
      message,
      img,
      likes: 0,
      likesIDs: [],
      disLikes: 0,
      disLikesIDs: [],
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


export const likesToChat = async (chatID: number, userId: string) => {
  try {
    const result = await ChatModel.findOne({ _id: new Types.ObjectId(chatID), likesIDs: { $in: [userId] } });
    let shouldAdd = result === null;

    const updateQuery: any = shouldAdd
      ? {
        $addToSet: { likesIDs: userId },
        $inc: { likes: 1 }
      }
      : {
        $pull: { likesIDs: userId },
        $inc: { likes: -1 }
      };

    await ChatModel.updateOne({ _id: new Types.ObjectId(chatID) }, updateQuery);
    return { status: true };
  } catch (error) {
    return { status: false };
  }
}

export const updateChat = async (
  _id: number,
  updateData: object,
) => {
  try {
    await ChatModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
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
    await ChatModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteChat', error)
    return false
  }
}

export default ChatModel;