import { gql } from 'apollo-server-express'

export default gql`
  extend type Query {
    me: User @auth
    user(id: ID!): User @auth
    searchUsers(filter: UserFilter): [User]! @auth
    users: [User!]! @auth
  }

  extend type Mutation {
    signUp(
      email: String!
      username: String!
      fname: String!
      lname: String!
      password: String!
    ): User @guest
    signIn(email: String!, password: String!): User @guest
    startResetPassword(email: String!): Boolean @guest
    resetPassword(newPassword: String!, token: String!): Boolean @guest
    changePassword(password: String!, newPassword: String!): Boolean @auth
    signOut: Boolean @auth
    updateMyProfile(
      username: String
      fname: String
      lname: String
      bio: String
      dataOfBirth: String
      sex: String
    ): User @auth
    follow(id: ID!): User @auth
  }

  input UserFilter {
    email: String
    username: String
    lname: String
    fname: String
  }

  type User {
    id: ID!
    email: String!
    email_confirmed: Boolean
    username: String!
    fname: String!
    lname: String!
    events: [Event]!
    posts: [Post]!
    likes: [Post]
    avatar: File
    followingEvents: [Event]
    following: [User]
    followers: [User]
    seen: [LastNotification]
    bio: String
    createdAt: String!
    updatedAt: String!
  }
`
