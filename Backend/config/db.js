import mongoose from "mongoose";

export const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("DB Connected");
  } catch (error) {
    console.log("Mongo Error:", error.message);
  }
};