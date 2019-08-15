import { AuthenticationError } from 'apollo-server-express'
import { User, Session } from './models'

const { SESSION_NAME } = process.env
const message = 'Wrong Details. Try again'

export const attmeptSignIn = async (email, password) => {
  const user = await User.findOne({ email })
  if (!user) {
    throw new AuthenticationError(message)
  }
  const check = await user.passwordMatch(password)
  if (!check) {
    throw new AuthenticationError(message)
  }
  return user
}

export const checkPassword = async (id, password) => {
  const user = await User.findById(id)
  if (!user) {
    throw new AuthenticationError(message)
  }
  const check = await user.passwordMatch(password)
  if (!check) {
    throw new AuthenticationError(message)
  }
  return user
}

export const signedIn = req => {
  if (req.session.passport && req.session.passport.user.userId) return req.session.passport.user.userId
  // console.log(req.session.userId)
  return req.session.userId
}

export const ensureSignedIn = req => {
  if (!signedIn(req)) {
    throw new AuthenticationError('You must be signed in.')
  }
}

export const ensureSignedOut = req => {
  if (signedIn(req)) {
    throw new AuthenticationError('You are already signed in.')
  }
}

export const signOut = async (req, res) => {
  await Session.deleteOne({ 'session.userId': req.session.userId })
  return new Promise((resolve, reject) => {
    req.session.destroy(err => {
      if (err) reject(err)
      res.clearCookie(SESSION_NAME)
      resolve(true)
    })
  })
}

export const protectedStatic = (req, res, done) => {
  const session = req.session.passport ? req.session.passport.user : req.session
  const { userId } = session
  if (!userId) {
    res.status(403).send({ error: 'u must be logged in for that' })
  } else {
    done()
  }
}

export const handleFacebookUser = async (accessToken, refreshToken, profile, cb ) => {
  const { id, name, emails } = profile
  const { familyName, givenName } = name
  const email = emails[0].value
  const userExists = await User.findOne({ email })
  if (userExists) {
    const updatedUser = await User.findOneAndUpdate({ email }, { fbId: id }, { new: true })
    if (updatedUser) {
      cb(undefined, updatedUser)
    }
  }
  const loginFromFbBefore = await User.findOne({ fbId: id })
  if (!loginFromFbBefore) {
    const dbUser = await User.create({
      fbId: id,
      email,
      fname: givenName,
      lname: familyName,
      username: `${givenName}${familyName}${Date.now()}`,
      password: id
    })
    if (dbUser) {
      dbUser.token = accessToken
      cb(undefined, dbUser)
    }
  } else {
    loginFromFbBefore.token = accessToken
    cb(undefined, loginFromFbBefore)
  }
}
