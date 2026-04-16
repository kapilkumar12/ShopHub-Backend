const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("joinUserRoom", "123");
});

socket.on("newNotification", (data) => {
  console.log("Notification:", data);
});