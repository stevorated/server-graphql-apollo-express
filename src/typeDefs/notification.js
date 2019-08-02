import { gql } from 'apollo-server-express'

export default gql`
  extend type Mutation {
    createNotification (
      body: String
      unread: Boolean
      show: Boolean
      post: ID
      event: ID
      type: String
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
    unread: Boolean!
    show: Boolean!
    post: Post
    comment: Comment
    event: Event
    from: User
    type: String
    action: String!
    createdAt: String!
    updatedAt: String!
  }
`
