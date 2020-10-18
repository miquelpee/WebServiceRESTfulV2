const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const reservations = require('./routes/reservations.js') // Routes is defined in here

const app = express() 

//mongoose connection
mongoose.connect('mongodb://localhost/carservicesV2', { 
 	useNewUrlParser: true,
 	useUnifiedTopology: true 
 }
)

app.use(bodyParser.json()) // to support JSON-encoded bodies

app.get('/reservations', reservations.get_reservations);
app.post('/reservation', reservations.post_reservation);
app.put('/reservation/:id', reservations.put_reservation);
app.patch('/reservation/:id', reservations.patch_reservation);
app.delete('/reservation/:id', reservations.delete_reservation);

module.exports = app