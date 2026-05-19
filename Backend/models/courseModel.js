import mongoose from  'mongoose';

const chapterschema = new mongoose.Schema({
      name :{type : String , required : true},
      topic: {type : String , required : true},
      duration:{
         hours : {type : Number , default : 0},
         minutes : {type : Number , default : 0},
      },
      totalMinutes : {type:Number , default:0},
      videoUrl :  {type:String , required :true},
},{_id:true});

const lectureschema = new mongoose.Schema({
       title: {type : String , required : true},
      duration:{
         hours : {type : Number , default : 0},
         minutes : {type : Number , default : 0},
      },
      totalMinutes : {type:Number , default:0},
      chapters : [chapterschema],
},{_id:true});


const courseschema = new mongoose.Schema({
      name : {type : String , required :true},
      teacher : {type : String , required : true},
      image : {type : String},
      ratings :[
         {
             userId : {type:String , required : true},
             rating : { type : Number , default : 0 },
             comment : {type : String , default : ""},
             updatedAt : {type : Date , default : null},
         },
      ],
      totalRatings : {type : Number , default : 0},
      avgRatings: {type : Number , default : 0},
      pricingType: {type :String,enum:["free" , "paid"] , default:"free"},
     overview : {type : String},
      price:{
           original : {type : Number , default : 0},
           sale : {type : Number , default : 0}
      },
        totalDuration:{
           hours : {type : Number , default : 0},
          minutes : {type : Number , default : 0}
      },
      rating : { type:Number , default:0 },
     courseType : {type :String, enum:["regular" , "top"] , default:"regular"},
     lectures : [lectureschema],
     totalLectures : {type : Number , default : 0}

},{timestamps :true})

// for getting total 

courseschema.pre('save', async function () {
  if (!Array.isArray(this.lectures)) this.lectures = [];

  let courseTotalMinutes = 0;

  this.lectures = this.lectures.map((lec) => {
    lec = lec || {};
    lec.duration = lec.duration || {};
    lec.chapters = Array.isArray(lec.chapters) ? lec.chapters : [];

    let lectureTotalMinutes = 0;

    lec.chapters = lec.chapters.map((chp) => {
      chp = chp || {};
      chp.duration = chp.duration || {};
      const chpHours   = Number(chp.duration.hours)   || 0;
      const chpMinutes = Number(chp.duration.minutes) || 0;
      const chpTotal   = Math.max(0, chpHours * 60 + chpMinutes);
      chp.totalMinutes       = chpTotal;
      chp.duration.hours     = Math.floor(chpHours);
      chp.duration.minutes   = Math.floor(chpMinutes);
      chp.name               = chp.name     || "";
      chp.topic              = chp.topic    || "";
      chp.videoUrl           = chp.videoUrl || "";
      lectureTotalMinutes   += chpTotal;
      return chp;
    });

    const lecHours   = Number(lec.duration.hours)   || 0;
    const lecMinutes = Number(lec.duration.minutes) || 0;
    const lecOwn     = lecHours * 60 + lecMinutes;

    // FIX B: compute effective total but DO NOT overwrite lec.duration
    lec.totalMinutes = lec.chapters.length > 0 ? lectureTotalMinutes : lecOwn;
    lec.title        = lec.title || "Untitled lecture";
    courseTotalMinutes += lec.totalMinutes;
    return lec;
  });

  // FIX A: only overwrite totalDuration when lectures actually have duration
  if (courseTotalMinutes > 0) {
    this.totalDuration = {
      hours:   Math.floor(courseTotalMinutes / 60),
      minutes: courseTotalMinutes % 60,
    };
  }

  // FIX D: only overwrite totalLectures when lectures array is populated
  if (this.lectures.length > 0) {
    this.totalLectures = this.lectures.length;
  }
});

const Course =
  mongoose.models.Course2 ||
  mongoose.model("Course2", courseschema);

export default Course;
