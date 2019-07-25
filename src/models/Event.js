import mongoose, { Schema } from 'mongoose'
import Notification from './Notification'
const ObjectId = Schema.Types.ObjectId

const eventSchema = new mongoose.Schema({
  createdBy: {
    type: ObjectId,
    required: true,
    ref: 'User'
  },
  fbId: {
    type: String
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
    // validate: {
    //   validator: email => User.doesntExist({ email }),
    //   message: ({ value }) => `Mail already exists`
    // },
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
    // validate: {
    //   validator: email => User.doesntExist({ email }),
    //   message: ({ value }) => `Mail already exists`
    // },
  },

  coverPhoto: {
    type: ObjectId,
    required: true,
    ref: 'File'
  },

  thumbnil: {
    type: ObjectId,
    required: true,
    ref: 'File'
  },
  venue: {
    type: String,
    required: true,
    maxlength: 100
  },
  address: {
    type: String,
    maxlength: 100
  },
  artists: {
    type: [String],
    required: true,
    maxlength: 100
  },

  startDate: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endDate: {
    type: String
  },
  endTime: {
    type: String
  }
  // going: {
  //   type: [ObjectId],
  //   ref: 'User'
  // },
  // maybe: {
  //   type: [ObjectId],
  //   ref: 'User'
  // },
  // invited: {
  //   type: [ObjectId],
  //   ref: 'User'
  // },
  // declined: {
  //   type: [ObjectId],
  //   ref: 'User'
  // }
  // eventPosts: [{
  //   type: ObjectId,
  //   required: true,
  //   ref: 'eventPost'
  // }],
  // lastComment: {
  //   type: ObjectId,
  //   ref: 'Comment'
  // }
}, {
  timestamps: true
}
)

eventSchema.pre('deleteOne', async function () {
  // console.log('removing')
  const prev = this._conditions._id
  const notification = await Notification.create({
    from: prev.createdBy,
    to: null,
    evemt: prev,
    show: false,
    body: `deleted an evemt saying: ${prev.name}`,
    action: 'Delete-Event'
  })
  // console.log(notification)
  // next()
})

eventSchema.post('save', async function () {
  const notification = await Notification.create({
    from: this.createdBy,
    to: null,
    body: `published a new event ${this.name}`,
    event: this,
    action: 'Create-Event'
  })
  // console.log(notification)
})

const Event = mongoose.model('Event', eventSchema)

export default Event
