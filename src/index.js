import path from 'path'
import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import mongoDBStore from 'connect-mongodb-session'
import helmet from 'helmet'
import typeDefs from './typeDefs'
import resolvers from './resolvers'
import { protectedStatic } from './auth'
import schemaDirectives from './directives'
import db, { mongoString } from './db'
import passport from 'passport'
import FacebookStrategy from 'passport-facebook'
const {
  MY_DOMAIN,
  NODE_ENV,
  APP_PORT,
  SESSION_DB_COLLECTION,
  SESSION_NAME,
  SESSION_SECRET,
  SESSION_LIFE,
  ASSETS_DIR,
  CLIENT_ADDR,
  APP_ID,
  APP_SECRET,
  MY_PUBLIC_DOMAIN,
  FB_LOGIN_PATH,
  FB_LOGIN_CB_PATH,
  FB_LOGIN_FAIL_PATH
} = process.env

const IN_PROD = NODE_ENV === 'production'
console.log('Production: ', IN_PROD)
const assetsDir = path.join(__dirname, '..', ASSETS_DIR)

const app = express()
// ================================================ FB LOGIN ==============================
console.log(APP_ID, APP_SECRET, 'dsfdsf')
passport.use(new FacebookStrategy({
  clientID: APP_ID,
  clientSecret: APP_SECRET,
  callbackURL: `${MY_PUBLIC_DOMAIN}${FB_LOGIN_CB_PATH}`,
  profileFields: ['id', 'name', 'email']
},
function (accessToken, refreshToken, profile, cb) {
  console.log(accessToken)
  console.log(refreshToken)
  // console.log(profile.id)
  // console.log(profile.name)
  // console.log(profile)
  cb(undefined, profile)
}))
app.use(passport.initialize())
passport.serializeUser(function (user, done) {
  done(null, user)
})
app.get(FB_LOGIN_PATH,
  passport.authenticate('facebook'))
app.get(FB_LOGIN_CB_PATH,
  passport.authenticate('facebook', { failureRedirect: FB_LOGIN_FAIL_PATH }),
  function (req, res) {
    // console.log(res)
    // Successful authentication, redirect home.
    res.send('auth GOOD!')
  })
// ==================================== END FB LOGIN =====================================
app.use(cookieParser(SESSION_NAME))
app.disable('x-powered-by')
const MongoSessionStore = mongoDBStore(session)
const store = new MongoSessionStore({
  uri: mongoString,
  collection: SESSION_DB_COLLECTION
})
store.on('error', function (error) {
  console.log(error)
})
app.set('trust proxy', 1)

app.use(session({
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
    secure: false // TODO: bring back IN_PROD
  }
}))

app.use('/api/images', protectedStatic)
app.use('/api/images', express.static(assetsDir))

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
    }, // TODO: remember to block playground in prod
  uploads: {
    maxFieldSize: 2000000,
    maxFiles: 10
  },
  context: ({ req, res }) => ({ req, res })
})

const corsOptions = {
  origin: [CLIENT_ADDR],
  credentials: true
  // sameSite: false
}

server.applyMiddleware({
  app,
  path: '/api/graphql',
  cors: corsOptions
})

app.use(helmet())
app.get('/api', (req, res) => {
  res.status(200).send('Ya Alla!!!!!!')
})

app.listen({ port: APP_PORT }, async () => {
  await db()
  console.log(`🚀 Server ready at ${MY_DOMAIN}:${APP_PORT}${server.graphqlPath}`)
}
)

