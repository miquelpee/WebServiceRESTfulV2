const Reservation = require('../models/reservation')
const User = require('../models/user')

// Create a new reservation
const post_reservation = (req, res) => {
  console.log("---> POST reservation. <---");
  
  //Checking that request has data we expect.
  if (!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('carmodel') || !req.body.hasOwnProperty('service') || !req.body.hasOwnProperty('duration') || !req.body.hasOwnProperty('start')) {
      return res.status(400).json({ message: "Error 400 in POST: Either name, carmodel, service type, duration or start time is missing."})
  }

  const userName = req.body.name;

  //Trying to handle duration, start and end time.
  let endDate = new Date(req.body.start);
  let hm = req.body.duration.split(":");
  let millisecs;
  if (req.body.duration.match(/[a-zA-Z]/i)){
    console.log("Duration is in wrong format. Expecting hh:mm");
    return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
  } else if (hm.length > 2) {
    console.log("Duration is in wrong format. Expecting hh:mm");
    return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
  } else if (hm.length == 2 && hm[1] >= 60) {
    console.log("Duration is wrong format. Expecting hh:mm");
    return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
  } else if (hm.length == 1) {
      millisecs = (hm[0] * 3600 * 1000);
  } else millisecs = (hm[0]*3600+hm[1]*60) * 1000; 
  endDate = endDate.getTime() + millisecs;  

  const newReservation = new Reservation({
      carmodel: req.body.carmodel,
      service: req.body.service,
      duration: req.body.duration,
      start: req.body.start,
      end: endDate
  })

  Reservation.find({}, function (err, reservations) { //Getting all the reservations to check double bookings.
    let found = true;
    if (reservations.length > 0) {
    for (var i = 0; i < reservations.length; i++) { //Looping through all reservations to see that there's no double booking.
      console.log(reservations[i].start + " vs " + new Date(newReservation.start));
      console.log(reservations[i].end + " vs " + new Date(newReservation.end));
        if ((new Date(newReservation.start) <= reservations[i].start && new Date(newReservation.end) > reservations[i].start && new Date(newReservation.end) < reservations[i].end) ||
        (new Date(newReservation.start) >= reservations[i].start && new Date(newReservation.start) < reservations[i].end) || 
        (new Date(newReservation.start) <= reservations[i].start && new Date(newReservation.end) >= reservations[i].end)) { //Found double booking and returning response.
          console.log("Double booking found!");
          return res.status(400).json({ message: "Double booking found!"});
        } else {
          found = false;
        }
      } 
    } 
    
    if (reservations.length == 0 || found == false) { //There was no double booking so we can save the reservation (and user if it doesn't exist).

      User.findOne({ //Checking is customer already exist.
        name: userName
      }).then((user) => { 
        if(user) { //Customer already found.     
            console.log('User already found. Adding new reservation for the user.');            
          
            newReservation.save().then(() => { //Saving reservation for the customer.
                user.reservations.push(newReservation);
            
                user.save().then(() => {
                    console.log("Reservation added for customer " + userName + ". Reservation: " +  newReservation);
                    return res.status(201).json({ message: "Reservation added for customer " + userName + ". Reservation: " +  newReservation})
            });
        });            
        } else { //Customer didn't found. 
            console.log('User not found. Adding new user and reservation.');
            
            const newUser = new User({
                name: req.body.name,
                phone: req.body.number,
                reservations: []
              })

              newUser.save().then(() => { //Creating customer.
                newReservation.save().then(() => {
                    newUser.reservations.push(newReservation); //Saving reservation for him.                
                      newUser.save().then(() => {
                        console.log("Reservation added for new customer " + userName + ". Reservation: " +  newReservation);
                        return res.status(201).json({ message: "Reservation added for new customer " + userName + ". Reservation: " +  newReservation}) 
                      });
                });
              })
          }
      });
    }
  })
}

