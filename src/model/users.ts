import { setlog } from "../helper";

import mongoose, { Types } from "mongoose";

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    require: true
  },
  userId: {
    type: String,
    require: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  avatar: {
    type: String,
    default: "./avatars/av-5.png"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBetAllow: {
    type: Boolean,
    default: true
  },
  platform: {
    type: String,
    default: "desktop"
  },
  balance: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: "admin"
  },
  isSoundEnable: {
    type: Boolean,
    default: true
  },
  isMusicEnable: {
    type: Boolean,
    default: true
  },
  isChatEnable: {
    type: Boolean,
    default: true
  },
  ipAddress: {
    type: String,
    default: "0.0.0.0"
  },
}, {
  timestamps: true,
  versionKey: false
});

const UserModel = mongoose.model("users", UserSchema);

export const getAllUsers = async () => {
  try {
    const users = await UserModel.find({})
    return {
      status: true,
      data: users
    }
  } catch (error) {
    setlog('getAllUsers', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const getUserById = async (userId: string) => {
  try {
    const user = await UserModel.findOne({ userId })
    return user
  } catch (error) {
    setlog('getAllUsers', error)
    return { status: false, message: "Something went wrong." }
  }
}



export const addUser = async (
  userName: string,
  userId: string,
  currency: string,
  balance: number,
  avatar: string,
  platform: string,
  createdBy: string,
  ipAddress: string
) => {
  try {
    const user = await UserModel.findOne({ userId });
    let userData = {
      userName,
      userId,
      currency,
      balance,
      avatar,
      isActive: true,
      isBetAllow: true,
      platform,
      createdBy,
      isSoundEnable: true,
      isMusicEnable: true,
      isChatEnable: true,
      ipAddress: ipAddress || "0.0.0.0",
    }
    if (!user) {
      await UserModel.create(userData)
    }
    return userData
  } catch (error) {
    setlog('addUser', error)
    return false
  }
}

export const updateUser = async (
  _id: number,
  updateData: object,
) => {
  try {
    await UserModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateUser', error)
    return false
  }
}

export const updateUserById = async (
  userId: string,
  updateData: object,
) => {
  try {
    await UserModel.findOneAndUpdate({ userId }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateUser', error)
    return false
  }
}

export const deleteUser = async (
  _id: number
) => {
  try {
    await UserModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteUser', error)
    return false
  }
}

export default UserModel;