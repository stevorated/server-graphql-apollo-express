import Joi from '@hapi/joi'
import mongoose from 'mongoose'
import { User, Notification } from '../models'
import { UserInputError, ApolloError } from 'apollo-server-express'
import { attmeptSignIn, signOut, checkPassword } from '../auth'
import { signIn, signUp, updateMyProfile, changePassword, resetPassword } from '../joiSchemas'
import { sendWelcomeEmail, sendResetPasswordEmail } from '../utils/mailConfig'
import jwt from 'jsonwebtoken'

const { ObjectId } = mongoose.Types
const { MY_PUBLIC_DOMAIN, RESET_TOKEN_SECRET, SESSION_NAME } = process.env

export default {
  Query: {
    me: async (root, args, { req }, info) => {
      const res = await User.findById(
        req.session.passport
          ? req.session.passport.user.userId
          : req.session.userId
      )
      return res
    },
    users: (root, args, { req }, info) => {
      const users = User.find({})
      if (users.legnth) {
        throw new UserInputError(`Found no Users`)
      }
      return users
    },
    searchUsers: (root, args, { req }, info) => {
      const users = User.find(
        {
          $or: [
            { fname: { $regex: `${args.filter.fname}`, $options: 'i' } },
            { lname: { $regex: `${args.filter.lname}`, $options: 'i' } },
            { username: { $regex: `${args.filter.username}`, $options: 'i' } },
            { email: { $regex: `${args.filter.email}`, $options: 'i' } }
          ]
        },
        null,
        { limit: 4 }
      )
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
      req.session.save()
      const userWithToken = await User.findById(user.id)
      const linkToConfirm =
        `${MY_PUBLIC_DOMAIN}/api/confirm_mail/${userWithToken.email_token}`
      await sendWelcomeEmail(user.email, user.fname, linkToConfirm)
      return user
    },

    resetPassword: async (root, args, { req }, info) => {
      await Joi.validate(args, resetPassword, { abortEarly: false })
      const tokenDecoded = jwt.verify(args.token, RESET_TOKEN_SECRET)
      if (tokenDecoded.id) {
        const user = await User.findById(tokenDecoded.id)
        if (user && user.verifiedResetToken  && args.token === user.reset_password_token) {
          await User.updateOne({ _id: ObjectId(tokenDecoded.id) }, { password: args.newPassword, verifiedResetToken: false, reset_password_token: null })
          // req.session.userId = user.id
          // req.session.save()
          return true
        } else {
          throw new ApolloError('something went wrong..')
        }
      }
    },
    startResetPassword: async (root, args, { req }, info) => {
      const { email } = args
      const user = await User.findOne({ email: email })
      try {
        const token = await jwt.sign({ id: user.id }, RESET_TOKEN_SECRET, { expiresIn: '15 minutes' }) // TODO: change secret to hash
        const link = `${MY_PUBLIC_DOMAIN}/reset_password_start/${token}`
        await User.updateOne({ _id: ObjectId(user.id) }, { reset_password_token: token, verifiedResetToken: false })
        await sendResetPasswordEmail(email, link)
        return true
      } catch (err) {
        return false
      }
    },
    signIn: async (root, args, { req, res }, info) => {
      const { email, password } = args
      await Joi.validate(args, signIn, { abortEarly: false })
      const user = await attmeptSignIn(email, password)
      req.session.userId = user.id
      res.cookie(SESSION_NAME, user.id, {
        signed: true,
        httpOnly: true,
        secure: process.env.IN_PROD
      }) // TODO: Change to header.cookie
      req.session.save()
      return user
    },
    changePassword: async (root, args, { req, res }, info) => {
      const { password, newPassword } = args
      const { userId } = req.session
      await Joi.validate(args, changePassword, { abortEarly: false })
      const user = await checkPassword(userId, password)
      if (user) {
        await User.updateOne({ _id: ObjectId(userId) }, { password: newPassword })
        return true
      } else {
        throw new ApolloError('wrong details')
      }
    },
    signOut: (root, args, { req, res }, info) => {
      return signOut(req, res)
    },
    updateMyProfile: async (root, args, { req, res }, info) => {
      const session = req.session.passport
        ? req.session.passport.user
        : req.session
      const { userId } = session
      const { username, fname, lname, bio } = args
      const usernameTaken = !(await User.doesntExist({ username }))
      // console.log('taken?', usernameTaken)
      if (usernameTaken) {
        return new UserInputError('Sorry this username is already taken')
      }
      await Joi.validate({ username, fname, lname, bio }, updateMyProfile, {
        abortEarly: false
      })
      await User.updateOne({ _id: ObjectId(userId) }, { ...args })
      const user = await User.findById(userId)
      console.log(bio)
      return user
    },
    follow: async (root, args, { req, res }, info) => {
      const userToFollow = await User.findById(args.id)
      const myUser = await User.findById(
        req.session.userId
          ? req.session.userId
          : req.session.passport.user.userId
      )

      if (!userToFollow) {
        return new UserInputError(`Can't really find who u are talking about`)
      }
      if (myUser.id === userToFollow.id) {
        return new UserInputError(`You Won't realy get a kick from that`)
      }

      if (myUser.following && myUser.following.includes(userToFollow.id)) {
        await User.findByIdAndUpdate(
          myUser.id,
          { $pull: { following: userToFollow.id } },
          { new: true }
        )
        const updatedUserToFollow = await User.findByIdAndUpdate(
          args.id,
          { $pull: { followers: myUser.id } },
          { new: true }
        )
        await Notification.create({
          from: myUser.id,
          to: userToFollow.id,
          body: `unfollowed ${myUser.id}`,
          type: 'UserFollowers',
          action: 'Unfollow-User',
          event: null,
          post: null,
          comment: null
        })
        return updatedUserToFollow
      }
      await User.findByIdAndUpdate(
        myUser.id,
        { $push: { following: userToFollow.id } },
        { new: true }
      )
      const updatedUserToFollow = await User.findByIdAndUpdate(
        args.id,
        { $push: { followers: myUser.id } },
        { new: true }
      )
      // console.log(updatedUserToFollow)
      await Notification.create({
        from: myUser.id,
        to: userToFollow.id,
        body: `followed ${myUser.id}`,
        type: 'UserFollowers',
        action: 'Follow-User',
        event: null,
        post: null,
        comment: null
      })
      return updatedUserToFollow
    }
  },
  User: {
    posts: async (user, args, context, info) => {
      const res = await user
        .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
        .execPopulate()
      return res.posts
    },
    likes: async (user, args, context, info) => {
      const res = await user
        .populate({ path: 'likes', options: { sort: { createdAt: -1 } } })
        .execPopulate()
      return res.likes
    },
    followingEvents: async (user, args, context, info) => {
      const res = await user
        .populate({
          path: 'followingEvents',
          options: { sort: { createdAt: -1 } }
        })
        .execPopulate()
      return res.followingEvents
    },
    following: async (user, args, context, info) => {
      const res = await user
        .populate({ path: 'following', options: { sort: { createdAt: -1 } } })
        .execPopulate()
      return res.following
    },
    followers: async (user, args, context, info) => {
      const res = await user
        .populate({ path: 'followers', options: { sort: { createdAt: -1 } } })
        .execPopulate()
      return res.followers
    },
    seen: async (user, args, context, info) => {
      const res = await user.populate({ path: 'seen' }).execPopulate()
      return res.seen
    },
    avatar: async (user, args, context, info) => {
      const res = await user.populate({ path: 'avatar' }).execPopulate()
      return res.avatar
    }
  }
}
