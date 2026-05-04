require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const {Server} = require('socket.io')
const http = require("http");

connectDB();

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://project1.com",
  "https://project2.com",
  "https://admin.project.com"
];

const io = new Server(server,{
    cors: {
    origin: allowedOrigins,
    credentials: true
  },
})

global.io = io;

io.on('connection',(socket)=>{
    console.log("User connected:", socket.id);
    // 🔥 ORDER ROOM
  socket.on("joinOrderRoom", (orderId) => {
    socket.join(orderId);
    console.log("Joined order room:", orderId);
  });
    socket.on('joinUserRoom',(userId)=>{
        socket.join(userId);
        console.log("Joined user room:", userId)
    })
    socket.on("disconnect",()=>{
        console.log("User disconnected")
    })
})

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});