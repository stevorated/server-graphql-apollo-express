import Joi from '@hapi/joi'
import mongoose from 'mongoose'
import { uploadImage, createEvent } from '../joiSchemas'
import { File, Event, User } from '../models'
import { ApolloError } from 'apollo-server-express'
import { UserInputError } from 'apollo-server-core'
import path from 'path'
import { createWriteStream, existsSync } from 'fs'
import mkdirp from 'mkdirp'
import Jimp from 'jimp'

const { ASSETS_DIR, EVENT_IMAGE_DIR } = process.env

const assetsDir = path.join(__dirname, '../..', ASSETS_DIR, EVENT_IMAGE_DIR)
if (!existsSync(assetsDir)) {
  mkdirp(assetsDir, () => { })
}

const { ObjectId } = mongoose.Types

export default {
  Query: {
    getMyEvents: async (root, { limit = 5, skip = 0, sort = -1 }, { req }, info) => {
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(req.session.userId)) throw new UserInputError(`invalid ID`)
      return Event.find({ createdBy: ObjectId(req.session.userId) }, null, { sort: { createdAt: sort }, limit, skip })
    },
    getEvents: async (root, { id, limit = 5, skip = 0, sort = -1 }, { req }, info) => {
      if (id && !ObjectId.isValid(id)) throw new UserInputError(`invalid ID`)
      if (id && ObjectId.isValid(id)) return [Event.findById(id)]
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      return Event.find({}, null, { sort: { createdAt: sort }, limit, skip })
    },
    getUsersEvents: async (root, { id, limit = 5, skip = 0, sort = -1 }, { req }, info) => {
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(id)) throw new UserInputError(`invalid ID`)
      return Event.find({ createdBy: ObjectId(id) }, null, { sort: { createdAt: sort }, limit, skip })
    }
  },
  Mutation: {
    createEvent: async (root, args, { req }, info) => {
      const { userId } = req.session
      const {
        image,
        createdBy,
        fbId,
        name,
        description,
        venue,
        address,
        artists,
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
        startDate,
        startTime,
        endDate,
        endTime
      }, createEvent(), { abortEarly: false })
      const uploadData = await processUpload(file, size, 'eventImages', userId)
      const eventData = { ...args, ...uploadData, createdBy: userId }
      const event = await Event.create(eventData)
      // console.log(event.id)
      await User.updateOne({ _id: userId }, { $push: { events: event } })
      return event
    },
    deleteEvent: async (root, { post }, { req }, info) => {

    }
  },
  Event: {
    createdBy: async (user, args, context, info) => {
      return (await user.populate('createdBy').execPopulate()).createdBy
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
