import mongoose, { Schema } from 'mongoose'
import Notification from './Notification'
const ObjectId = Schema.Types.ObjectId

const postSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
    // validate: {
    //   validator: email => User.doesntExist({ email }),
    //   message: ({ value }) => `Mail already exists`
    // },
  },
  createdBy: {
    type: ObjectId,
    required: true,
    ref: 'User'
  },
  comments: [{
    type: ObjectId,
    required: true,
    ref: 'Comment'
  }],
  likes: [{
    type: ObjectId,
    ref: 'User'
  }],
  lastComment: {
    type: ObjectId,
    ref: 'Comment'
  }
}, {
  timestamps: true
}
)

postSchema.pre('deleteOne', async function () {
  const prev = this._conditions._id
  await Notification.create({
    from: prev.createdBy,
    to: null,
    show: false,
    post: prev,
    event: null,
    body: `deleted a post saying: ${prev.body}`,
    action: 'Delete-Post',
    comment: null
  })
})

postSchema.post('save', async function () {
  await Notification.create({
    from: this.createdBy,
    to: null,
    body: `posted ${this.body}`,
    post: this,
    action: 'Create-Post',
    event: null,
    comment: null
  })
})

// postSchema.post('updateOne', async function () {
//   console.log('Ya alla')
//   console.log(this)
//   // await Notification.create({
//   //   from: this.createdBy,
//   //   to: null,
//   //   body: `posted ${this.body}`,
//   //   post: this,
//   //   action: 'Create-Post',
//   //   event: null,
//   //   comment: null
//   // })
// })

const Post = mongoose.model('Post', postSchema)

export default Post
