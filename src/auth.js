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
  try {
    const { id, name, authToken } = data
    const { first_name, last_name } = name
    const user = await User.create({
      fbUser: id,
      fname: first_name,
      lname: last_name,
      username: `${first_name}_${last_name}${Date.now()}`,
      password: authToken
    })
    
    return true
    // Successful authentication, redirect home.
  } catch (err) {
    throw new Error('something went wrong')
  }

}

export const facebookSignUpValidate = async (req, res) => {
  try {
    const user = await User.findOne({ fbId: req.id })
    req.session.userId = user.id
    return res.redirect('https://wisdomofdecrowd.com')
  } catch (err) {
    return res.status(404).send('<h1>Something went wonnngg</h1>')
  }
}
