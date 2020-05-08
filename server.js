const express = require('express')
const mongoose = require('mongoose')

const app = exports.app = express()

// set some config and defaults
app.locals.apiConfig = {
  protocol: 'http',
  domain: 'localhost',
  port: 80
}
app.locals.dbConfig = {
  domain: 'localhost',
  port: 27017
}
app.locals.title = `World's Okayest Reddit Daily Digest`

// EMAIL OF A MEMBER OF THE USERS DB COLLECTION
app.locals.currentUserEmail = 'amogh@mesh.ram'
app.locals.emailApiKey = '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'
app.locals.uiData = {
  title: app.locals.title
}

// connect to db for user CRUD operations
mongoose.connect(`mongodb://${app.locals.dbConfig.domain}:${app.locals.dbConfig.port}`, {
  dbName: 'hearcom-reddit',
  useNewUrlParser: true,
  useUnifiedTopology: true
})
mongoose.connection.once('open', () =>
  console.log(`connected to db at mongodb://${app.locals.dbConfig.domain}:${app.locals.dbConfig.port}`))

app.use(express.json())
app.set('view engine', 'pug')

require('./notifier/controller')

app.use(require('./user/route'))

// basic route for client UI
app.get('/', (req, res) => {
  res.render(`index`, app.locals.uiData)
})

// return 404 for unspecified routes
app.use((req, res) => res.status(404).send(`Nothing found at ${req.path}`))

// start the ol' express app
app.listen(app.locals.apiConfig.port, () =>
  console.log(`server available at ${app.locals.apiConfig.protocol}://${app.locals.apiConfig.domain}:${app.locals.apiConfig.port}`))
