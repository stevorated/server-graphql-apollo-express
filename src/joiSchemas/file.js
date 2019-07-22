import Joi from './JoiImage'

export const uploadImage = file => Joi.object().keys({
  mimetype: Joi.string().imageType().label('Invalid File Type'),
  size: Joi.number().required().max(4000000).label('File too big')
})
