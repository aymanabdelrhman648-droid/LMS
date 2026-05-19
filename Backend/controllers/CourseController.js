
import Course from '../models/courseModel.js';
import {getAuth} from '@clerk/express';
import fs from 'fs';
import path from 'path';

// two helper functions
const toNum = (v , fallback = 0) =>{
     if(typeof v === 'number') return v ; 
     if(typeof v === 'string' && v.trim() === "") return fallback;
     const number = Number(v);
     return Number.isFinite(number) ? number : fallback;
}

const safeparse = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;           // already parsed
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};



/**
 * Compute derived fields (lecture totals, course totalDuration, totalLectures)
 * Mutates and returns courseObj
 */
const computeDerivedFields = (courseObj) => {
  if (!Array.isArray(courseObj.lectures)) courseObj.lectures = [];
 
  courseObj.lectures = courseObj.lectures.map((lec) => {
    lec          = { ...lec };
    lec.duration = lec.duration || {};
    lec.chapters = Array.isArray(lec.chapters) ? lec.chapters : [];
 
    // ── normalise chapters ────────────────────────────────────────────────
    lec.chapters = lec.chapters.map((ch) => {
      ch          = { ...ch };
      ch.duration = ch.duration || {};
 
      const chHours   = toNum(ch.duration.hours);
      const chMins    = toNum(ch.duration.minutes);
      const chTotal   = chHours * 60 + chMins;
 
      ch.totalMinutes     = ch.totalMinutes ? toNum(ch.totalMinutes) : chTotal;
      ch.duration.hours   = chHours;
      ch.duration.minutes = chMins;
      ch.name             = ch.name     || "";
      ch.topic            = ch.topic    || "";
      ch.videoUrl         = ch.videoUrl || "";
 
      return ch;
    });
 
    // ── compute lecture totalMinutes ──────────────────────────────────────
    const lecHours   = toNum(lec.duration.hours);
    const lecMins    = toNum(lec.duration.minutes);
    const lecOwn     = lecHours * 60 + lecMins;
    const chaptersTotal = lec.chapters.reduce((s, c) => s + toNum(c.totalMinutes), 0);
 
    lec.totalMinutes    = lec.chapters.length > 0 ? chaptersTotal : lecOwn;
    lec.title           = lec.title || "Untitled lecture";
 
    // FIX B: do NOT overwrite lec.duration here — preserve admin input
    return lec;
  });
 
  return courseObj;
};
 


const makeImageAbsolute = (rawImage, req) => {
  if (!rawImage) return "";
  const image = String(rawImage || "");
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) {
    return `${req.protocol}://${req.get("host")}${image}`;
  }
  // if file stored as "uploads/filename" or just "filename"
  if (image.startsWith("uploads/")) {
    return `${req.protocol}://${req.get("host")}/${image}`;
  }
  return `${req.protocol}://${req.get("host")}/uploads/${image}`;
};

 export const getpupliccourses = async(req,res) =>{
      try {
          const {home , type = 'all' , limit} = req.query;

          let filter = {};

          if(home === 'true'){
             filter.courseType = 'top';
          }else if (type === 'top'){
              filter.courseType = 'top';
          } else if (type === 'regular'){
              filter.courseType = 'regular';
          }

          const courses = Course.find(filter).sort({createdAt : -1})

          if(home === 'true'){
             courses.limit(Number(limit)|| 8);
          }  else if(limit){
             courses.limit(Number(limit));
          }

          const finalcourses = await courses.lean();

          const mapped = finalcourses.map((c) =>{
               const imageurl = makeImageAbsolute(c.image || "" , req)
               return {
                  ...c , 
                  image : imageurl
               }
          });

          return res.json({
              success: true,
              items : mapped,
          })
      } catch (error) {
        console.log("err" , error);
         return res.status(500).json({
            success : false,
            error : "server error",
        })
      }
}


// get all courses 

 export const getcourses = async(req , res) =>{
     try{
         const courses = await Course.find().sort({createdAt : -1}).lean() 
         const mapped = courses.map((c) =>{
             return{
                ...c,
                image : makeImageAbsolute(c.image || "" , req)
             }
         });
             return res.json({
              success: true,
              items : mapped,
          });
     }catch (error) {
        console.log("err" , error);
         return res.status(500).json({
            success : false,
            error : "server error",
        });
      }
};


   export const getcoursebyid = async(req,res) =>{
       try {
            const{id} = req.params;
            const course = await Course.findById(id).lean()
            if(!course) return res.status(404).json({
                  success : false,
                  error : 'notfound',
            })

            course.image = makeImageAbsolute(course.image || "" , req)
            return res.json({
                success : true,
                course
            });
       } catch (error) {
        console.log("err" , error);
         return res.status(500).json({
            success : false,
            error : "server error",
        });
      } };



