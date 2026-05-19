import express from 'express';
import {getBookings ,getStats , createBooking , confirmBooking, getUserBookings , checkBooking} from '../controllers/BookingController.js';
import e from 'express';


const BookingRouter = express.Router();

BookingRouter.get('/', getBookings);
BookingRouter.get('/stats' , getStats);
BookingRouter.post('/create' , createBooking);
BookingRouter.get('/confirm' , confirmBooking);
BookingRouter.get('/my' , getUserBookings);
BookingRouter.get('/check' , checkBooking);

export default BookingRouter;