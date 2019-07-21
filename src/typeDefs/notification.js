import { gql } from 'apollo-server-express'

export default gql`
  extend type Mutation {
    createNotification (
      body: String
      new: Boolean
      show: Boolean
      post: ID
      event: ID
      action: String
      ): Notification @auth
    readNotification (
      id: ID!
    ): Notification
  }

  extend type Query {
    getMyNotifications (sort: Int ,limit: Int, skip: Int): [Notification] @auth
    getGlobalNotifications (sort: Int ,limit: Int, skip: Int): [Notification] @auth
  }

  type Notification {
    id: ID!
    to: User
    body: String!
    new: Boolean!
    show: Boolean!
    post: Post
    comment: Comment
    event: Event
    from: User
    action: String!
    createdAt: String!
    updatedAt: String!
  }
`
