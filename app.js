// REST API implementation for saving car service reservations
// API is using local Mongo database with mongoose to query and save data

const app = require('./CarServiceReservations') //Require our app

const server = app.listen(process.env.PORT || 9111, () => {
  console.log('Express server listening on port ' + server.address().port)
})