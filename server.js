const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust to your specific origin if needed
    methods: ["GET", "POST"],
  },
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/room/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room", (roomId) => {
    const userId = socket.id;
    socket.roomId = roomId; // Store roomId in socket object
    socket.userId = userId; // Store userId in socket object
    console.log(`${userId} joined room: ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
  });
  
  socket.on("signal", ({ userId, signal }) => {
    console.log(`Signal from ${socket.id} to ${userId}`);
    io.to(userId).emit("signal", { signal, userId: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (socket.roomId && socket.userId) {
      socket.to(socket.roomId).emit("user-disconnected", socket.userId); // Use socket.userId
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
