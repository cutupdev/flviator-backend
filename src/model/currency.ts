import { setlog } from "../helper";

// declare interface SchemaCurrencyModel {
//   _id: number
//   currencyName: string
//   country: string
//   code: number
//   isActive: boolean
//   createdDate: number
//   createdBy: string
// }

import mongoose, { Types } from "mongoose";

const CurrencySchema = new mongoose.Schema({
  currencyName: {
    type: String,
  },
  country: {
    type: String,
  },
  code: {
    type: Number,
  },
  isActive: {
    type: Boolean,
  },
  createdBy: {
    type: String,
  },
});

const CurrencyModel = mongoose.model("currency", CurrencySchema);

export const getAllCurrency = async () => {
  try {
    const currencies = await CurrencyModel.find({})
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
    await CurrencyModel.create({
      currencyName,
      country,
      code,
      isActive,
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
    await CurrencyModel.findOneAndUpdate({ _id: new Types.ObjectId(_id) }, updateData)
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
    await CurrencyModel.deleteOne({ _id: new Types.ObjectId(_id) })
    return true
  } catch (error) {
    setlog('deleteCurrency', error)
    return false
  }
}


export default CurrencyModel;