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
  }

  extend type Query {
    getMyEvents(sort: Int ,limit: Int, skip: Int): [Event] @auth
    getMyEventsFeed(sort: Int ,limit: Int, skip: Int): [Event] @auth
    getEvents(id: ID, limit: Int, skip: Int): [Event] @auth
    getEventsFeed(id: ID, limit: Int, skip: Int): [Event] @auth
    getUsersEvents(id: ID! sort: Int ,limit: Int, skip: Int): [Event] @auth
  }

  type Event {
    id: ID!
    createdBy: User!
    fbId: String
    name: String!
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
