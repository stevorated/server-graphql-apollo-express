import Joi from '@hapi/joi'
import mongoose from 'mongoose'

const objectId = {
  name: 'string',
  base: Joi.string(),
  language: {
    objectId: 'must be a valid object ID'
  },
  rules: [{
    name: 'objectId',
    validate (params, value, state, options) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return this.createError('string.objectId', {}, state, options)
      }
      return value
    }
  }]
}

const JoiObjectId = Joi.extend(objectId)
export default JoiObjectId
