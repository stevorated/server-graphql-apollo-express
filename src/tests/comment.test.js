/* eslint-env jest */
import mongoose from 'mongoose'

import { mongoString } from '../db'
import {
  User,
  Notification,
  LastNotification,
  Post,
  Comment,
  Event,
  File
} from '../models'
let res, otherUserId, otherUser, mainUserId, mainUser, post, comment
const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')

axiosCookieJarSupport(axios)
const cookieJar = new tough.CookieJar()

const conn = async () => {
  return mongoose.connect(mongoString, { useNewUrlParser: true })
}
conn()

const instance = axios.create({
  withCredentials: true,
  jar: cookieJar
})

describe('testing comment resolvers', () => {
  beforeAll(async () => {
    await User.deleteMany()
    await Notification.deleteMany()
    await LastNotification.deleteMany()
    await Post.deleteMany()
    await Comment.deleteMany()
    await Event.deleteMany()
    await File.deleteMany()
    // create other user to follow later and logout

    otherUser = await instance.post('http://localhost:4001/api/graphql', {
      query: `
        mutation { 
          signUp (
            fname: "testik2",
            lname: "teston2",
            username: "testuser2",
            email: "testik2@teston.com",
            password: "testTEST"
          ) {
            id
            fname
            lname
          } 
        }
        `
    })
    otherUserId = otherUser.data.data.signUp.id
    await instance.post('http://localhost:4001/api/graphql', {
      query: `
        mutation{
          signOut
        }
      `
    })
    mainUser = await instance.post('http://localhost:4001/api/graphql', {
      query: `
        mutation { 
          signUp (
            fname: "testik",
            lname: "teston",
            username: "testuser",
            email: "testik@teston.com",
            password: "testTEST"
          ) {
            id
            fname
            lname
          } 
        }
        `
    })
    mainUserId = mainUser.data.data.signUp.id
  })

  afterAll(async () => {
    await instance.post('http://localhost:4001/api/graphql', {
      query: `
        mutation{
          signOut
        }
      `
    })
  })
  describe('create comment and delete it', () => {
    it('should create a post and set correct default values an add to comment array in post', async () => {
      post = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          createPost (body: "good post") {
            id
            body
            createdBy {
              id
              fname
              lname
            }
            likes {
              id
            }
            comments {
              id
              body
              createdBy {
                id
                fname
                lname
              }
            }
          }
        }
      `
      })
      const postId = post.data.data.createPost.id
      // console.log(post)
      comment = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          createComment (body: "good comment", post: "${postId}") {
            id
            body
            createdBy {
              id
              fname
              lname
            }
            post {
              id
              body
              createdBy {
                id
                fname
                lname
              }
              likes {
                id
              }
            }
          }
        }
      `
      })
      post = post.data.data.createPost
      mainUser = mainUser.data.data.signUp
      comment = comment.data.data.createComment
      // checking actually also the related action in other table
      // through querying the refrences from mongo
      const postDetails = await Post.findById(postId)
      expect(postDetails.comments[0].toString()).toBe(comment.id)
      expect(comment.body).toBe('good comment')
      expect(comment.createdBy.id).toBe(mainUserId)
      expect(comment.createdBy.fname).toBe(mainUser.fname)
      expect(comment.createdBy.lname).toBe(mainUser.lname)
      expect(comment.post.id).toBe(postId)
      expect(comment.post.body).toBe(post.body)
    })
    it('shouldnt create a comment with invalid postId', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          createComment (body: "good comment", post: "dd") {
            id
            body
            createdBy {
              id
              fname
              lname
            }
            post {
              id
              body
              createdBy {
                id
                fname
                lname
              }
              likes {
                id
              }
            }
          }
        }
      `
      })
      res = res.data.errors[0]
      const { message, extensions } = res
      expect(message).toBe('Hey it\'s not a valid post')
      // console.log(details[0])
      expect(extensions.code).toBe('BAD_USER_INPUT')
    })
    it('shouldnt create a comment with invalid postId', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          createComment (body: "good comment", post: "5d500e4183ad6044f4f02ac7") {
            id
            body
            createdBy {
              id
              fname
              lname
            }
            post {
              id
              body
              createdBy {
                id
                fname
                lname
              }
              likes {
                id
              }
            }
          }
        }
      `
      })
      res = res.data.errors[0]
      const { message, extensions } = res
      expect(message).toBe('Hey it\'s not a valid post')
      // console.log(details[0])
      expect(extensions.code).toBe('BAD_USER_INPUT')
    })
  })
})
