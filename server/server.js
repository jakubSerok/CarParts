const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRouts');
const connectDB = require('./config/db');

const URL_FORONT = process.env.FRONTEND_URL;

// App config
const app = express();
const port = process.env.PORT || 4000;
dotenv.config(); // Load environment variables


// Middleware
app.use(express.json());
app.use(
  cors({
    origin: URL_FORONT, // Allow requests from this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    credentials: true, // Allow credentials if needed
  })
);
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// db connection
connectDB();

// Routes
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
    res.send("API WORK ON PORT " + port);
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });