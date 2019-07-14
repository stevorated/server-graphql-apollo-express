import { gql } from 'apollo-server-express'

export default gql`
  extend type Mutation {
    createPost(body: String): Post @auth
    deletePost(post: ID!): Boolean @auth
  }

  extend type Query {
    getMyPosts (sort: Int ,limit: Int, skip: Int): [Post] @auth
    getUsersPosts (id: ID! sort: Int ,limit: Int, skip: Int): [Post] @auth
    getPosts (limit: Int, skip: Int): [Post] @auth
  }

  type Post {
    id: ID!
    body: String!
    createdBy: User!
    comments: [Comment!] # // TODO: consider removing "!"
    lastComments: Comment
    createdAt: String!
    updatedAt: String!
  }
`
