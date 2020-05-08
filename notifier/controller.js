const fetch = require('node-fetch')
const Promise = require('bluebird')
const sgMail = require('@sendgrid/mail')
const moment = require('moment')
const pug = require('pug')

const { app } = require('../server')

fetch.Promise = Promise

// remove timezone offset then get to 08:00
const sendTime = moment().utc().startOf('day').set('hour', 8)

// a function so variable values can be populated after promises are resolved
const buildEmailMessage = () => ({
  to: app.locals.currentUser.email,
  from: 'andymartin51@gmail.com',
  subject: app.locals.title,
  html: pug.renderFile(`${__dirname}/../views/index.pug`, app.locals.uiData),
  sendAt: sendTime.unix()
})

// need to process these calls synchronously - use a generator
// todo: further break these out into separate coroutine calls?
Promise.coroutine(function* () {
  app.locals.redditPosts = []

  // reddit api access token request
  yield fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic YWU0cGJvMDVUaEtVaEE6eHFmMTdnS1pyT2NsNGZuWGVBbV9ncDJNVFlB` },
    body: new URLSearchParams({ 'grant_type': 'client_credentials' })
  }).call('json').then(jsonData => app.locals.redditToken = `${jsonData.token_type} ${jsonData.access_token}`)

  // console.log(app.locals.redditToken)

  // get user info from mongo db
  yield fetch(`${app.locals.apiConfig.protocol}://${app.locals.apiConfig.domain}:${app.locals.apiConfig.port}/users?email=${app.locals.currentUserEmail}`)
    .call('json').then(jsonData => app.locals.currentUser = jsonData)

  // console.log(app.locals.currentUser)

  // guard against invalid user before continuing
  if (app.locals.currentUser.msg) throw (new Error('invalid user, check app.locals.currentUserEmail\n'))

  // for each of the current user's favorite subreddits, get the top 3 posts for today
  const subredditPromises = app.locals.currentUser.favoriteSubs.map(sub => {
    return fetch(`https://oauth.reddit.com/r/${sub}/top?limit=3&t=day`, {
      headers: {
        Authorization: app.locals.redditToken,
        'User-Agent': 'hearcom-interview/0.1 by andrauthor',
      }
    }).call('json').then(jsonData => app.locals.redditPosts = [...app.locals.redditPosts, ...jsonData.data.children])
  })
  yield Promise.each(subredditPromises, () => { })

  // console.log(app.locals.redditPosts)

  // send relevant data to the front end for display (and for email html template)
  app.locals.uiData.redditPosts = app.locals.redditPosts.map(child => {
    const { data } = child
    const { subreddit, title, permalink,
      subreddit_name_prefixed, score, thumbnail, created_utc,
      num_comments, url } = data
    return {
      subreddit, title, permalink,
      subreddit_name_prefixed, score, thumbnail, created_utc,
      num_comments, url
    }
  })

  // console.log(app.locals.uiData)

  // send email to current user
  sgMail.setApiKey(app.locals.emailApiKey)
  sgMail.send(buildEmailMessage())
})().catch(err => console.log(err))
