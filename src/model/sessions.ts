import { setlog } from "../helper";
import { TblSession } from "./index";

// declare interface SchemaTblSession {
//   _id: number
//   userId: string
//   sessionToken: string
//   userToken: string
//   userBalance: number
//   startTime: number
//   endTime: number
//   ipAddress: string
// }

export const getAllSessions = async () => {
  try {
    const sessions = await TblSession.find({})
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
    let dt = Date.now();
    await TblSession.insertOne({
      _id: dt,
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
    setlog('addUser', error)
    return false
  }
}

export const updateSession = async (
  _id: number,
  updateData: object,
) => {
  try {
    await TblSession.updateOne({ _id }, {
      $set: updateData
    })
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
    await TblSession.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteSession', error)
    return false
  }
}