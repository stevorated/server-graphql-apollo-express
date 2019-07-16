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

const {
  MY_DOMAIN,
  NODE_ENV,
  APP_PORT,
  SESSION_DB_COLLECTION,
  SESSION_NAME,
  SESSION_SECRET,
  SESSION_LIFE,
  ASSETS_DIR,
  CLIENT_ADDR
} = process.env

const IN_PROD = NODE_ENV === 'production'

console.log('Production: ', IN_PROD)

const app = express()
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
  // rolling: true,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(SESSION_LIFE),
    sameSite: false,
    secure: false // TODO: bring back IN_PROD
  }
}))

app.use('/api/images', protectedStatic)
const assetsDir = path.join(__dirname, '..', ASSETS_DIR)
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
