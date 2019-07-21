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
            email: String! , 
            username: String!, 
            fname: String!, 
            lname: String!, 
            password: String!
            ): User @guest
        signIn(email: String! , password: String!): User @guest
        signOut: Boolean @auth
        updateMyProfile(username: String, fname: String, lname: String, aboutMe: String, dataOfBirth: String, sex: String): User @auth
        follow(id: ID!): User @auth
    }

    input UserFilter {
        email: String,
        username: String,
        lname: String,
        fname: String
    }

    type User {
        id: ID!
        email: String!
        username: String!
        fname: String!
        lname: String!
        posts: [Post]!
        likes: [Post]
        avatar: File
        following: [User]
        followers: [User]
        createdAt: String!
        updatedAt: String!
    }
`
