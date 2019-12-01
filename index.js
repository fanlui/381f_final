const express = require('express')
const Router = express.Router
const session = require('express-session')
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

const dbuser = 'admin'
const dbpsw = 'admin'
const dburi = `mongodb://${dbuser}:${encodeURIComponent(dbpsw)}@cluster0-shard-00-00-x6omz.mongodb.net:27017,cluster0-shard-00-01-x6omz.mongodb.net:27017,cluster0-shard-00-02-x6omz.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority`
// const dburi = `mongodb://localhost:27017`
const client = new MongoClient(dburi, { useUnifiedTopology: true, useNewUrlParser: true })

const PORT = process.env.PORT || 5000

const app = express()
const router = new Router()


app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: 'test',
  resave: false,
  saveUninitialized: true
}))


app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
require('./routes/user')(router)
require('./routes/home')(router)


require('./api/resaurant')(router)

app.use(router)

console.log('db connecting...')
client.connect((err, client) => {
  if (err) {
    console.error(err)
    return
  }
  console.log('db connect success.')
  app.locals.db = client.db('test')
  app.listen(PORT, () => console.log(`Listening on ${PORT}.`))
})
