import { gql } from 'apollo-server-express'

export default gql`
  extend type Mutation {
    createComment(body: String!, post: String!): Comment @auth
    updateComment(body: String!, id: String!): Comment @auth
    deleteComment(id: ID!): Comment @auth
  }
  type Comment {
    id: ID!
    post: Post # // TODO: return to be required after rewset DB
    body: String!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }
`
