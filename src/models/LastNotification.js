import mongoose, { Schema } from 'mongoose'

const ObjectId = Schema.Types.ObjectId

const LastNotificationSchema = new mongoose.Schema(
  {
    originId: {
      type: ObjectId,
      // required: true,
      ref: 'Notification'
    },
    to: {
      type: ObjectId,
      // required: true,
      ref: 'User'
    },
    unread: {
      type: Boolean,
      default: true
    },
    show: {
      type: Boolean,
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
    type: {
      type: String,
      default: null
    },
    lastAction: {
      type: String,
      default: 'unknown'
    },
    from: {
      type: ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

const LastNotification = mongoose.model('Last_Notification', LastNotificationSchema)

export default LastNotification
