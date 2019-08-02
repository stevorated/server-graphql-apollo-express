import JoiObjectId from './JoiObjectId'
import Joi from '@hapi/joi'

export const createNotification = () => Joi.object().keys({
  to: JoiObjectId.string().objectId().label('to User ID'),
  body: Joi.string().required().max(100).label('Notification body'),
  unread: Joi.boolean().required().label('unread value'),
  show: Joi.boolean().required().label('show value'),
  post: JoiObjectId.string().objectId().label('to Post ID'),
  comment: JoiObjectId.string().objectId().label('to Comment ID'),
  event: JoiObjectId.string().objectId().label('to Event ID'),
  from: JoiObjectId.string().objectId().label('from User ID')
})
