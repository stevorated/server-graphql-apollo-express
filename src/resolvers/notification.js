import Joi from '@hapi/joi'
import { createNotification } from '../joiSchemas'
import { Post, Comment, Event, Notification } from '../models'
import { UserInputError } from 'apollo-server-core'
import { ApolloError } from 'apollo-server-express'
import mongoose from 'mongoose'

const { ObjectId } = mongoose.Types

export default {
  Mutation: {
    createNotification: async (root, args, { req }, info) => {
      const { userId } = req.session
      let to = null
      if (args.post) {
        const post = await Post.findById(args.post)
        console.log(post)
        if (post.createdBy.toString() === userId) {
          return new ApolloError('No need for notifications on yourself, ehh?')
        } else {
          to = post.createdBy.toString()
        }
      }
      if (args.event) {
        const event = await Event.findById(args.event)
        if (event.createdBy.toString() === userId) {
          return new ApolloError('No need for notifications on yourself, ehh?')
        } else {
          to = event.createdBy.toString()
        }
      }
      // console.log('to:', to)
      args.new = args.new ? args.new : true
      args.show = args.show ? args.show : true
      // console.log({ ...args, from: userId, to })
      // await Joi.validate({ ...args, from: userId, to }, createNotification(userId), { abortEarly: false })
      const notification = await Notification.create({ ...args, from: userId, to })
      // console.log(notification)
      return notification
    }
  },
  Query: {
    getMyNotifications: async (root, {
      limit = null,
      skip = 0,
      sort = -1
    }, { req }, info) => {
      // VALIDATION
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`) // CHANGED
      if (!ObjectId.isValid(req.session.userId)) throw new UserInputError(`invalid ID`) // CHANGED - REMOVED CURELY BRACES
      // QUERY
      const res = await Notification.find({ show: true }, null, { sort: { createdAt: sort }, limit, skip })
      return res
    },
    getGlobalNotifications: async (root, {
      id,
      limit = null,
      skip = 0,
      sort = -1,
      show = false,
      to = null
    }, { req }, info) => {
      // VALIDATION
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(req.session.userId)) throw new UserInputError(`invalid ID`)

      // QUERY
      const res = await Notification.find({ to, show }, null, { sort: { createdAt: sort }, limit, skip })
      return res
    }
  },
  Notification: {
    post: async (notification, args, context, info) => {
      const res = await notification.populate('post').execPopulate()
      return res.post
    },
    comment: async (notification, args, context, info) => {
      const res = await notification.populate('comment').execPopulate()
      return res.comment
    },
    event: async (notification, args, context, info) => {
      const res = await notification.populate('event').execPopulate()
      return res.event
    },
    to: async (notification, args, context, info) => {
      const res = await notification.populate('to').execPopulate()
      return res.to
    },
    from: async (notification, args, context, info) => {
      const res = await notification.populate('from').execPopulate()
      return res.from
    }
  }
}
