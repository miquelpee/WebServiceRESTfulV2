const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for reservations. User has reservations so we are referring to it.
const reservationSchema = new Schema({
    carmodel: String,
    service: String,
    duration: String,
    start: Date,
    end: Date
  })

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;