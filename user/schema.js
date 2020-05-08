const { Schema } = require('mongoose')

const userSchema = new Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
  favoriteSubs: [String],
  // opt out if you dare!
  newsletterEnabled: { type: Boolean, default: true },
})

// avoid arrow function declaration to allow usage of `this`
userSchema.methods.setValues = function (body) {
  // if any of these fields have changed, update them!
  const keys = Object.keys(body)

  this.favoriteSubs = body.favoriteSubs || this.favoriteSubs
  this.name = body.name || this.name
  this.email = body.email || this.email
  this.modifiedAt = Date.now()

  // booleans are sometimes hilarious
  this.newsletterEnabled = keys.includes('newsletterEnabled') ? body.newsletterEnabled : this.newsletterEnabled
}

module.exports = userSchema
