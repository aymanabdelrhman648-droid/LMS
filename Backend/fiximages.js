// fix-images.js - شغّله مرة وخلاص
import mongoose from 'mongoose';
import 'dotenv/config';
import Course from './models/courseModel.js'; // غير الـ path لو مختلف

await mongoose.connect('mongodb+srv://aymanabdelrhman648_db_user:Z2YSVsbiC3ngRTOC@cluster1.fiitwhz.mongodb.net/?appName=Cluster1/LMS');

const courses = await Course.find({ image: /^http/ });
console.log(`Found ${courses.length} courses to fix`);

for (const course of courses) {
  // استخرج الـ filename بس من الـ URL
  const filename = course.image.split('/uploads/')[1];
  if (filename) {
    course.image = `/uploads/${filename}`;
    await course.save();
    console.log(`Fixed: ${filename}`);
  }
}

console.log('Done!');
await mongoose.disconnect();