export const createCourse = async (req, res) => {
  try {
    const body = req.body || {};
 
    // ── image ───────────────────────────────────────────────────────────────
    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : body.image || "";
 
    // ── price ───────────────────────────────────────────────────────────────
    //
    // FIX C: FormData sends nested fields as dot-notation keys
    // ("price.original", "price.sale").  We check both the dot-notation keys
    // AND a pre-parsed JSON object under body.price.
    // Number() is used directly — it correctly converts any numeric string.
    //
   const price = { original: Number(body["price.original"]) || 0, sale: Number(body["price.sale"]) || 0, };            // may be null or {}
    
   
 
    // ── lectures ────────────────────────────────────────────────────────────
    let lectures = safeparse(body.lectures) ?? [];
    if (!Array.isArray(lectures)) lectures = [];
 
    lectures = lectures.map((lec) => {
      const lecture     = { ...lec };
      lecture.duration  = lecture.duration || {};
      lecture.duration.hours   = toNum(lecture.duration.hours);
      lecture.duration.minutes = toNum(lecture.duration.minutes);
 
      lecture.chapters = Array.isArray(lecture.chapters) ? lecture.chapters : [];
      lecture.chapters = lecture.chapters.map((chp) => ({
        ...chp,
        duration: {
          hours:   toNum(chp.duration?.hours),
          minutes: toNum(chp.duration?.minutes),
        },
        totalMinutes: toNum(chp.totalMinutes, 0),
        videoUrl:     chp.videoUrl || "",
        name:         chp.name    || "",
        topic:        chp.topic   || "",
      }));
 
      return {
        ...lecture,
        totalMinutes: toNum(lecture.totalMinutes, 0),
        title:        lecture.title || "Untitled lecture",
      };
    });
 
    // ── totalDuration ───────────────────────────────────────────────────────
    //
    // Prefer dot-notation keys first (FormData standard), then a pre-parsed
    // JSON object, then fall back to zeros.
    // The pre('save') hook will overwrite this only if lectures have real
    // duration — so this value is what gets saved when lectures are empty.
    //
   const totalDuration = { hours: Number(body["totalDuration.hours"]) || 0, minutes: Number(body["totalDuration.minutes"]) || 0, };
    // ── assemble courseObj ──────────────────────────────────────────────────
    const courseObj = {
      name:         body.name        || "",
      teacher:      body.teacher     || "",
      image:        imagePath,
      pricingType:  body.pricingType || "free",
      price,
      overview:     body.overview    || body.description || "",
      totalDuration,
      totalLectures: toNum(body.totalLectures, lectures.length),
      lectures,
      courseType:   body.courseType  || "regular",
      rating: Number(body.rating) || 0,
      avgRatings: Number(body.rating) || 0,
      // avgRatings intentionally omitted — schema default (0) is correct
      // for a brand-new course; it is updated when ratings are submitted
    };
 
    // ── run controller-side field derivation ────────────────────────────────
    computeDerivedFields(courseObj);
 
    // ── persist ─────────────────────────────────────────────────────────────
    const course   = new Course(courseObj);
    await course.save();                         // pre('save') hook fires here
 
    const returned = course.toObject();
    returned.image = makeImageAbsolute(returned.image || "", req);
 
    return res.status(201).json({ success: true, course: returned });
 
  } catch (error) {
    console.error(error);
 
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
 
    return res.status(500).json({ success: false, error: error.message });
  }
};
 


export const deletecourse = async(req,res) =>{
      try {
        const {id} = req.params
      const course = await Course.findById(id)
       if(!course) return res.status(404).json({
           success : false,
           error : "notfound"
       });

       try{
           if(course.image && !course.image.startsWith('http')){
                const filepath = path.join(process.cwd() , course.image.startswith('/') ? course.image.slice(1) : course.image)
                  
                if(fs.existsSync(filepath))  fs.unlinkSync(filepath); 
           }
       } catch(e){
           // ignore any errors
       }
        await course.deleteOne();
        return res.json({
             success : true,
             message : 'deleted succesfully'
        })
      }catch (error) {
        console.log("err" , error);
         return res.status(500).json({
            success : false,
            error : "server error",
        });
      }
}

export const ratecourse = async (req, res) => {
  try {

    const { courseId } = req.params;
    const { comment = "", rating: rawRating } = req.body;

    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Auth required",
      });
    }

    const rating = Number(rawRating);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find existing rating
    const index = (course.ratings || []).findIndex(
      (r) => String(r.userId) === String(userId)
    );

    if (index >= 0) {

      course.ratings[index].rating = rating;

      if (typeof comment === "string") {
        course.ratings[index].comment = comment.trim();
      }

      course.ratings[index].updatedAt = new Date();

    } else {

      course.ratings.push({
        userId,
        rating,
        comment:
          typeof comment === "string"
            ? comment.trim()
            : "",
      });

    }

    // Calculate avg
    const ratingsArr = course.ratings || [];

    const totalRatings = ratingsArr.length;

    const sum = ratingsArr.reduce(
      (s, c) => s + (Number(c.rating) || 0),
      0
    );

    const avg =
      totalRatings === 0
        ? 0
        : Number((sum / totalRatings).toFixed(1));

    course.avgRating = avg;
    course.totalRatings = totalRatings;

    await course.save();

    return res.json({
      success: true,
      avgRating: course.avgRating,
      totalRatings: course.totalRatings,
      myRating: {
        userId,
        rating,
      },
    });

  } catch (err) {

    console.error("rateCourse error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getmyrating = async (req, res) => {
  try {
    const { userId } = getAuth(req) || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "auth required",
      });
    }

    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "not found",
      });
    }

    const myrating =
      (course.ratings || []).find(
        (r) => String(r.userId) === String(userId)
      ) || null;

    return res.json({
      success: true,
      myrating: myrating
        ? {
            myrate: myrating.rating,
            comment: myrating.comment,
          }
        : null,
    });

  } catch (err) {
    console.error("getMyRating error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

