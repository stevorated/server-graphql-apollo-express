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
let res, otherUserId, otherUser, mainUserId, mainUser, event
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

describe('testing event resolvers', () => {
  beforeAll(async () => {
    // await User.deleteMany()
    // await Notification.deleteMany()
    // await LastNotification.deleteMany()
    // await Post.deleteMany()
    // await Comment.deleteMany()
    // await Event.deleteMany()
    // await File.deleteMany()
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
    console.log(otherUserId)
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
    console.log(mainUserId)
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
  describe('create an event, like and unlike and then delete', () => {
    it('should create an event + mongo refs', () => {

    })
    it('should like and unlike the event', () => {

    })
    it('should delete event', () => {

    })
  })
})
