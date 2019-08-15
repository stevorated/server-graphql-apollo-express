import mongoose, { Schema } from 'mongoose'
import { hash, compare } from 'bcryptjs'
import Notification from './Notification'
import jwt from 'jsonwebtoken'
import moment from 'moment'

const ObjectId = Schema.Types.ObjectId

const userSchema = new mongoose.Schema(
  {
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
    email_token: {
      type: String
    },
    email_confirmed: {
      type: Boolean,
      default: false
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
    reset_password_token: {
      type: String
    },
    verifiedResetToken: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true
    },
    posts: [
      {
        type: ObjectId,
        ref: 'Post'
      }
    ],
    likes: [
      {
        type: ObjectId,
        ref: 'Post'
      }
    ],
    avatar: {
      type: ObjectId,
      ref: 'File'
    },
    followingEvents: [
      {
        type: ObjectId,
        ref: 'User'
      }
    ],
    following: [
      {
        type: ObjectId,
        ref: 'User'
      }
    ],
    followers: [
      {
        type: ObjectId,
        ref: 'User'
      }
    ],
    events: [
      {
        type: ObjectId,
        ref: 'Event'
      }
    ],
    seen: [
      {
        type: ObjectId,
        // unique: true,
        ref: 'Notification'
      }
    ],
    bio: {
      type: String,
      default:
        'lorem ipsum dolor sit amet consectetur adipisicing elit. atque, tenetur?'
    }
  },
  {
    timestamps: true
  }
)

userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 10)
    // const token = jwt.sign({ id: this.id }, process.env.CONFIRM_MAIL_TOKEN_SECRET) // TODO: change secret to hash
    // this.email_token = token
  }
})

userSchema.pre('updateOne', async function() {
  // console.log(this)
  if (this._update.password) {
    const hashed = await hash(this._update.password, 10)
    this.update({ password: hashed })
    // const token = jwt.sign({ id: this.id }, 'shhhhh') // TODO: change secret to hash
    // this.email_token = token
  }
})

userSchema.statics.doesntExist = async function(options) {
  return (await this.where(options).countDocuments()) === 0
}

userSchema.methods.passwordMatch = function(password) {
  return compare(password, this.password)
}

userSchema.post('save', async function() {
  if (this._update && (this._update.$push || this._update.$pull)) {
    // console.log('save-user')
  } else {
    await Notification.create({
      from: this.id,
      to: null,
      body: `new account created!,  username: ${this.username}`,
      show: false,
      type: 'Profile',
      action: 'Create-Profile',
      event: null,
      post: null,
      comment: null
    })
  }
})

const User = mongoose.model('User', userSchema)

export default User
