# WebServiceRESTfulV2

POST (localhost:9111/reservation)
- Creating customer + reservation
Expected body:
{
    "name": "Teppo Testaaja",
    "number": "0407403212",
    "carmodel": "Audi A4",
    "service": "Syö öljyä",
    "duration": "1:30",
    "start": "2020-10-26T09:00:00"
}
- Name, carmodel, service, duration, start are mandatory for the POST.
- End time is being calculated based on duration and start time.
- Double bookings are being checked.


DELETE (localhost:9111/reservation/:id)
- Give reservation id as parameter.
- Delete will remove reservation + reservation reference from customer.

GET (localhost:9111/reservations)
- Returns all customer and all reservations.

GET (localhost:9111/reservations?search_criteria=)
- Returns one customer all reservations.
- Use customer name as search criteria, e.g. search_criteria=Teppo Testaaja

PUT (localhost:9111/reservation/:id)
- Expecting to have same body as post (name, carmodel, service, duration, start are mandatory)
- Needs reservation id as parameter.
- Checks that reservation belongs to customer.
- Checks that there's no double bookings.

PATCH (localhost:9111/reservation/:id)
- Allows partial update.
- Needs reservation id as parameter.
- Checks that there's no double bookings (in case new duration or start is given)