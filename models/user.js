const mongoose = require('mongoose')
const Schema = mongoose.Schema

// create a schema for events
const userSchema = new Schema({
  name: String,
  phone: Number,
  reservations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',                            
    required: true
}]
})

// First create a model using eventSchema
let User = mongoose.model('User', userSchema)

module.exports = User;