import mongoose, { Schema } from 'mongoose'

const ObjectId = Schema.Types.ObjectId

const notificationSchema = new mongoose.Schema(
  {
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
    unread: {
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
    type: {
      type: String,
      default: null
    },
    action: {
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

notificationSchema.post('save', () => {
  Notification.aggregate([
    {
      $match: { }
    }, {
      $sort: {
        createdAt: 1
      }
    }, {
      $group: {
        _id: {
          post: '$post',
          comment: '$comment',
          event: '$event',
          type: '$type',
          from: '$from'
        },
        lastAction: {
          $last: '$action'
        },
        createdAt: {
          $last: '$createdAt'
        },
        show: {
          $last: '$show'
        },
        unread: {
          $last: '$unread'
        },
        to: {
          $last: '$to'
        },
        originId: {
          $last: '$_id'
        }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id.type',
        lastAction: '$lastAction',
        post: '$_id.post',
        comment: '$_id.comment',
        event: '$_id.event',
        from: '$_id.from',
        to: '$to',
        show: '$show',
        unread: '$unread',
        createdAt: '$createdAt',
        originId: '$originId'
      }
    },
    {
      $out: 'last_notifications'
    }
  ]).then(res => console.log(res))
})

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
// let arr = []

// console.log(testFunc())
// console.log(arr)
