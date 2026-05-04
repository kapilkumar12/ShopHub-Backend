require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const connectDB = require("./src/config/db");

// 🔥 Connect DB
connectDB();

// 🔥 Create HTTP server
const server = http.createServer(app);

// ✅ Allowed Origins (NO trailing slash)
const allowedOrigins = [
  "https://shop-hub-three-lake.vercel.app",
  "https://shophub-admin-panel.vercel.app"
];

// 🔥 Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// 🌍 Make io global
global.io = io;

// 🔥 Socket events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Order room
  socket.on("joinOrderRoom", (orderId) => {
    socket.join(orderId);
    console.log("Joined order room:", orderId);
  });

  // User room
  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    console.log("Joined user room:", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// 🔥 Health check route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// 🔥 Start server (Render compatible)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});