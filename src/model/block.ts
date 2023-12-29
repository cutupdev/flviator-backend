import { setlog } from "../helper";
import { TblBlock } from "./index";

// declare interface SchemaTblBlock {
//   _id: number
//   text: string
//   emails: string
//   phoneno: string
//   urls: string
//   users: string
// }

export const getAllBlock = async () => {
  try {
    const cancelBet = await TblBlock.find({})
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
    let dt = Date.now();
    await TblBlock.insertOne({
      _id: dt,
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
    await TblBlock.updateOne({ _id }, {
      $set: updateData
    })
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
    await TblBlock.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteBlock', error)
    return false
  }
}