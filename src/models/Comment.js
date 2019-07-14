import mongoose, { Schema } from 'mongoose'

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

const Comment = mongoose.model('Comment', commentSchema)

export default Comment
