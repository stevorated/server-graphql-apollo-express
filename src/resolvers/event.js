import Joi from '@hapi/joi'
import mongoose from 'mongoose'
import { uploadImage, createEvent } from '../joiSchemas'
import { File, Event, User, Notification } from '../models'
import { ApolloError } from 'apollo-server-express'
import { UserInputError } from 'apollo-server-core'
import path from 'path'
import { createWriteStream, existsSync } from 'fs'
import mkdirp from 'mkdirp'
import Jimp from 'jimp'
import moment from 'moment'

const { ASSETS_DIR, EVENT_IMAGE_DIR } = process.env

const assetsDir = path.join(__dirname, '../..', ASSETS_DIR, EVENT_IMAGE_DIR)
if (!existsSync(assetsDir)) {
  mkdirp(assetsDir, () => { })
}

const { ObjectId } = mongoose.Types

export default {
  Query: {
    getMonthsEvents: async (root, { month, limit, skip = 0, sort = 1 }, { req }, info) => {
      // const session = req.session.passport ? req.session.passport.user : req.session
      // const { userId } = session
      const controledLimit = (limit > 50 || !limit) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      const minFilter = month || moment().startOf('M').format('YYYY-MM-DD')
      return Event.find({
        // createdBy: ObjectId(userId),
        $and: [
          { startDate: { $gte: moment(minFilter).startOf('M').format('YYYY-MM-DD') } },
          { startDate: { $lte: moment(minFilter).endOf('M').format('YYYY-MM-DD') } }
        ]
      }, null, { sort: { startDate: sort }, limit: controledLimit, skip })
    },
    getMyMonthsEvents: async (root, { month, limit, skip = 0, sort = 1 }, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      const controledLimit = (limit > 50 || !limit) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(userId)) throw new UserInputError(`invalid ID`)
      const minFilter = month || moment().startOf('M').format('YYYY-MM-DD')
      return Event.find({
        createdBy: ObjectId(userId),
        $and: [
          { startDate: { $gte: moment(minFilter).startOf('M').format('YYYY-MM-DD') } },
          { startDate: { $lte: moment(minFilter).endOf('M').format('YYYY-MM-DD') } }
        ]
      }, null, { sort: { startDate: sort }, limit: controledLimit, skip })
    },
    getMyEvents: async (root, { limit = 6, skip = 0, sort = 1, past, followed, suggested }, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      const controledLimit = (limit > 50 || !limit) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(userId)) throw new UserInputError(`invalid ID`)
      const myUser = suggested || followed ? await User.findById(userId) : null

      if (myUser) {
        if (followed) {
          const eventsFilter = myUser.followingEvents.map(id => ObjectId(id))
          const events = await Event.find({ _id: { $in: eventsFilter } }, null, { sort: { startDate: sort }, limit: controledLimit, skip })
          // console.log(events)
          return events
        }
        const createdByFilter = myUser.following
        const events = await Event.find({ startDate: { $gte: moment().format('YYYY-MM-DD') }, createdBy: { $in: createdByFilter } }, null, { sort: { startDate: sort }, limit: controledLimit, skip })
        return events
      }
      if (past) {
        const events = await Event.find({
          startDate: { $gte: moment().add(1, 'days').format('YYYY-MM-DD') }
        },
        null,
        {
          sort: { startDate: sort },
          limit: controledLimit,
          skip
        })
        // console.log('past', events)
        return events
      }
      return Event.find({ createdBy: ObjectId(userId), startDate: { $gte: moment().format('YYYY-MM-DD') } }, null, { sort: { startDate: sort }, limit: controledLimit, skip })
    },
    getMyEventsFeed: async (root, { limit = 6, skip = 0, sort = 1 }, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      const controledLimit = (limit > 50 || !limit) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(userId)) throw new UserInputError(`invalid ID`)
      return Event.find({ createdBy: ObjectId(userId) }, null, { sort: { createdAt: sort }, limit: controledLimit, skip })
    },
    getEvents: async (root, { id, limit = 6, skip = 0, sort = 1, byCreatedAt = false, byPopular = false }, { req }, info) => {
      const controledLimit = (limit > 50 || !limit) ? 50 : limit
      if (id && !ObjectId.isValid(id)) throw new UserInputError(`invalid ID`)
      if (id && ObjectId.isValid(id)) return [Event.findById(id)]
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (byPopular) {
        const events = await Event.find(
          { startDate: { $gte: moment().format('YYYY-MM-DD') }, followersCount: { $gt: 0 } },
          null,
          {
            sort: { followersCount: -1 },
            limit: controledLimit,
            skip
          })
        return events
      }
      if (byCreatedAt) {
        return Event.find({},
          null,
          {
            sort: { createdAt: sort },
            limit: controledLimit,
            skip
          })
      }
      return Event.find({ startDate: { $gte: moment().format('YYYY-MM-DD') } }, null, { sort: { startDate: sort }, limit: controledLimit, skip })
    },
    getEventsFeed: async (root, { id, limit = 6, skip = 0, sort = 1 }, { req }, info) => {
      const controledLimit = (limit > 50 || !limit) ? 50 : limit
      if (id && !ObjectId.isValid(id)) throw new UserInputError(`invalid ID`)
      if (id && ObjectId.isValid(id)) return [Event.findById(id)]
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      return Event.find({}, null, { sort: { createdAt: sort }, limit: controledLimit, skip })
    },
    getUsersEvents: async (root, { id, limit = 6, skip = 0, sort = 1 }, { req }, info) => {
      const controledLimit = (limit > 50 || !limit) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(id)) throw new UserInputError(`invalid ID`)
      return Event.find({ createdBy: ObjectId(id) }, null, { sort: { startDate: sort }, limit: controledLimit, skip })
    }
  },
  Mutation: {
    createEvent: async (root, args, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      const {
        image,
        createdBy,
        fbId,
        name,
        description,
        venue,
        address,
        artists,
        startTimestamp,
        startDate,
        startTime,
        endDate,
        endTime
      } = args
      const { file, size } = image
      args.createdBy = userId
      await Joi.validate({
        createdBy,
        fbId,
        name,
        description,
        venue,
        address,
        artists,
        startTimestamp,
        startDate,
        startTime,
        endDate,
        endTime
      }, createEvent(), { abortEarly: false })
      const uploadData = await processUpload(file, size, 'eventImages', userId)
      const eventData = { ...args, ...uploadData, createdBy: userId }
      const event = await Event.create(eventData)
      await User.updateOne({ _id: userId }, { $push: { events: event } })
      return event
    },
    deleteEvent: async (root, { post }, { req }, info) => {

    },
    followEvent: async (root, args, { req }, info) => {
      const eventToFollow = await Event.findById(args.event)
      // console.log('ya alla', eventToFollow.followers)
      const followersCount = eventToFollow.followers.length
      const myUser = await User.findById(
        req.session.userId
          ? req.session.userId
          : req.session.passport.user.userId
      )

      if (!eventToFollow) {
        return new UserInputError(`Can't really find who u are talking about`)
      }
      // if (myUser.id === eventToFollow.id) {
      //   return new UserInputError(`You Won't realy get a kick from that`)
      // }
      // console.log(myUser)
      if (myUser.followingEvents && myUser.followingEvents.includes(eventToFollow.id)) {
        // console.log('ya alla')
        await User.findByIdAndUpdate(myUser.id, { $pull: { followingEvents: eventToFollow.id } }, { new: true })
        const updatedEventToUnfollow = await Event.findByIdAndUpdate(
          args.event,
          { $pull: { followers: myUser.id }, followersCount: followersCount - 1 },
          { new: true }
        )
        await Notification.create({
          from: myUser.id,
          to: updatedEventToUnfollow.createdBy,
          show: false,
          body: `unfollowed event, name: ${eventToFollow.name} id: ${args.event}`,
          type: 'EventFollowers',
          action: 'Unfollow-Event',
          event: updatedEventToUnfollow._id,
          post: null,
          comment: null
        })
        return updatedEventToUnfollow
      }
      await User.findByIdAndUpdate(myUser.id, { $push: { followingEvents: eventToFollow.id } }, { new: true })
      const updatedEventToFollow = await Event.findByIdAndUpdate(args.event,
        {
          $push: { followers: myUser.id },
          followersCount: followersCount + 1
        },
        { new: true }
      )
      await Notification.create({
        from: myUser.id,
        to: updatedEventToFollow.createdBy,
        body: `followed event,name: ${eventToFollow.name} id: ${args.event}`,
        type: 'EventFollowers',
        action: 'Follow-Event',
        event: updatedEventToFollow._id,
        post: null,
        comment: null
      })
      return updatedEventToFollow
    }
  },
  Event: {
    createdBy: async (user, args, context, info) => {
      return (await user.populate('createdBy').execPopulate()).createdBy
    },
    followers: async (user, args, context, info) => {
      return (await user.populate('followers').execPopulate()).followers
    },
    thumbnil: async (user, args, context, info) => {
      const res = await user.populate({ path: 'thumbnil' }).execPopulate()
      return res.thumbnil
    },
    coverPhoto: async (user, args, context, info) => {
      const res = await user.populate({ path: 'coverPhoto' }).execPopulate()
      return res.coverPhoto
    }
  }
}
// PROCESS AND VALIDATE IMAGE
const processUpload = async (upload, size, type, userId) => {
  try {
    const sizeToNum = parseInt(size.split(' ')[0])
    switch (type) {
      case 'eventImages':
        const time = Date.now().toString()
        const { filename, mimetype, encoding, createReadStream } = await upload

        await Joi.validate(
          { size: sizeToNum, mimetype },
          uploadImage(size),
          { abortEarly: false }
        )
        const ext = filename.split('.')[1]

        const uniqueFilenameCover = `events_cover_${time}_${userId}.${ext}`
        const uniqueFilenameThumb = `events_thumb_${time}_${userId}.${ext}`

        const pathToCover = path.join(assetsDir, uniqueFilenameCover)
        const pathToThumb = path.join(assetsDir, uniqueFilenameThumb)

        const urlCover = `/images/events/${uniqueFilenameCover}`
        const urlThumb = `/images/events/${uniqueFilenameThumb}`

        await new Promise((resolve) =>
          createReadStream()
            .pipe(createWriteStream(pathToCover))
            .on('error', e => console.log(e))
            .on('close', resolve))

        await Jimp.read(pathToCover)
          .then((image) => {
            return image
              .resize(75, 75) // resize
              .quality(60) // set JPEG quality
              // .greyscale() // set greyscale
              .write(pathToThumb)
          }).catch(e => console.log('Error!', e))

        const fileCover = await File.create({
          mimetype,
          filename: uniqueFilenameCover,
          encoding,
          path: pathToCover,
          url: urlCover,
          // bigUrl,
          createdBy: userId,
          size
        })
        const fileThumb = await File.create({
          mimetype,
          filename: uniqueFilenameThumb,
          encoding,
          path: pathToThumb,
          url: urlThumb,
          // bigUrl,
          createdBy: userId,
          size
        })

        return { coverPhoto: fileCover.id, thumbnil: fileThumb.id }
      default:
        break
    }
  } catch (error) {
    return new ApolloError('something went wrong, try again later')
  }
}
