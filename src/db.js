import mongoose from 'mongoose'
const {
  DB_HOST,
  DB_NAME,
  DB_USER
} = process.env
export const mongoString = `mongodb+srv://${DB_USER}:${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`

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
