import JoiUser from './JoiObjectId'
import Joi from '@hapi/joi'

export const createEvent = () => Joi.object().keys({
  createdBy: JoiUser.string().objectId().label('User ID'),
  fbId: Joi.string().label('FB ID'),
  name: Joi.string().required().label('Event Name (name)'),
  description: Joi.string().max(250).label('Event Description (description)'),
  venue: Joi.string().required().max(100).label('Event Venue (venue)'),
  address: Joi.string().allow('').label('Event Address (address)'),
  artists: Joi.array().required().max(10).label('Event Artist list (artists)'),
  startDate: Joi.string().required().max(15).label('Event Start Date (startDate)'),
  startTime: Joi.string().required().max(15).label('Event Start Time (startTime)'),
  endDate: Joi.string().max(15).label('Event End Date (endDate)'),
  endTime: Joi.string().max(15).label('Event End Time (endTime)')
})
