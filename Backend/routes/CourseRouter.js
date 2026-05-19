import express from 'express';
import {getpupliccourses , getcourses , getcoursebyid , createCourse , deletecourse , ratecourse , getmyrating} from '../controllers/CourseController.js';
import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads")); // فولدر التخزين
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ex = path.extname(file.originalname);
    cb(
      null,
      `course-${uniqueName}${ex}`
    );
  },
});

const upload = multer({ storage: storage });
const courseRouter = express.Router();



courseRouter.get('/puplic', getpupliccourses);
courseRouter.get('/', getcourses);
courseRouter.get('/:courseId/rating', getmyrating);
courseRouter.post('/:courseId/rate', ratecourse);
courseRouter.get('/:id', getcoursebyid);
courseRouter.post(
  '/',
  upload.single('image'),
  createCourse
);

courseRouter.delete('/:id', deletecourse);


export default courseRouter;