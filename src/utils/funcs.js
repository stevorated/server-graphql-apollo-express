import mongoose from 'mongoose'
import { UserInputError } from 'apollo-server-express'

export const isObjectID = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new UserInputError(`${id} is not valid`)
  } else {
    return true
  }
}
