const mongoose = require("mongoose");
require('dotenv').config();

const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("DB connected"))
    .catch(err => console.error("DB connection error:", err));
};

module.exports = connectDB;
