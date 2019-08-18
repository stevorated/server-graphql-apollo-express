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
let res, otherUserId, otherUser, mainUserId, mainUser, post
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

describe('testing post resolvers', () => {
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
  describe('check post validation', () => {
    it('should not allow to create empty post', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          createPost (body: "") {
            id
          }
        }
      `
      })
      const { details, name, _object } = res.data.errors[0].extensions.exception
      // console.log((details, name, _object))
      expect(details[0].path[0]).toBe('body')
      expect(details[1].path[0]).toBe('body')
      expect(details[0].message).toBe('"Post Body" is not allowed to be empty')
      expect(details[1].message).toBe(
        '"Post Body" length must be at least 2 characters long'
      )
    })
  })
  it('should not allow to create short post', async () => {
    res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation{
        createPost (body: "2") {
          id
        }
      }
    `
    })
    const { details } = res.data.errors[0].extensions.exception
    expect(details[0].path[0]).toBe('body')
    expect(details[0].message).toBe(
      '"Post Body" length must be at least 2 characters long'
    )
  })
  describe('create post update it like and unlike and then delete', () => {
    it('should create a post and set correct default values', async () => {
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
      const userData = mainUser.data.data.signUp
      const { createPost } = post.data.data
      post = createPost
      expect(createPost.body).toBe('good post')
      expect(createPost.createdBy.id).toBe(mainUserId)
      expect(createPost.createdBy.fname).toBe(userData.fname)
      expect(createPost.createdBy.lname).toBe(userData.lname)
      expect(createPost.likes.length).toBe(0)
      expect(createPost.comments.length).toBe(0)
    })
    it('should like a post and then unlike it', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          likePost (id: "${post.id}") {
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
      // const userData = mainUser.data.data.signUp
      const { likePost } = res.data.data
      expect(likePost.likes.length).toBe(1)
      expect(likePost.likes[0].id).toBe(mainUserId)
      expect(likePost.comments.length).toBe(0)
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          likePost (id: "${post.id}") {
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
      // const userData = mainUser.data.data.signUp
      const postAfterUnlike = res.data.data.likePost
      expect(postAfterUnlike.likes.length).toBe(0)
      expect(postAfterUnlike.likes[0]).toBeFalsy()
      expect(postAfterUnlike.comments.length).toBe(0)
    })
    it('should like a post', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          updatePost (postId: "${post.id}", body: "updated post") {
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
      const postAfterUpdate = res.data.data.updatePost
      expect(postAfterUpdate.body).toBe('updated post')
    })
    it('should delete post', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation{
          deletePost (post: "${post.id}")
        }
      `
      })
      const dataAfterDelete = res.data.data.deletePost
      expect(dataAfterDelete).toBeTruthy()
      const posts = await Post.find()
      expect(posts.length).toBe(0)
    })
  })
})
