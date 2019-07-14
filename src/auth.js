import { AuthenticationError } from 'apollo-server-express'
import { User } from './models'
import { SESSION_NAME } from './config'

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

export const signedIn = req => {
  console.log(req.headers.cookie.userId)
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

export const signOut = (req, res) => new Promise((resolve, reject) => {
  req.session.destroy(err => {
    if (err) reject(err)
    res.clearCookie(SESSION_NAME)
    resolve(true)
  })
})

export const protectedStatic = (req, res, done) => {
  if (!req.session.userId) {
    res.status(403).send({ error: 'u must be logged in for that' })
  } else {
    done()
  }
}
