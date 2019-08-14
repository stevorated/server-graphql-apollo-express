import mongoose, { Schema } from 'mongoose'

// const ObjectId = Schema.Types.ObjectId

const sessionSchema = new mongoose.Schema({
  expires: {
    type: String
  },
  session: {
    type: Schema.Types.Mixed
  }
}
)

const Session = mongoose.model('Session', sessionSchema)

export default Session
