import { setlog } from "../helper";
import { TblCancelBet } from "./index";

// declare interface SchemaTblCancelBet {
//   _id: number
//   userId: string
//   betId: string
//   betAmount: number
//   cancelBetId: string
//   sessionToken: string
//   beforeBalance: number
//   afterBalance: number
//   responseBalance: number
//   createdDate: number
// }

export const getAllCancelBet = async () => {
  try {
    const cancelBet = await TblCancelBet.find({})
    return {
      status: true,
      data: cancelBet
    }
  } catch (error) {
    setlog('getAllCancelBet', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addCancelBet = async (
  userId: string,
  betId: string,
  betAmount: number,
  cancelBetId: string,
  sessionToken: string,
  beforeBalance: number,
  afterBalance: number,
  responseBalance: number,
  createdDate: number,
) => {
  try {
    let dt = Date.now();
    await TblCancelBet.insertOne({
      _id: dt,
      userId,
      betId,
      betAmount,
      cancelBetId,
      sessionToken,
      beforeBalance,
      afterBalance,
      responseBalance,
      createdDate,
    })
    return true
  } catch (error) {
    setlog('addCancelBet', error)
    return false
  }
}

export const updateCancelBet = async (
  _id: number,
  updateData: object,
) => {
  try {
    await TblCancelBet.updateOne({ _id }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateCancelBet', error)
    return false
  }
}

export const deleteCancelBet = async (
  _id: number
) => {
  try {
    await TblCancelBet.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteCancelBet', error)
    return false
  }
}