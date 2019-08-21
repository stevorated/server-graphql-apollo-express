import path from 'path'
import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import mongoDBStore from 'connect-mongodb-session'
import helmet from 'helmet'
import typeDefs from './typeDefs'
import resolvers from './resolvers'
import { protectedStatic, handleFacebookUser } from './auth'
import schemaDirectives from './directives'
import db, { mongoString } from './db'
import passport from 'passport'
import FacebookStrategy from 'passport-facebook'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import xssFilter from 'x-xss-protection'
import { User } from './models'
const {
  NODE_ENV,
  APP_PORT,
  SESSION_DB_COLLECTION,
  SESSION_NAME,
  SESSION_SECRET,
  SESSION_LIFE,
  ASSETS_DIR,
  PUBLIC_ASSETS_DIR,
  CLIENT_ADDR,
  APP_ID,
  APP_SECRET,
  MY_PUBLIC_DOMAIN,
  FB_LOGIN_PATH,
  FB_LOGIN_CB_PATH,
  FB_LOGIN_FAIL_PATH,
  FB_SUCCESS_URL,
  RESET_TOKEN_SECRET,
  CONFIRM_MAIL_TOKEN_SECRET
} = process.env

const IN_PROD = NODE_ENV === 'production'
console.log('Production: ', IN_PROD)

const assetsDir = path.join(__dirname, '..', ASSETS_DIR)
const publicAssetsDir = path.join(__dirname, '..', PUBLIC_ASSETS_DIR)

const app = express()

app.use(cookieParser(SESSION_NAME))
app.disable('x-powered-by')
app.use(function(req, res, next) {
  res.removeHeader('X-Powered-By')
  next()
})
app.use(helmet())
app.use(helmet.noSniff())
const sixtyDaysInSeconds = 5184000
app.use(
  helmet.hsts({
    maxAge: sixtyDaysInSeconds
  })
)
app.use(helmet.hidePoweredBy())
app.use(xssFilter({ setOnOldIE: true }))
app.use(helmet.frameguard({ action: 'sameorigin' }))

const MongoSessionStore = mongoDBStore(session)
const store = new MongoSessionStore({
  uri: mongoString,
  collection: SESSION_DB_COLLECTION,
  clearInterval: 60
})
store.on('error', function(error) {
  console.log(error)
})
app.set('trust proxy', 1)

app.use(
  session({
    store,
    name: SESSION_NAME,
    secret: SESSION_SECRET,
    resave: true,
    httpOnly: IN_PROD,
    rolling: true,
    saveUninitialized: false,
    cookie: {
      maxAge: parseInt(SESSION_LIFE),
      sameSite: true,
      secure: IN_PROD // TODO: bring back IN_PROD
    }
  })
)

app.use('/api/images', protectedStatic)
app.use('/api/images', express.static(assetsDir))
app.use('/api/public_images', express.static(publicAssetsDir))

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives,
  playground: IN_PROD
    ? false
    : {
      settings: {
        'request.credentials': 'same-origin'
      }
    },
  uploads: {
    maxFieldSize: 10000000,
    maxFileSize: 10000000,
    maxFiles: 10
  },
  context: ({ req, res }) => ({ req, res })
})

const corsOptions = {
  origin: [CLIENT_ADDR],
  methods: ['GET', 'POST'],
  credentials: true
  // sameSite: false
}

server.applyMiddleware({
  app,
  path: '/api/graphql',
  cors: corsOptions
})

// ================================================ FB LOGIN ==============================

passport.use(
  new FacebookStrategy(
    {
      clientID: APP_ID,
      clientSecret: APP_SECRET,
      callbackURL: `${MY_PUBLIC_DOMAIN}${FB_LOGIN_CB_PATH}`,
      profileFields: ['id', 'name', 'email']
    },
    async (accessToken, refreshToken, profile, cb) =>
      handleFacebookUser(accessToken, refreshToken, profile, cb)
  )
)

app.use(passport.initialize())

app.get(FB_LOGIN_PATH, passport.authenticate('facebook', { scope: ['email'] }), () => {
  passport.serializeUser(async (user, done) => {
    const { _id, fname, lname, email, token } = user
    done(null, {
      // id,
      userId: _id,
      fname,
      lname,
      email,
      token
    })
  })
})

app.get(
  FB_LOGIN_CB_PATH,
  passport.authenticate('facebook', {
    failureRedirect: FB_LOGIN_FAIL_PATH,
    successRedirect: FB_SUCCESS_URL
  })
)

app.get(FB_LOGIN_FAIL_PATH, (req, res) => {
  return res.redirect(MY_PUBLIC_DOMAIN)
})

// ==================================== END FB LOGIN ===================================== //

app.get('/api/confirm_mail/:token', async (req, res) => {
  try {
    const tokenDecoded = jwt.verify(req.params.token, CONFIRM_MAIL_TOKEN_SECRET)
    await User.updateOne(
      { _id: mongoose.Types.ObjectId(tokenDecoded.id) },
      { email_confirmed: true }
    )
    return res.status(200).redirect(`${process.env.CLIENT_ADDR}`)
  } catch (error) {
    return res.status(404).send({ error: error.message })
  }
})

app.get('/api/reset_password_start/:token', async (req, res) => {
  try {
    const tokenDecoded = jwt.verify(req.params.token, RESET_TOKEN_SECRET)
    const user = await User.findById(tokenDecoded.id)
    if (user.reset_password_token !== req.params.token) {
      return res.redirect(`${MY_PUBLIC_DOMAIN}/somethingwentwrong`)
    }
    await User.updateOne({ _id: tokenDecoded.id }, { verifiedResetToken: true })
    return res
      .status(200)
      .redirect(`${CLIENT_ADDR}/reset_pass_callback/${req.params.token}`)
  } catch (error) {
    return res.redirect(`${CLIENT_ADDR}/somethingwentwrong`)
  }
})

app.get('*', (req, res) => {
  return res.redirect(CLIENT_ADDR)
})

app.listen({ port: APP_PORT }, async () => {
  await db()
  console.log(`🚀 Server ready at ${MY_PUBLIC_DOMAIN}${server.graphqlPath}`)
})

// ,
//   (req, res) => {
//     // Successful authentication, redirect home.
//     // return res.redirect(FB_SUCCESS_URL)
//   }
