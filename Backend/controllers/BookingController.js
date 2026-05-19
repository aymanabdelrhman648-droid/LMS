import Bookingmodel from "../models/Bookingmodel.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/express";
dotenv.config();   

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;  
const FRONTEND_URL = process.env.FRONTEND_URL;

const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null;


const tonumber = (v) =>{
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
};

const generateUniqueId = () => {
      return uuidv4();
}

// for image 
function buildFrontendBase(req) {
  if (FRONTEND_URL) return FRONTEND_URL.replace(/\/$/, "");
  const origin = req.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const host = req.get("host");
  if (host) return `${req.protocol || "http"}://${host}`.replace(/\/$/, "");
  return null;
}


  export const getBookings = async (req , res) => {
        try {
      const {search = "" , status , limit : pagelimit = 50 , page : pagerow =1 } = req.query;
      const limit = Math.min(200, Math.max(1, parseInt(pagelimit,10) || 50));
      const page = Math.max(1, parseInt(pagerow,10) || 1);
      const skip = (page - 1) * limit;
        
      let filter = {};
      if(status) {
         filter.orderStatus = status;
      }

      if(search) {
          const re =new RegExp(search, "i");
          filter.$or = [
               {bookingId: re},
               {courseName: re},
               {teacherName: re},
               {clerkUserId : re},
               {studentName : re},
          ]

          const result = await Bookingmodel.find(filter)
           .sort({createdAt : -1})
           .skip(skip)
           .limit(limit)
           .lean();
            
           return res.json({
                 success : true,
                    data : result,
                    meta:{
                         limit,
                         page,
                        total : result.length
                    }
           })

      }
        } catch (error) {
           console.error("Error fetching bookings:", error);
           res.status(500).json({ success: false, message: "Server error" });   
        }
}

