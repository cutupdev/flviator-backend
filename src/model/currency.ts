import { setlog } from "../helper";
import { TblCurrency } from "./index";

// declare interface SchemaTblCurrency {
//   _id: number
//   currencyName: string
//   country: string
//   code: number
//   isActive: boolean
//   createdDate: number
//   createdBy: string
// }

export const getAllCurrency = async () => {
  try {
    const currencies = await TblCurrency.find({})
    return {
      status: true,
      data: currencies
    }
  } catch (error) {
    setlog('getAllCurrency', error)
    return { status: false, message: "Something went wrong." }
  }
}

export const addCurrency = async (
  currencyName: string,
  country: string,
  code: string,
  isActive: boolean,
  createdBy: string
) => {
  try {
    let dt = Date.now();
    await TblCurrency.insertOne({
      _id: dt,
      currencyName,
      country,
      code,
      isActive,
      createdDate: dt,
      createdBy,
    })
    return true
  } catch (error) {
    setlog('addCurrency', error)
    return false
  }
}

export const updateCurrency = async (
  _id: number,
  updateData: object,
) => {
  try {
    await TblCurrency.updateOne({ _id }, {
      $set: updateData
    })
    return true
  } catch (error) {
    setlog('updateCurrency', error)
    return false
  }
}

export const deleteCurrency = async (
  _id: number
) => {
  try {
    await TblCurrency.deleteOne({ _id })
    return true
  } catch (error) {
    setlog('deleteCurrency', error)
    return false
  }
}