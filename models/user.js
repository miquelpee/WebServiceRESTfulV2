const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create a schema for user. Customer has reservations so we are referring to it.
const userSchema = new Schema({
  name: String,
  phone: String,
  reservations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',                            
    required: true
  }]
})

// First create a model using userSchema
let User = mongoose.model('User', userSchema)

module.exports = User;