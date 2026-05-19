import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import {connectdb} from  './config/db.js';
import courseRouter from './routes/CourseRouter.js';
import bookingRouter from './routes/BookingRouter.js';

import path from "path";


const app = express();
const port =  process.env.PORT || 4000;;


// Middlewares 
app.use(cors({
        origin: ["https://lms-ed41.vercel.app"],
        credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);
app.use('/api/course' , courseRouter);
app.use('/api/booking' , bookingRouter);
// DB
connectdb();

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
});
app.get('/' , (req,res)=>{
    res.send("api work");
});

app.listen(port , ()=>{
     console.log(`Server running on http://localhost:${port}`);
});