// Get reservation(s)
const get_reservations = (req, res) => {
    console.log("---> GET reservation(s). <---")
  
    if (req.query.search_criteria != undefined) { //Check if GET has search criteria (=name), in case it has then checking does this customer has reservations.
      User.findOne({name: req.query.search_criteria}).populate('reservations').exec((err, reservations) => {
        if(err) {
          console.log("Error 400 in GET: " + err);
          res.status(400).json("Error 400 in GET: " + err);        
        } else if (req.query.search_criteria == "") {
          console.log("No search criteria given.");
          res.status(400).json("No search criteria given. Try e.g. search_criteria=Teppo");
        } else if (reservations == null) {
          console.log(req.query.search_criteria + " has no reservations");
          res.status(200).json(req.query.search_criteria + " has no reservations");
        } else {
        console.log(req.query.search_criteria + " reservations are " + reservations);
        res.status(200).json(reservations);
        }
      }) 
    }
    else { //There was no search criteria, returning all reservations.
      User.find().populate('reservations').exec((err, reservations) => {
        if(err) {
          console.log("Error 400 in GET: " + err);
          res.status(400).json("Error 400 in GET: " + err);
        }
        else if (reservations.length == 0) {
          console.log("Database is empty. No reservations found.");
          res.status(200).json("Database is empty. No reservations found.");
        }
        else {
        console.log("All reservations are " + reservations);
        res.status(200).json(reservations);}
      })       
  }
}

const delete_reservation = (req, res) => {
  console.log("---> DELETE reservation. <---");

  User.findOneAndUpdate(
    {  reservations: req.params.id   },
    { $pull: { reservations: req.params.id  } },
    { new: true }, function (err, result) { //Removing first reservation from the customer.
    if(err){
      console.log("Delete failed for id " + req.params.id + ". Reason: " + err.message);
      res.status(400).json({message : "Error 400 in DELETE: " + err.message});
    } else if (result == null) { //Reservation was not found.
      console.log("Delete failed for id " + req.params.id + ". Reason: reservation " + req.params.id + " doesn't exist.");
      res.status(400).json({message : "Error 400: reservation id " + req.params.id + " doesn't exist."});
    } else {
      Reservation.findOneAndDelete({_id: req.params.id}, (err, result) => { //Reservation was deleted from customer so removing it from reservations as well.
      if (err) {
        console.log("Delete failed for id " + req.params.id + ". Reason: " + err.message);
        res.status(400).json({message : "Error 400 in DELETE: " + err.message});
      } else {
        console.log("Reservation id " + req.params.id + " deleted!\n" + result);
        res.status(200).json({message : "Reservation id "+ req.params.id + " deleleted!"});
      }
      })
    }
  })  
}

