const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const feedbackRoutes = require("./routes/feedbackRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
