import { AuthenticationError } from 'apollo-server-express'
import { User } from './models'

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

export const signedIn = req => {
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

export const facebookSignUp = async (data) => {
  console.log(data)
  const { id, name, emails } = data
  const { familyName, givenName } = name
  const user = await User.create({
    fbId: id,
    email: emails[0].value,
    fname: givenName,
    lname: familyName,
    username: `${givenName}${familyName}${Date.now()}`,
    password: id
  })
  console.log(user)
  return true
  // Successful authentication, redirect home.
}

export const facebookSignUpValidate = async (req, res) => {
  try {
    const user = await User.find({ fbId: req.id })
    // console.log(req.user)
    req.session.userId = user.id
    res.cookie('sid', user.id, { signed: true, httpOnly: true })
    // return res.redirect('https://wisdomofdecrowd.com')
  } catch (err) {
    return res.status(404).send('<h1>Something went wonnngg</h1>')
  }
}
