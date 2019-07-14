import Joi from '@hapi/joi'
import { createComment } from '../joiSchemas'
import { Post, Comment } from '../models'
// import { UserInputError } from 'apollo-server-core'

export default {
  Mutation: {
    createComment: async (root, args, { req }, info) => {
      const { userId } = req.session
      const { body, post } = args
      await Joi.validate(args, createComment(post), { abortEarly: false })
      // const idsFound = await User.where('_id').in(userIds).countDocuments()
      // if (idsFound !== userIds.length) {
      //   throw new UserInputError('One or more UserIds are INVALID')
      // }
      // userIds.push(userId)
      const comment = await Comment.create({ body, createdBy: userId, post })
      // await User.updateOne({_id: })
      await Post.updateOne({ _id: post }, { $push: { comments: comment } })
      return comment
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
