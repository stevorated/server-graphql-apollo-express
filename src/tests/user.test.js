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
let res, otherUserId, mainUserId, mainUser
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

describe('testing user resolvers', () => {
  beforeAll(async () => {
    await User.deleteMany()
    await Notification.deleteMany()
    await LastNotification.deleteMany()
    await Post.deleteMany()
    await Comment.deleteMany()
    await Event.deleteMany()
    await File.deleteMany()
    // create other user to follow later and logout
    const otherUser = await instance.post('http://localhost:4001/api/graphql', {
      query: `
        mutation { 
          signUp (
            fname: "other",
            lname: "user",
            username: "otheruser",
            email: "other@sheker.test.com",
            password: "testTEST"
          ) {
            id
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
  })

  it('shouldnt be able to register user with short fname ', async () => {
    const register = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "s",
          lname: "garber",
          username: "shireltest",
          email: "mail@sheker.test.com",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = register.data

    expect(errors[0].message).toBe(
      `child \"First Name\" fails because [\"First Name\" length must be at least 2 characters long]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with NO short fname ', async () => {
    res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "",
          lname: "garber",
          username: "shireltest",
          email: "mail@sheker.test.com",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"First Name\" fails because [\"First Name\" is not allowed to be empty, \"First Name\" length must be at least 2 characters long]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user  with short lname ', async () => {
    const res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "g",
          username: "shireltest",
          email: "mail@sheker.test.com",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Last Name\" fails because [\"Last Name\" length must be at least 2 characters long]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with NO lname ', async () => {
    const res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "",
          username: "shireltest",
          email: "mail@sheker.test.com",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Last Name\" fails because [\"Last Name\" is not allowed to be empty, \"Last Name\" length must be at least 2 characters long]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with short or no username ', async () => {
    res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "garber",
          username: "s",
          email: "mail@sheker.test.com",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Username\" fails because [\"Username\" length must be at least 4 characters long]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with short username ', async () => {
    res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "garber",
          username: "s",
          email: "mail@sheker.test.com",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Username\" fails because [\"Username\" length must be at least 4 characters long]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with NO username ', async () => {
    const res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "garber",
          username: "",
          email: "mail@sheker.test.com",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Username\" fails because [\"Username\" is not allowed to be empty, \"Username\" length must be at least 4 characters long]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with invalid email ', async () => {
    res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "garber",
          username: "shireltest",
          email: "mail@sheker",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Email\" fails because [\"Email\" must be a valid email]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with NO email ', async () => {
    const res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "garber",
          username: "shireltest",
          email: "",
          password: "testTEST"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Email\" fails because [\"Email\" is not allowed to be empty, \"Email\" must be a valid email]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with invalid password ', async () => {
    res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "garber",
          username: "shireltest",
          email: "mail@sheker.com",
          password: "test"
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Password\" fails because [\"Password\" length must be at least 6 characters long, \"Password\" Between 6 and 30 characters, with at least one uppercase letter & one lowercase letter. (but that's not really enough. ]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  it('shouldnt be able to register user with NO password ', async () => {
    const res = await instance.post('http://localhost:4001/api/graphql', {
      query: `
      mutation { 
        signUp (
          fname: "shirel",
          lname: "garber",
          username: "shireltest",
          email: "mail@sheker.com",
          password: ""
        ) {
          id
        } 
      }
      `
    })
    const { errors } = res.data

    expect(errors[0].message).toBe(
      `child \"Password\" fails because [\"Password\" is not allowed to be empty, \"Password\" length must be at least 6 characters long, \"Password\" Between 6 and 30 characters, with at least one uppercase letter & one lowercase letter. (but that's not really enough. ]`
    )
    expect(errors[0].message).toMatchSnapshot()
  })

  describe('register user', () => {
    it('should register user when and then be authenticated ', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation { 
          signUp (
            fname: "shirel",
            lname: "garber",
            username: "shireltest",
            email: "mail@sheker.test.com",
            password: "testTEST"
          ) {
            id
            email
            fname
            lname
            username
            avatar {
              url
            }
            posts {
              id
            }
            following {
              id
            }
            followers {
              id
            }
            seen {
              id
            }
          } 
        }
        `
      })
      const { data } = res.data
      const { signUp } = data
      
      expect(signUp.fname).toBe('shirel')
      expect(signUp.lname).toBe('garber')
      expect(signUp.username).toBe('shireltest')
      expect(signUp.avatar).toBe(null)
      expect(signUp.posts).toStrictEqual([])
      expect(signUp.following).toStrictEqual([])
      expect(signUp.followers).toStrictEqual([])
      expect(signUp.seen).toStrictEqual([])
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          query {
            me {
              id
              email
              fname
              lname
              username
              avatar {
                url
              }
              posts {
                id
              }
              following {
                id
              }
              followers {
                id
              }
              seen {
                id
              }
            }
          }
        `
      })
  
      const { me } = res.data.data
      expect(me.fname).toBe('shirel')
      expect(me.lname).toBe('garber')
      expect(me.username).toBe('shireltest')
      expect(me.avatar).toBe(null)
      expect(me.posts).toStrictEqual([])
      expect(me.following).toStrictEqual([])
      expect(me.followers).toStrictEqual([])
      expect(me.seen).toStrictEqual([])
    })
  
    it('should return true when loggin out', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          mutation{
            signOut
          }
        `
      })
      const { data } = res
      expect(data).toBeTruthy()
    })

    it('should return error when not logged in', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          query {
            me {
              id
            }
          }
        `
      })
      const { data } = res
      expect(data.errors[0].message).toBe('You must be signed in.')
    })
  })
  describe('Login the user registered, make a follow mutation, update profile and logout', () => {
    it('should signIn user when and then be authenticated ', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
        mutation { 
          signIn (
            email: "mail@sheker.test.com",
            password: "testTEST"
          ) {
            id
            email
            fname
            lname
            username
            avatar {
              url
            }
            posts {
              id
            }
            following {
              id
            }
            followers {
              id
            }
            seen {
              id
            }
          } 
        }
        `
      })
      const { data } = res.data
      const { signIn } = data
      mainUserId = signIn.id
      expect(signIn.fname).toBe('shirel')
      expect(signIn.lname).toBe('garber')
      expect(signIn.username).toBe('shireltest')
      expect(signIn.avatar).toBe(null)
      expect(signIn.posts).toStrictEqual([])
      expect(signIn.following).toStrictEqual([])
      expect(signIn.followers).toStrictEqual([])
      expect(signIn.seen).toStrictEqual([])
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          query {
            me {
              id
              email
              fname
              lname
              username
              avatar {
                url
              }
              posts {
                id
              }
              following {
                id
              }
              followers {
                id
              }
              seen {
                id
              }
            }
          }
        `
      })
  
      const { me } = res.data.data
      expect(me.fname).toBe('shirel')
      expect(me.lname).toBe('garber')
      expect(me.username).toBe('shireltest')
      expect(me.avatar).toBe(null)
      expect(me.posts).toStrictEqual([])
      expect(me.following).toStrictEqual([])
      expect(me.followers).toStrictEqual([])
      expect(me.seen).toStrictEqual([])
    })
    it('should follow user', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          mutation{
            follow (id: "${otherUserId}") {
              id
              followers {
                id
              }
            }
          }
        `
      })
      expect(res.data.data.follow).toMatchObject({
        id: otherUserId,
        followers: [{
          id: mainUserId
        }]
      })

      mainUser = await User.findById(mainUserId)

      expect(mainUser.following[0].toString()).toBe(otherUserId)

      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          mutation{
            follow (id: "${otherUserId}") {
              id
              followers {
                id
              }
            }
          }
        `
      })
      expect(res.data.data.follow).toMatchObject({
        id: otherUserId,
        followers: []
      })

      mainUser = await User.findById(mainUserId)

      expect(mainUser.following[0]).toBeFalsy()
    })

    it('should update mainUsers details', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          mutation{
            updateMyProfile (fname: "new name", lname: "new name", username: "newusername") {
              fname
              lname
              username
            }
          }
        `
      })
      const { updateMyProfile } = res.data.data
      expect(updateMyProfile.fname).toBe('new name')
      expect(updateMyProfile.lname).toBe('new name')
      expect(updateMyProfile.username).toBe('newusername')
    })

    it('should return true when logging out', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          mutation{
            signOut
          }
        `
      })
      const { data } = res
      expect(data).toBeTruthy()
    })
    it('should return error when not logged in', async () => {
      res = await instance.post('http://localhost:4001/api/graphql', {
        query: `
          query {
            me {
              id
            }
          }
        `
      })
      const { data } = res
      expect(data.errors[0].message).toBe('You must be signed in.')
    })
  })
})
