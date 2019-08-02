import { LastNotification, User } from '../models'
import { UserInputError } from 'apollo-server-core'
import mongoose from 'mongoose'

const { ObjectId } = mongoose.Types

export default {
  Query: {
    getLastNotifications: async (root, {
      limit = 10,
      skip = 0,
      sort = -1,
      unread = true,
      show = true
    }, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      // VALIDATION
      const controledLimit = (limit && limit > 50) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`) // CHANGED
      if (!ObjectId.isValid(userId)) throw new UserInputError(`invalid ID`) // CHANGED - REMOVED CURELY BRACES
      // QUERY
      const res = await LastNotification.find({
        from: { $ne: ObjectId(userId) },
        unread,
        show
      }, null, { sort: { createdAt: sort }, limit: controledLimit, skip })
      console.log(res)
      const idsArray = res.map((notification) => {
        return notification.originId
      })

      await User.updateOne(
        { _id: ObjectId(userId) },
        { $addToSet: { seen: [...idsArray] } }
      )
      return res
    }
  },
  LastNotification: {
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
