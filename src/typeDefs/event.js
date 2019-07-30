import { gql } from 'apollo-server-express'

export default gql`
  extend type Mutation {
    createEvent (
      fbId: String,
      name: String!,
      description: String,
      image: Upload!,
      venue: String!,
      address: String,
      artists: [String!]!,
      startDate: String!,
      startTime: String!,
      endDate: String,
      endTime: String
      ): Event @auth

    deleteEvent(event: ID!): Boolean @auth
    followEvent(event: ID!): Event @auth
  }

  extend type Query {
    getMonthsEvents(month: String, sort: Int, limit: Int, skip: Int): [Event] @auth
    getMyMonthsEvents(month: String, sort: Int, limit: Int, skip: Int, followed: Boolean, suggested: Boolean): [Event] @auth
    getMyEvents(sort: Int ,limit: Int, skip: Int, past: Boolean, followed: Boolean, suggested: Boolean): [Event] @auth
    getMyEventsFeed(sort: Int ,limit: Int, skip: Int): [Event] @auth
    getEvents(id: ID, limit: Int, skip: Int, byCreatedAt: Boolean, byPopular: Boolean): [Event] @auth
    getEventsFeed(id: ID, limit: Int, skip: Int): [Event] @auth
    getUsersEvents(id: ID! sort: Int ,limit: Int, skip: Int): [Event] @auth
  }

  type Event {
    id: ID!
    createdBy: User!
    fbId: String
    name: String!
    followers: [User]
    followersCount: Int
    description: String
    coverPhoto: File!
    thumbnil: File!
    venue: String!
    address: String
    artists: [String!]!
    startDate: String!
    startTime: String!
    endDate: String
    endTime: String
    createdAt: String!
    updatedAt: String!
  }
`
