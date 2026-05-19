
import mongoose from "mongoose";
import Course from "./models/courseModel.js";

mongoose.connect("mongodb+srv://aymanabdelrhman648_db_user:Z2YSVsbiC3ngRTOC@cluster1.fiitwhz.mongodb.net/?appName=Cluster1/LMS");

const computeCourseTotals = (lectures = []) => {
  const totalMinutes = lectures.reduce((sum, lec) => {
    if (lec.chapters?.length) {
      return (
        sum +
        lec.chapters.reduce((s, ch) => {
          return (
            s +
            ((Number(ch.duration?.hours) || 0) * 60 +
              (Number(ch.duration?.minutes) || 0))
          );
        }, 0)
      );
    }

    return (
      sum +
      ((Number(lec.duration?.hours) || 0) * 60 +
        (Number(lec.duration?.minutes) || 0))
    );
  }, 0);

  return {
    totalLectures: lectures.length,
    totalDuration: {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    },
  };
};

const run = async () => {
  const courses = await Course.find();

  for (const course of courses) {
    const computed = computeCourseTotals(course.lectures || []);

    course.totalLectures = computed.totalLectures;
    course.totalDuration = computed.totalDuration;

    if (!course.overview) {
      course.overview =
        "Professional course covering advanced concepts and practical projects.";
    }

    await course.save();

    console.log(`Updated: ${course.name}`);
  }

  console.log("Done");
  process.exit();
};

run();
 