//Updating complete reservation.
const put_reservation = (req, res) => {
  console.log("---> PUT reservation. <---");

  //Checking that request has data we expect.
  if (!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('carmodel') || !req.body.hasOwnProperty('service') || !req.body.hasOwnProperty('duration') || !req.body.hasOwnProperty('start')) {
    return res.status(400).json({ message: "Error 400 in PUT: Either name, carmodel, service type, duration or start time is missing."})
  }

  const userName = req.body.name;

  //Trying to handle duration, start and end time.
  let endDate = new Date(req.body.start);
  let hm = req.body.duration.split(":");
  let millisecs;
  if (req.body.duration.match(/[a-zA-Z]/i)){
    console.log("Duration is in wrong format. Expecting hh:mm");
    return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
  } else if (hm.length > 2) {
    console.log("Duration is in wrong format. Expecting hh:mm");
    return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
  } else if (hm.length == 2 && hm[1] >= 60) {
    console.log("Duration is wrong format. Expecting hh:mm");
    return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
  } else if (hm.length == 1) {
      millisecs = (hm[0] * 3600 * 1000);
  } else millisecs = (hm[0]*3600+hm[1]*60) * 1000; 
  endDate = endDate.getTime() + millisecs;

  const updateReservation = {
      carmodel: req.body.carmodel,
      service: req.body.service,
      duration: req.body.duration,
      start: req.body.start,
      end: endDate
  }

  User.findOne({ //Checking that customer exist whom reservation is going to be updated.
    name: userName
  }).then((user) => {
    if (user == null) { //Customer wasn't found.
      console.log("Update failed for id " + req.params.id + ". Reason: customer " + req.body.name + " can't be found.");
      res.status(400).json({message : "Error 400: Update failed for id " + req.params.id + ". Reason: customer " + req.body.name + " can't be found."});
    }
    else { //Customer was found.
      user.populate('reservations').execPopulate((err, reservations) => {
        checkID(reservations.reservations,req.params.id).then(checkID => { //Checking if the reservation belongs to the customer.
          if (!checkID) { //Reservation didn't belong to customer.
            console.log("Reservation id incorrect or it doesn't belong to this customer!");
            return res.status(400).json({ message: "Reservation id incorrect or it doesn't belong to this customer!"});
          } else { //Reservation did belong to customer.
            Reservation.find({}, (err, reservations) => {
              checkReservations(reservations, updateReservation, req.params.id).then(checkResult => { //Checking double bookings.
                if(checkResult) { //Double booking found.
                  console.log("Double booking found!");
                  return res.status(400).json({ message: "Double booking found!"});
                } else { //Double was not found. Updating reservation.
                  Reservation.findByIdAndUpdate({_id: req.params.id}, updateReservation, {new: true}, (err, result) => {
                    if (err) {
                      console.log("Update failed for id " + req.params.id + ". Reason: " + err.message);
                      return res.status(400).json({message : "Error 400 in PUT: " + err.message});
                    } else {
                      console.log("Reservation id " + req.params.id + " updated!\n" + result);
                      return res.status(201).json({message : "Reservation id "+ req.params.id + " updated!"});
                    }
                  })
                }
              })
            })
          }
        })
      })
    }
  })  
}

