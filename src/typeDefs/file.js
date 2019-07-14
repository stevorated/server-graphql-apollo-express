import { gql } from 'apollo-server-express'

export default gql`

  extend type Mutation {
    singleUpload(
      file: Upload, 
      size: String!, 
      asect: Int, 
      height: Int, 
      unit: String, 
      width: Int,
      x: Int, 
      y: Int, 
      scaleX: Int, 
      scaleY:Int)
      : File! @auth
  }

  extend type Query {
    uploads: [File]
  }

  type File {
    id: ID!
    mimetype: String!
    filename: String!
    encoding: String!
    path: String!
    url: String!
    # bigUrl: String
    size: String!
    createdBy: User!
    createdAt: String!
  }
`
