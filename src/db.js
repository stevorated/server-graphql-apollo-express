import mongoose from 'mongoose'
import {
  DB_HOST,
  DB_NAME,
  DB_USER
} from './config'

export const mongoString = process.env.NODE_ENV === 'production'
  ? process.env.DB_URL
  : `mongodb+srv://${DB_USER}:${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`

export default async () => {
  try {
    await mongoose.connect(mongoString, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true
    })
    console.log('connection GOOD')
  } catch (err) {
    console.log('Cant connect to DB')
  }
}
