import Joi from '@hapi/joi'
import mongoose from 'mongoose'
import { User } from '../models'
import { UserInputError } from 'apollo-server-express'
import { attmeptSignIn, signOut } from '../auth'
import { signIn, signUp, updateMyProfile } from '../joiSchemas'

const { ObjectId } = mongoose.Types

export default {
  Query: {
    me: (root, args, { req }, info) => {
      return User.findById(req.session.userId)
    },
    users: (root, args, { req }, info) => {
      const users = User.find({})
      if (users.legnth) {
        throw new UserInputError(`Found no Users`)
      }
      return users
    },
    searchUsers: (root, args, { req }, info) => {
      const users = User.find({
        $or: [
          { fname: { $regex: `${args.filter.fname}`, $options: 'i' } },
          { lname: { $regex: `${args.filter.lname}`, $options: 'i' } },
          { username: { $regex: `${args.filter.username}`, $options: 'i' } },
          { email: { $regex: `${args.filter.email}`, $options: 'i' } }
        ]
      }, null, { limit: 4 })
      if (users.legnth) {
        throw new UserInputError(`Found no Users`)
      }
      return users
    },
    user: (root, { id }, { req }, info) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new UserInputError(`invalid ID`)
      }
      return User.findById(id)
    }
  },
  Mutation: {
    signUp: async (root, args, { req }, info) => {
      await Joi.validate(args, signUp, { abortEarly: false })
      const user = await User.create(args)
      req.session.userId = user.id
      return user
    },
    signIn: async (root, args, { req, res }, info) => {
      const { email, password } = args
      await Joi.validate(args, signIn, { abortEarly: false })
      const user = await attmeptSignIn(email, password)
      req.session.userId = user.id
      res.cookie('sid', user.id, { signed: true, httpOnly: true }) // TODO: Change to header.cookie
      return user
    },
    signOut: (root, args, { req, res }, info) => {
      return signOut(req, res)
    },
    updateMyProfile: async (root, args, { req, res }, info) => {
      const { userId } = req.session
      const { username, fname, lname } = args
      const usernameTaken = !await User.doesntExist({ username })
      console.log('taken?', usernameTaken)
      if (usernameTaken) {
        return new UserInputError('Sorry this username is already taken')
      }
      await Joi.validate({ username, fname, lname }, updateMyProfile, { abortEarly: false })
      await User.updateOne({ _id: ObjectId(userId) }, { ...args })
      const user = await User.findById(userId)
      return user
    },
    follow: async (root, args, { req, res }, info) => {
      const userToFollow = await User.findById(args.id)
      const myUser = await User.findById(req.session.userId)

      if (!userToFollow) {
        return new UserInputError(`Can't really find who u are talking about`)
      }
      if (myUser.id === userToFollow.id) {
        return new UserInputError(`You Won't realy get a kick from that`)
      }

      if (myUser.following && myUser.following.includes(userToFollow.id)) {
        await User.findByIdAndUpdate(myUser.id, { $pull: { following: userToFollow.id } }, { new: true })
        const updatedUserToFollow = await User.findByIdAndUpdate(args.id, { $pull: { followers: myUser.id } }, { new: true })
        return updatedUserToFollow
      }
      await User.findByIdAndUpdate(myUser.id, { $push: { following: userToFollow.id } }, { new: true })
      const updatedUserToFollow = await User.findByIdAndUpdate(args.id, { $push: { followers: myUser.id } }, { new: true })
      // console.log(updatedUserToFollow)
      return updatedUserToFollow
    }
  },
  User: {
    posts: async (user, args, context, info) => {
      const res = await user.populate({ path: 'posts', options: { sort: { createdAt: -1 } } }).execPopulate()
      return res.posts
    },
    likes: async (user, args, context, info) => {
      const res = await user.populate({ path: 'likes', options: { sort: { createdAt: -1 } } }).execPopulate()
      return res.likes
    },
    following: async (user, args, context, info) => {
      const res = await user.populate({ path: 'following', options: { sort: { createdAt: -1 } } }).execPopulate()
      return res.following
    },
    followers: async (user, args, context, info) => {
      const res = await user.populate({ path: 'followers', options: { sort: { createdAt: -1 } } }).execPopulate()
      return res.followers
    },
    avatar: async (user, args, context, info) => {
      const res = await user.populate({ path: 'avatar' }).execPopulate()
      return res.avatar
    }
  }
}
