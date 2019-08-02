import { gql } from 'apollo-server-express'

export default gql`
  extend type Query {
    getLastNotifications (sort: Int ,limit: Int, skip: Int, unread: Boolean, show: Boolean, post: ID): [LastNotification] @auth
  }

  type LastNotification {
    id: ID!
    originId: ID!
    to: User
    body: String!
    unread: Boolean!
    show: Boolean!
    post: Post
    comment: Comment
    event: Event
    from: User
    type: String
    lastAction: String!
    createdAt: String!
    updatedAt: String!
  }
`
