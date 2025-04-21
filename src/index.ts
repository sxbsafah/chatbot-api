import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoute from "./routes/auth.routes";

mongoose.connect("mongodb://localhost:27017/chatBot");

config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`listening on PORT ${PORT}`);
});
