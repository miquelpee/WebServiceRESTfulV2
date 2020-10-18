const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    carmodel: String,
    service: String,
    duration: String,
    start: Date,
    end: Date
  })

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;