import { File, User } from '../models'
import { uploadImage } from '../joiSchemas'
import Joi from '@hapi/joi'
import Jimp from 'jimp'
// import path from 'path'
import { createWriteStream, existsSync, unlink } from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import { ApolloError } from 'apollo-server-express'
const { ASSETS_DIR, AVATARS_DIR } = process.env
const assetsDir = path.join(__dirname, '../..', ASSETS_DIR, AVATARS_DIR)

if (!existsSync(assetsDir)) {
  mkdirp(assetsDir, () => { })
}

export default {
  Query: {
    uploads: () => File.find()
  },
  Mutation: {
    singleUpload: async (root, args, { req }) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      console.log(args)
      // const { file, size, height, width, x, y } = args
      // console.log({ aspect, height, width, unit, x, y })
      return processUpload(
        args,
        'avatar',
        userId)
    }
  },
  File: {
    createdBy: async (user, args, context, info) => {
      const userFound = await user.populate('createdBy').execPopulate()
      return userFound.createdBy
    }
  }
}

const processUpload = async (upload, type, userId) => {
  const { x, y, width, height, scaleX, scaleY } = upload

  try {
    const sizeToNum = parseInt(upload.size.split(' ')[0])
    switch (type) {
      case 'avatar':
        const time = Date.now().toString()
        const { filename, mimetype, encoding, createReadStream } = await upload.file
        await Joi.validate(
          { size: sizeToNum, mimetype },
          uploadImage(upload.size),
          { abortEarly: false }
        )
        const user = await User.findById(userId)
        console.log(user.avatar)
        const fileToDelete = await File.findByIdAndDelete(user.avatar)
        if (fileToDelete) {
          unlink(fileToDelete.path, () => {})
        }
        // console.log(fileToDelete.path)
        const ext = filename.split('.')[1]
        const uniqueFilename = `avatar_${time}_${userId}.${ext}`

        const pathToFile = path.join(assetsDir, uniqueFilename)
        // const pathToFile = `${assetsDir}/${uniqueFilename}`
        const url = `/images/avatars/${uniqueFilename}`

        await new Promise((resolve) =>
          createReadStream()
            .pipe(createWriteStream(pathToFile))
            .on('error', e => console.log(e))
            .on('close', resolve))

        await Jimp.read(path.join(assetsDir, `${uniqueFilename}`))
          .then((image) => {
            return image
            .crop(x * scaleX / 10000, y * scaleY / 10000, width * scaleX / 10000, height * scaleY / 10000)
            .resize(75, 75) // resize
              // .sepia()
              // .quality(60) // set JPEG quality
              // .greyscale() // set greyscale
              .write(pathToFile)
          }).catch(e => console.log('Error!', e))

        const file = await File.create({
          mimetype,
          filename: uniqueFilename,
          encoding,
          path: pathToFile,
          url,
          // bigUrl,
          createdBy: userId,
          size: upload.size
        })
        await User.updateOne({ _id: userId }, { avatar: file })
        return file

      default:
        break
    }
  } catch (error) {
    return new ApolloError('something went wrong, try again later')
  }
}
