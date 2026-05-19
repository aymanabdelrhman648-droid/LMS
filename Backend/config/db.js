import mongoose from "mongoose";

export const connectdb = async () => {
  await mongoose.connect(
    await mongoose.connect(
  'mongodb+srv://aymanabdelrhman648_db_user:Z2YSVsbiC3ngRTOC@cluster1.fiitwhz.mongodb.net/LMS?retryWrites=true&w=majority&appName=Cluster1'
)
  )
  .then(() => {
    console.log('DB Connected');
  });
};