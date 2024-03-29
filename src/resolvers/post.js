import Joi from '@hapi/joi'
import mongoose from 'mongoose'
import { createPost, updatePost } from '../joiSchemas'
import { User, Post, Comment, Notification } from '../models'
import { UserInputError } from 'apollo-server-core'

const { ObjectId } = mongoose.Types

export default {
  Query: {
    getMyPosts: async (root, { id, limit = 10, skip = 0, sort = -1 }, { req }, info) => {
      // VALIDATION
      const controledLimit = (limit > 50) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`) // CHANGED
      if (!ObjectId.isValid(req.session.userId ? req.session.userId : req.session.passport.user.userId)) throw new UserInputError(`invalid ID`) // CHANGED - REMOVED CURELY BRACES
      // QUERY
      const posts = await Post.find({
        createdBy: ObjectId(req.session.userId ? req.session.userId : req.session.passport.user.userId)
      },
      null,
      {
        sort: { createdAt: sort },
        limit: controledLimit,
        skip
      })
      return posts
    },
    getPosts: async (root, { id, limit = 10, skip = 0 }, { req }, info) => {
      // QUERY
      if (!id) {
        const posts = await Post.find({}, null, { sort: { createdAt: -1 }, limit, skip })
        return posts
      } else {
        const post = await Post.find({ _id: ObjectId(id) }, null, { sort: { createdAt: -1 }, limit, skip })
        return post
      }
    },
    getUsersPosts: async (root, { id, limit = 10, skip = 0, sort = -1 }, { req }, info) => {
      // VALIDATION
      const controledLimit = (limit > 50) ? 50 : limit
      if (sort !== 1 && sort !== -1) throw new UserInputError(`invalid sort must be 1 or -1`)
      if (!ObjectId.isValid(id)) throw new UserInputError(`invalid ID`)
      // QUERY
      const posts = await Post.find({ createdBy: ObjectId(id) }, null, { sort: { createdAt: sort }, limit: controledLimit, skip })
      return posts
    }
  },
  Mutation: {
    createPost: async (root, args, { req }, info) => {
      // console.log(req.session)
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      // console.log(userId)
      const { body } = args
      // VALIDATION
      await Joi.validate(args, createPost(userId), { abortEarly: false })
      // QUERY
      const post = await Post.create({ body, createdBy: userId })
      await User.updateOne({ _id: userId }, { $push: { posts: post } })
      return post
    },
    updatePost: async (root, args, { req }, info) => {
      // const session = req.session.passport ? req.session.passport.user : req.session
      // const { userId } = session
      const { body, postId } = args
      await Joi.validate({ body, postId }, updatePost(postId), { abortEarly: false })
      const post = await Post.findByIdAndUpdate(postId, { body }, { new: true })
      return post
    },
    deletePost: async (root, { post }, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      try {
        // VALIDATION
        const postToDeleteExists = await Post.findById(post)
        if (postToDeleteExists) {
          const postOwner = await User.findById(postToDeleteExists.createdBy)
          if (postOwner.id.toString() !== userId.toString()) {
            return new UserInputError('Hey It\'s Not Your Post!')
          }
          // QUERY
          await User.updateOne({ _id: ObjectId(postOwner.id) }, { $pull: { posts: post } })
          await Notification.deleteMany({ post })
          await Comment.deleteMany({ post })
          await Post.deleteOne({ _id: postToDeleteExists })
          return true
        } else {
          return new UserInputError('Invalid post ID!')
        }
      } catch (e) {
        return e
      }
    },
    likePost: async (root, args, { req }, info) => {
      const session = req.session.passport ? req.session.passport.user : req.session
      const { userId } = session
      const likePost = await Post.findById(args.id)
      if (!likePost) {
        return new UserInputError('Something went wrong! can\'t find your post')
      }
      if (likePost.likes.includes(userId)) {
        await Post.updateOne({ _id: ObjectId(args.id) }, { $pull: { likes: userId } })
        const postAfter = await Post.findById(args.id)
        await User.updateOne({ _id: ObjectId(userId) }, { $pull: { likes: args.id } })
        await Notification.create({
          from: userId,
          show: false,
          to: postAfter.createdBy,
          body: `unliked post id:${args.id}`,
          post: args.id,
          type: 'PostLikes',
          action: 'Unlike-Post',
          event: null,
          comment: null
        })
        return postAfter
      }
      await Post.updateOne({ _id: ObjectId(args.id) }, { $push: { likes: userId } })
      const postAfter = await Post.findById(args.id)

      await User.updateOne({ _id: ObjectId(userId) }, { $push: { likes: args.id } })
      await Notification.create({
        from: userId,
        // show: false,
        to: postAfter.createdBy,
        body: `liked post id:${args.id}`,
        post: args.id,
        type: 'PostLikes',
        action: 'Like-Post',
        event: null,
        comment: null
      })
      return postAfter
    }
  },

  Post: {
    comments: async (post, args, context, info) => {
      const res = await post.populate('comments').execPopulate()
      return res.comments
    },
    createdBy: async (post, args, context, info) => {
      const res = await post.populate('createdBy').execPopulate()
      return res.createdBy
    },
    likes: async (post, args, context, info) => {
      const res = await post.populate('likes').execPopulate()
      return res.likes
    }
  }
}

// const idsFound = await User.where('_id').in(userIds).countDocuments()
// if (idsFound !== userIds.length) {
//   throw new UserInputError('One or more UserIds are INVALID')
// }
// userIds.push(userId)
