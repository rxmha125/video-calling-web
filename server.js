// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
  
    socket.on("join-room", (roomId, userId) => {
      console.log(`${userId} joined room: ${roomId}`);
      socket.join(roomId);
      socket.to(roomId).emit("user-connected", userId);
  
      // Relay signaling data
      socket.on("signal", ({ userId, signal }) => {
        console.log(`Signal from ${socket.id} to ${userId}`);
        io.to(userId).emit("signal", { signal, userId: socket.id });
      });
  
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        socket.to(roomId).emit("user-disconnected", userId);
      });
    });
  });
  
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
