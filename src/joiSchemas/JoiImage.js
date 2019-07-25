import Joi from '@hapi/joi'

const imageType = {
  name: 'string',
  base: Joi.string(),
  language: {
    objectId: 'must be a valid file type'
  },
  rules: [{
    name: 'imageType',
    validate (params, value, state, options) {
      console.log(value)
      const allowed = ['image/jpeg', 'image/jpg', 'image/png']
      if (!allowed.includes(value)) {
        
        return this.createError('string.imageType', {}, state, options)
      }
      return value
    }
  }]
}
const extendedJoi = Joi.extend(imageType)
export default extendedJoi