//Updating partial reservation.
const patch_reservation = (req, res) => {
  console.log("---> PATCH reservation. <---");

  Reservation.find({}, (err, reservations) => { //Checking is there any reservation what to update.
    if (reservations.length == 0) { // In case nothing found, returning corresponding result.
      console.log("Database is empty! There's nothing to update.");
      return res.status(400).json({ message: "Database is empty! There's nothing to update."});
    };

    checkID(reservations, req.params.id).then(checkID => { //Checking that reservation id what is going to be udpated exist.
    if (!checkID) {
      console.log("Id doesn't exist!");
      return res.status(400).json({ message: "Id doesn't exist!"});
    } else if (req.body.start != undefined || req.body.duration != undefined) { //Reservation found and it has new start or new duration so checking that there's no double booking.
      Reservation.findById({_id: req.params.id}, (err, result) => {
        console.log(result);

        let updateReservationTimes = {};

        //Adding data to req.body based on what is included in request.
        if (req.body.duration == undefined && req.body.start != undefined) {
          
          req.body.duration = result.duration;

          let endDate = new Date(req.body.start);
          let hm = req.body.duration.split(":");
          let millisecs;

          if (req.body.duration.match(/[a-zA-Z]/i)){
            console.log("Duration is in wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length > 2) {
            console.log("Duration is in wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length == 2 && hm[1] >= 60) {
            console.log("Duration is wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length == 1) {
              millisecs = (hm[0] * 3600 * 1000);
          } else millisecs = (hm[0]*3600+hm[1]*60) * 1000;

          endDate = endDate.getTime() + millisecs;          
          req.body.end = endDate;

          updateReservationTimes = {
            name: req.body.name,
            service: req.body.service,
            duration: result.duration,
            start: req.body.start,
            end: endDate
          }

        } else if (req.body.duration != undefined && req.body.start == undefined) {

          req.body.start = result.start;

          let endDate = new Date(result.start);
          let hm = req.body.duration.split(":");
          let millisecs;
    
          if (req.body.duration.match(/[a-zA-Z]/i)){
            console.log("Duration is in wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length > 2) {
            console.log("Duration is in wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length == 2 && hm[1] >= 60) {
            console.log("Duration is wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length == 1) {
              millisecs = (hm[0] * 3600 * 1000);
          } else millisecs = (hm[0]*3600+hm[1]*60) * 1000;

          endDate = endDate.getTime() + millisecs;          
          req.body.end = endDate;

          updateReservationTimes = {
            name: req.body.name,
            service: req.body.service,
            duration: req.body.duration,
            start: result.start,
            end: endDate
          }

        } else {
          let endDate = new Date(req.body.start);
          let hm = req.body.duration.split(":");
          let millisecs;

          if (req.body.duration.match(/[a-zA-Z]/i)){
            console.log("Duration is in wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length > 2) {
            console.log("Duration is in wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length == 2 && hm[1] >= 60) {
            console.log("Duration is wrong format. Expecting hh:mm");
            return res.status(400).json({ message: "Duration is in wrong format. Expecting hh:mm"});
          } else if (hm.length == 1) {
              millisecs = (hm[0] * 3600 * 1000);
          } else millisecs = (hm[0]*3600+hm[1]*60) * 1000;
         
          endDate = endDate.getTime() + millisecs;          
          req.body.end = endDate;

          updateReservationTimes = {
            name: req.body.name,
            service: req.body.service,
            duration: req.body.duration,
            start: req.body.start,
            end: endDate
          }
        }

        checkReservations(reservations, updateReservationTimes, req.params.id).then(checkResult => { //Checking that there's no double booking.
          if(checkResult) {
            console.log("Double booking found!");
            return res.status(400).json({ message: "Double booking found!"});
          } else { //In case no double booking, updating it.
            Reservation.findByIdAndUpdate({_id: req.params.id}, updateReservationTimes, {new: true}, (err, result) => {
              if (err) {
                console.log("Update failed for id " + req.params.id + ". Reason: " + err.message);
                res.status(400).json({message : "Error 400: " + err.message});
              } else {      
                console.log("Reservation id " + req.params.id + " updated!\n" + result);
                res.status(201).json({message : "Reservation id "+ req.params.id + " updated!"});
              }
            })
          }
        }) 
      })
    } else { //There's was nothing in the update which could cause double booking so updating what was changed.
      Reservation.findByIdAndUpdate({_id: req.params.id}, req.body, {new: true}, (err, result) => {
        if (err) {
          console.log("Update failed for id " + req.params.id + ". Reason: " + err.message);
          res.status(400).json({message : "Error 400: " + err.message});
        } else {      
          console.log("Reservation id " + req.params.id + " updated!\n" + result);
          res.status(201).json({message : "Reservation id "+ req.params.id + " updated!"});
        }
      })
    }
  }) 
})
}

module.exports.post_reservation  = post_reservation;
module.exports.get_reservations = get_reservations;
module.exports.delete_reservation  = delete_reservation;
module.exports.put_reservation  = put_reservation;
module.exports.patch_reservation  = patch_reservation;

//Helpers. To check that there's no double booking.
async function checkReservations (reservations, updateReservation, idToUpd) {
  let found = false;
  for (var i = 0; i < reservations.length; i++) { //Looping through all reservations to see that there's no double booking.
    console.log(reservations[i].start + " vs " + new Date(updateReservation.start));
    console.log(reservations[i].end + " vs " + new Date(updateReservation.end));
    if (((new Date(updateReservation.start) <= reservations[i].start && new Date(updateReservation.end) > reservations[i].start && new Date(updateReservation.end) < reservations[i].end) ||
        (new Date(updateReservation.start) >= reservations[i].start && new Date(updateReservation.start) < reservations[i].end) || 
        (new Date(updateReservation.start) <= reservations[i].start && new Date(updateReservation.end) >= reservations[i].end)) && reservations[i]._id != idToUpd) { //Found double booking.
      console.log("Double booking found!");
      found = true;
      return found;
    } 
  }
  return found;
}

//Helpers. To check that reservation id exist.
async function checkID (reservations, idToUpd) {
  let found = false;
    for (var i = 0; i < reservations.length; i++) { //Looping through all reservations to see that reservation exist.
      if (reservations[i]._id == idToUpd) { //Reservation found.
        console.log("ID found!");
        found = true;
        return found;
      } 
    }
  return found;
}