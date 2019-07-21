import mongoose, { Schema } from 'mongoose'

const ObjectId = Schema.Types.ObjectId

const notificationSchema = new mongoose.Schema({
  to: {
    type: ObjectId,
    // required: true,
    ref: 'User'
  },
  body: {
    type: String,
    required: true,
    maxlength: 1000
  },
  new: {
    type: Boolean,
    required: true,
    default: true
  },
  show: {
    type: Boolean,
    required: true,
    default: true
  },
  post: {
    type: ObjectId,
    ref: 'Post'
  },
  comment: {
    type: ObjectId,
    ref: 'Comment'
  },
  event: {
    type: ObjectId,
    ref: 'Event'
  },
  action: {
    type: String,
    default: 'unknown'
  },
  from: {
    type: ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
}
)

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
