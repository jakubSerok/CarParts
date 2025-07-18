const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const userRoutes = require('./routes/userRouts');
const allegroRoutes = require('./routes/allegoRouts');
const chatRoutes = require('./routes/chatRoutes');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket/socketManager');

const URL_FORONT = process.env.FRONTEND_URL;

// Load environment variables
dotenv.config();

// App config
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;


// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(
  cors({
    origin: URL_FORONT, // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, // Allow credentials if needed
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Requested-With']
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
app.use('/api/allegro', allegroRoutes);
app.use('/api/chat', chatRoutes);

app.get("/", (req, res) => {
    res.send("API WORK ON PORT " + port);
  });

// Initialize socket.io
const io = initializeSocket(server);

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
