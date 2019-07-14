import mongoose, { Schema } from 'mongoose'

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
  lastComment: {
    type: ObjectId,
    ref: 'Comment'
  }
}, {
  timestamps: true
}
)

const Post = mongoose.model('Post', postSchema)

export default Post
