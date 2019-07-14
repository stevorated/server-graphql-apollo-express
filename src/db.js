import mongoose from 'mongoose'
import {
  DB_HOST,
  DB_NAME,
  DB_USER
} from './config'

export const mongoString = process.env.NODE_ENV === 'production' 
  ? `mongodb+srv://${process.env.DB_USER}:${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`
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
