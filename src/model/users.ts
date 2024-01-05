import { setlog } from "../helper";
import { TblUser } from "./index";

// declare interface SchemaTblUser {
//   _id: number
//   userName: string
//   userId: string
//   currency: string
//   avatar: string
//   isActive: boolean
//   isBetAllow: boolean
//   platform: string
//   balance: number
//   createdDate: number
//   createdBy: string
//   isSoundEnable: boolean
//   isMusicEnable: boolean
//   isChatEnable: boolean
//   ipAddress: string
// }

export const getUserById = async (userId: string) => {
  try {
    const user = await TblUser.find({ userId })
    return {
      status: true,
      data: user
    }
  } catch (error) {
    setlog('getAllUsers', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const getAllUsers = async () => {
  try {
    const users = await TblUser.find({})
    return {
      status: true,
      data: users
    }
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
    let dt = Date.now();
    console.log({
      _id: dt,
      userName,
      userId,
      currency,
      balance,
      avatar,
      isActive: true,
      isBetAllow: true,
      platform,
      createdDate: dt,
      createdBy,
      isSoundEnable: true,
      isMusicEnable: true,
      isChatEnable: true,
      ipAddress,
    })
    await TblUser.insertOne({
      _id: dt,
      userName,
      userId,
      currency,
      balance,
      avatar,
      isActive: true,
      isBetAllow: true,
      platform,
      createdDate: dt,
      createdBy,
      isSoundEnable: true,
      isMusicEnable: true,
      isChatEnable: true,
      ipAddress: ipAddress || "0.0.0.0",
    })
    return true
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
    await TblUser.updateOne({ _id }, {
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
    await TblUser.updateOne({ userId }, {
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
    await TblUser.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteUser', error)
    return false
  }
}