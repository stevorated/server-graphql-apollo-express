import Joi from '@hapi/joi'
import { createComment, updateComment } from '../joiSchemas'
import { Post, Comment } from '../models'
import { UserInputError } from 'apollo-server-core'
import { ApolloError } from 'apollo-server-express'
import mongoose from 'mongoose'

const { ObjectId } = mongoose.Types

export default {
  Mutation: {
    createComment: async (root, args, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      const { body, post } = args
      await Joi.validate(args, createComment(post), { abortEarly: false })
      const comment = await Comment.create({ body, createdBy: userId, post })
      await Post.updateOne({ _id: post }, { $push: { comments: comment } })
      return comment
    },
    updateComment: async (root, args, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      const { body, id } = args
      await Joi.validate(args, updateComment(id), { abortEarly: false })
      const comment = await Comment.findByIdAndUpdate(id, { body }, { new: true })
      return comment
    },
    deleteComment: async (root, args, { req }, info) => {
      try {
        // VALIDATION
        const session = req.session.passport ? req.session.passport.user : req.session
        const { userId } = session
        const commentToDelete = await Comment.findById(args.id)
        console.log('deleteComment', userId, commentToDelete.createdBy.toString(), commentToDelete.createdBy !== userId)
        if (commentToDelete) {
          console.log()
          if (commentToDelete.createdBy.toString() !== userId && commentToDelete.createdBy !== userId) {
            return new ApolloError('Hey It\'s Not Your Comment!')
          }
          // QUERY
          await Post.findOneAndUpdate({ _id: commentToDelete.post }, { $pull: { comments: commentToDelete._id } }, { new: true })
          const comment = await Comment.findById(commentToDelete.id)
          await Comment.deleteOne({ _id: commentToDelete })
          return comment
        } else {
          return new UserInputError(`something went wrong, probably wrong ID, or comment don't exist anymore... (1) `)
        }
      } catch (e) {
        return new UserInputError(`something went wrong, probably wrong ID, or comment don't exist anymore... (2) `)
      }
    }
  },
  Comment: {
    post: async (post, args, context, info) => {
      return (await post.populate('post').execPopulate()).post
    },
    createdBy: async (user, args, context, info) => {
      return (await user.populate('createdBy').execPopulate()).createdBy
    }
  }
}
