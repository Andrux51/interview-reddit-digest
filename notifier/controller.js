const fetch = require('node-fetch')
const Promise = require('bluebird')
const sgMail = require('@sendgrid/mail')
const moment = require('moment')
const pug = require('pug')

const { app } = require('../server')

fetch.Promise = Promise

// remove timezone offset then get to 08:00
const sendTime = moment().utc().startOf('day').set('hour', 8)

const buildEmailMessage = (toEmail) => ({
  to: toEmail,
  from: 'andymartin51@gmail.com',
  subject: app.locals.title,
  html: pug.renderFile(`${__dirname}/../views/index.pug`, app.locals.uiData),
  sendAt: sendTime.unix()
})

// need to process these calls synchronously - use a generator
Promise.coroutine(function* () {
  // reddit api access token request
  yield fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic YWU0cGJvMDVUaEtVaEE6eHFmMTdnS1pyT2NsNGZuWGVBbV9ncDJNVFlB` },
    body: new URLSearchParams({ 'grant_type': 'client_credentials' })
  }).call('json').then(jsonData => app.locals.redditToken = `${jsonData.token_type} ${jsonData.access_token}`)

  // console.log(app.locals.redditToken)

  let redditPosts = []
  let dbUsers = []

  // get user info from mongo db
  yield fetch(`${app.locals.apiConfig.protocol}://${app.locals.apiConfig.domain}:${app.locals.apiConfig.port}/users`)
    .call('json').then(jsonData => dbUsers = jsonData)

  console.log(dbUsers)

  for (const user of dbUsers) {
    // for each of the current user's favorite subreddits, get the top 3 posts for today
    const subredditPromises = user.favoriteSubs.map(sub => {
      return fetch(`https://oauth.reddit.com/r/${sub}/top?limit=3&t=day`, {
        headers: {
          Authorization: app.locals.redditToken,
          'User-Agent': 'hearcom-interview/0.1 by andrauthor',
        }
      }).call('json').then(jsonData => redditPosts = [...redditPosts, ...jsonData.data.children])
    })
    yield Promise.each(subredditPromises, () => { })

    // console.log(redditPosts)

    // send relevant data to the front end for display (and for email html template)
    app.locals.uiData.redditPosts = redditPosts.map(child => {
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
    if (user.newsletterEnabled) {
      sgMail.send(buildEmailMessage(user.email))
      console.log('email scheduled to send to', user.email)
    }
  }
})().catch(err => console.log(err))
