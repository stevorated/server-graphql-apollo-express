import path from 'path'

import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import session from 'express-session'
import mongoDBStore from 'connect-mongodb-session'
import typeDefs from './typeDefs'
import resolvers from './resolvers'
import cookieParser from 'cookie-parser'
import { protectedStatic } from './auth'
import helmet from 'helmet'
import schemaDirectives from './directives'
import db, { mongoString } from './db'
import {
  APP_PORT,
  SESSION_NAME,
  SESSION_LIFE,
  SESSION_SECRET,
  SESSION_DB_COLLECTION,
  ASSETS_DIR
} from './config'
const IN_PROD = process.env.NODE_ENV === 'production'
console.log(IN_PROD)
const app = express()
app.use(cookieParser('sid'))
app.disable('x-powered-by')
const MongoSessionStore = mongoDBStore(session)
const store = new MongoSessionStore({
  uri: mongoString,
  collection: process.env.SESSION_DB_COLLECTION
})
store.on('error', function (error) {
  console.log(error)
})

app.use(session({
  store,
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  resave: true,
  httpOnly: IN_PROD,
  // rolling: true,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(SESSION_LIFE),
    sameSite: true,
    secure: IN_PROD // TODO: bring back IN_PROD
  }
}))
app.use('/images', protectedStatic)
const assetsDir = path.join(__dirname, '..', ASSETS_DIR)
app.use('/images', express.static(assetsDir))

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives,
  playground: { 
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
  origin: 'http://localhost:3000',
  credentials: true,
  sameSite: false
}

server.applyMiddleware({
  app,
  cors: corsOptions
})
app.use(helmet())
app.get('/', (req, res) => {
  res.status(200).send('Ya Alla')
})
app.listen({ port: APP_PORT || process.env.PORT }, async () => {
  await db()
  console.log(`🚀 Server ready at http://localhost:${APP_PORT || process.env.PORT}`)
}
)
