import Joi from '@hapi/joi'
import mongoose from 'mongoose'
import { createPost } from '../joiSchemas'
import { User, Post, Comment } from '../models'
import { UserInputError } from 'apollo-server-core'

const { ObjectId } = mongoose.Types

export default {
  Query: {
    getMyPosts: async (root, { id, limit = null, skip = 0, sort = -1 }, { req }, info) => {
      // VALIDATION
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`) // CHANGED
      if (!ObjectId.isValid(req.session.userId)) throw new UserInputError(`invalid ID`) // CHANGED - REMOVED CURELY BRACES
      // QUERY
      const posts = await Post.find({ createdBy: ObjectId(req.session.userId) }, null, { sort: { createdAt: sort }, limit, skip })
      return posts
    },
    getPosts: async (root, { limit = null, skip = 0 }, { req }, info) => {
      // QUERY
      const posts = await Post.find({}, null, { sort: { createdAt: -1 }, limit, skip })
      return posts
    },
    getUsersPosts: async (root, { id, limit = null, skip = 0, sort = -1 }, { req }, info) => {
      // VALIDATION
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(id)) throw new UserInputError(`invalid ID`)
      // QUERY
      const posts = await Post.find({ createdBy: ObjectId(id) }, null, { sort: { createdAt: sort }, limit, skip })
      return posts
    }
  },
  Mutation: {
    createPost: async (root, args, { req }, info) => {
      const { userId } = req.session
      const { body } = args
      // VALIDATION
      await Joi.validate(args, createPost(userId), { abortEarly: false })
      // QUERY
      const post = await Post.create({ body, createdBy: userId })
      await User.updateOne({ _id: userId }, { $push: { posts: post } })
      return post
    },
    deletePost: async (root, { post }, { req }, info) => {
      try {
        // VALIDATION
        const postToDeleteExists = await Post.findById(post)
        if (postToDeleteExists) {
          const postOwner = await User.findById(postToDeleteExists.createdBy)
          if (postOwner.id !== req.session.userId) {
            return new UserInputError('Hey It\'s Not Your Post!')
          }
          // QUERY
          await User.updateOne({ _id: ObjectId(postOwner.id) }, { $pull: { posts: post } })
          await Comment.deleteMany({ post })
          await Post.findByIdAndDelete(postToDeleteExists)
          return true
        } else {
          return new UserInputError('Invalid post ID!')
        }
      } catch (e) {
        return e
      }
    }
  },

  Post: {
    comments: async (user, args, context, info) => {
      return (await user.populate('comments').execPopulate()).comments
    },
    createdBy: async (user, args, context, info) => {
      return (await user.populate('createdBy').execPopulate()).createdBy
    }
  }
}

// const idsFound = await User.where('_id').in(userIds).countDocuments()
// if (idsFound !== userIds.length) {
//   throw new UserInputError('One or more UserIds are INVALID')
// }
// userIds.push(userId)