export const createBooking = async (req , res) => {
      const {userId} = getAuth(req);
      if(!userId) return res.status(401).json({success : false , message : "Unauthorized"});
      const {
           notes = "",
           teacherName = "",
           courseName ,
           studentName ,
           price,
           courseId,
           email,           
      } = req.body;

      if(!courseName || !courseId) return res.status(400).json({success : false , message : "Course name and course id are required"});

      const safeprice = tonumber(price);
      if(safeprice === null || safeprice <= 0) return res.status(400).json({success : false , message : "Invalid price"});

      const bookingId = generateUniqueId();
      

      const realName = (studentName && String(studentName).trim()) ||
           (email && String(email).trim()) || `USER-${String(userId).slice(0,8)}`;

             const basePayload = {
           bookingId,
          clerkUserId: userId,
          studentName: realName,
          course: courseId,
         courseName,
         teacherName,
        price: safeprice,
        paymentMethod: "Online",
       paymentStatus: "Unpaid",
       notes,
       orderStatus: "Pending",
       createdAt: new Date(),
    };

    if(!stripe) return res.status(500).json({success : false , message : "Stripe is not configured"});

    if(safeprice === 0){
         const booking = await Bookingmodel.create({
          ...basePayload,
            paymentStatus: "Paid",
            orderStatus: "Confirmed",
            paidAt: new Date(),
    });
            return res.status(201).json({success : true , data : booking , checkoutUrl : null});
    }

    const base = buildFrontendBase(req);
    if(!base) return res.status(500).json({success : false , message : "Unable to determine frontend URL"});

      let session; 
      const successUrl =  `${base}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${base}/booking/cancel`;

      try {
              session = await stripe.checkout.sessions.create({
               payment_method_types: ["card"],
               mode: "payment",
             customer_email: email || undefined,
          line_items: [
          {
            price_data: {
              currency:  "usd",
              product_data: { name: courseName },
              unit_amount:  Math.round(safeprice * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { bookingId, courseId, clerkUserId: userId, studentName: realName},
      });
      } catch (stripeErr) {
              console.error("Error creating Stripe session:", stripeErr);
                const message = stripeErr?.raw?.message || stripeErr?.message || "Stripe error";
            return res.status(502).json({ success: false, message: `Payment provider error: ${message}` });
      }

     try {
      const booking = await Bookingmodel.create({
        ...basePayload,
        sessionId: session.id,
        paymentIntentId: session.payment_intent || null,
      });
      return res.status(201).json({ success: true, booking, checkoutUrl: session.url || null });
    } catch (dbErr) {
      console.error("DB error saving booking after stripe session:", dbErr);
      return res.status(500).json({ success: false, message: "Failed to create booking record" });
    }
  };

export const confirmBooking = async (req, res) => {
  try {
    const { userId } = getAuth(req) || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: "Stripe is not configured",
      });
    }

    // ─────────────────────────────────────────────
    // Retrieve Stripe Session
    // ─────────────────────────────────────────────
    const session = await stripe.checkout.sessions.retrieve(
      session_id
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("VERIFY SESSION");
    console.log("SESSION ID:", session.id);
    console.log(
      "PAYMENT STATUS:",
      session.payment_status
    );
    console.log(
      "METADATA:",
      session.metadata
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Stripe uses payment_status
    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // ─────────────────────────────────────────────
    // Find booking using sessionId
    // ─────────────────────────────────────────────
    let booking =
      await Bookingmodel.findOneAndUpdate(
        {
          sessionId: session_id,
        },
        {
          paymentStatus: "Paid",
          paymentIntentId:
            session.payment_intent || null,

          orderStatus: "Confirmed",

          paidAt: new Date(),
        },
        { new: true }
      );

    console.log(
      "BOOKING AFTER SESSION UPDATE:",
      booking
    );

    // ─────────────────────────────────────────────
    // Fallback using bookingId from Stripe metadata
    // ─────────────────────────────────────────────
    if (
      !booking &&
      session.metadata?.bookingId
    ) {
      booking =
        await Bookingmodel.findOneAndUpdate(
          {
            bookingId:
              session.metadata.bookingId,
          },
          {
            paymentStatus: "Paid",

            paymentIntentId:
              session.payment_intent || null,

            orderStatus: "Confirmed",

            paidAt: new Date(),
          },
          { new: true }
        );

      console.log(
        "BOOKING AFTER METADATA FALLBACK:",
        booking
      );
    }

    // ─────────────────────────────────────────────
    // Booking not found
    // ─────────────────────────────────────────────
    if (!booking) {
      console.log(
        "BOOKING NOT FOUND IN DATABASE"
      );

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log(
      "PAYMENT VERIFIED SUCCESSFULLY"
    );

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.log(
      "CONFIRM BOOKING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const getUserBookings = async (req , res) => {
      const {userId} = getAuth(req) || {};
      if(!userId) return res.status(401).json({success : false , message : "Unauthorized"});
      try {
            const bookings = await Bookingmodel.find({clerkUserId : userId}).sort({createdAt : -1}).lean();
            return res.json({success : true , data : bookings});
      } catch (error) {
           console.error("Error fetching user bookings:", error);
           res.status(500).json({ success: false, message: "Server error" });   
      }
};


export const getStats = async (req, res) => {
  try {

    const totalBookings = await Bookingmodel.countDocuments();

    const totalRevenueAgg = await Bookingmodel.aggregate([
      {
        $match: {
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$price",
          },
        },
      },
    ]);

    const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const latestBookings = await Bookingmodel.countDocuments({
      createdAt: {
        $gte: sevenDaysAgo,
      },
    });

    const topCourses = await Bookingmodel.aggregate([
      {
        $group: {
          _id: "$courseName",
          count: {
            $sum: 1,
          },
          revenue: {
            $sum: "$price",
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 6,
      },
      {
        $project: {
          _id: 0,
          courseName: "$_id",
          count: 1,
          revenue: 1,
        },
      },
    ]);

    return res.json({
      success: true,
      stats: {
        totalBookings,
        totalRevenue,
        latestBookings,
        topCourses,
      },
    });

  } catch (error) {

    console.log("GET STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


export const checkBooking =  async (req , res) => {
          const {userId} = getAuth(req) || {};
      if(!userId) return res.status(401).json({success : false , message : "Unauthorized"});
      const {courseId} = req.query;
      if(!courseId) return res.status(400).json({success : false , message : "Course ID is required"});
       try {
            const existingBooking = await Bookingmodel.findOne({clerkUserId : userId , course : courseId , paymentStatus : "Paid"});
             if(!existingBooking) return  res.status(200).json({success : true , booking : null , enrolled : false });
               
              return res.json({success : true , booking : existingBooking , enrolled : true});

       } catch (error) {
            console.error("Error checking booking:", error);
            return res.status(500).json({ success: false, message: "Server error" });
       }
}