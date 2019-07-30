import mongoose, { Schema } from 'mongoose'
import { hash, compare } from 'bcryptjs'
import Notification from './Notification'

const ObjectId = Schema.Types.ObjectId

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: [8, 'Email too short!'],
    validate: {
      validator: email => User.doesntExist({ email }),
      message: ({ value }) => `Mail already exists `
    }
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: [2, 'username too short! must be at least 2 letters long '],
    validate: {
      validator: username => User.doesntExist({ username }),
      message: ({ value }) => `User already exists`
    }
  },
  fname: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minlength: [2, 'first name too short! must be at least 2 letters long ']
  },
  fbId: {
    type: String
  },
  lname: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    minlength: [2, 'last name too short! must be at least 2 letters long ']
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: [7, 'password must be at least 7 letters long ']
  },
  active: {
    type: Boolean,
    default: true
  },
  posts: [{
    type: ObjectId,
    ref: 'Post'
  }],
  likes: [{
    type: ObjectId,
    ref: 'Post'
  }],
  avatar: {
    type: ObjectId,
    ref: 'File'
  },
  followingEvents: [{
    type: ObjectId,
    ref: 'User'
  }],
  following: [{
    type: ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: ObjectId,
    ref: 'User'
  }],
  events: {
    type: ObjectId,
    ref: 'Event'
  }
},
{
  timestamps: true
})

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 10)
  }
})

userSchema.statics.doesntExist = async function (options) {
  return await this.where(options).countDocuments() === 0
}

userSchema.methods.passwordMatch = function (password) {
  return compare(password, this.password)
}

userSchema.post('save', async function () {
  if (this._update && (this._update.$push || this._update.$pull)) {
    // console.log('save-user')
  } else {
    await Notification.create({
      from: this.id,
      to: null,
      body: `new account created!,  username: ${this.username}`,
      show: false,
      action: 'Create-Profile',
      event: null,
      post: null,
      comment: null
    })
  }
})

userSchema.post('updateOne', async function (next) {
  const { username, fname, lname } = this._update
  if (this._update && (this._update.$push || this._update.$pull)) {
    // console.log('updateOne-user')
  } else {
    await Notification.create({
      from: this._conditions._id,
      to: null,
      body: `update his profile details are: {${username}, ${fname}, ${lname}}`,
      show: false,
      action: 'Update-Profile',
      event: null,
      post: null,
      comment: null
    })
  }
  // console.log(notification)
})

const User = mongoose.model('User', userSchema)

export default User
