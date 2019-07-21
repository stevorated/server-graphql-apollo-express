import mongoose, { Schema } from 'mongoose'
import Notification from './Notification'
import Post from './Post';
const ObjectId = Schema.Types.ObjectId

const commentSchema = new mongoose.Schema({
  post: {
    type: ObjectId,
    required: true,
    ref: 'Post'
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
}
)

commentSchema.pre('deleteOne', async function () {
  console.log('removing')
  const prev = this._conditions._id
  await Notification.create({
    from: prev.createdBy,
    to: null,
    show: false,
    comment: prev,
    post: prev.post,
    body: `deleted a comment saying: ${prev.body}`,
    action: 'Delete-Comment'
  })
  // next()
})

commentSchema.post('save', async function () {
  const post = await Post.findById(this.post)
  await Notification.create({
    from: this.createdBy,
    to: post.createdBy,
    body: `commented ${this.body}`,
    comment: this,
    post: post,
    event: null,
    action: 'Create-Comment'
  })
})

const Comment = mongoose.model('Comment', commentSchema)

export default Comment
