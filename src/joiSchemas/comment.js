import Joi from './JoiObjectId' // Custom Joi for userId

export const createComment = () => Joi.object().keys({
  body: Joi.string().min(2).max(500).label('Comment Body'),
  post: Joi.string().objectId().label('Post ID')
})

export const updateComment = (id) => Joi.object().keys({
  body: Joi.string().min(2).max(500).label('Comment Body'),
  id: Joi.string().objectId().label('Comment ID')
})
