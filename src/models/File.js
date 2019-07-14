import mongoose, { Schema } from 'mongoose'

const ObjectId = Schema.Types.ObjectId

const fileSchema = new Schema({
  mimetype: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  encoding: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  // bigUrl: {
  //   type: String
  //   // required: true
  // },
  size: {
    type: String,
    required: true
  },
  createdBy: {
    type: ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
})

const File = mongoose.model('File', fileSchema)

export default File
