const express = require('express')
const mongoose = require('mongoose')
const userSchema = require('./schema')

const userRouter = express.Router()
const User = mongoose.model('User', userSchema)

/*
 * Sample POST body for user creation:
{
 "name": "Amogh Meshram",
 "email": "amogh@mesh.ram",
 "favoriteSubs": ["mypeopleneedme", "prequelmemes", "modelmakers"]
}
*/

userRouter.route('/users')
  .get((req, res) => {
    // allow filtering by email
    if (req.query.email) {
      return User.where({ email: req.query.email }).findOne((err, user) => {
        if (user) {
          return res.status(200).send(user)
        }
        return res.status(404).send({msg: 'Email address not found'})
      })
    }

    return User.find((err, users) => res.status(200).send(users))
  })
  .post(async (req, res) => {
    // guard against re-creating the same user
    if (await User.exists({ email: req.body.email })) {
      return res.status(400).send('User must be unique based on email address')
    }

    const user = new User(req.body)
    user.save()

    res.status(201).send(user)
  })
  .put((req, res) => {
    // find by email or id from body
    User.where().or([{ email: req.body.email }, { _id: req.body._id }]).findOne((err, user) => {
      if (!user) {
        return res.status(404).send('Email address or id not found')
      }

      user.setValues(req.body)
      user.save()

      res.status(202).send('User updated')
    })
  })

userRouter.route('/users/:id')
  .all((req, res, next) => {
    User.findById(req.params.id, (err, user) => {
      if (!user) {
        return res.status(404).send('User not found')
      }
      res.locals.user = user
      next()
    })
  })
  .get((req, res) => res.status(200).send(res.locals.user))
  .put((req, res) => {
    res.locals.user.setValues(req.body)
    res.locals.user.save()
    
    res.status(202).send(res.locals.user)
  })

module.exports = userRouter
