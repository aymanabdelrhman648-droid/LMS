import mongoose from "mongoose";

export const connectdb = async () => {
  await mongoose.connect(
    'mongodb+srv://aymanabdelrhman648_db_user:Z2YSVsbiC3ngRTOC@cluster1.fiitwhz.mongodb.net/?appName=Cluster1/LMS'
  )
  .then(() => {
    console.log('DB Connected');
  });
};