import mongoose from "mongoose";
import { config } from "../../config/app.config";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (error) {
    console.error("Error connecting to MongoDB:");
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
