const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');

const rooms = new Set(); // Track active rooms

app.get('/', (req, res) => {
  res.render('index', { rooms: Array.from(rooms) });
});

app.get('/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  rooms.add(roomId); // Add room to the active list
  res.render('room', { roomId });
});

// Serve static files
app.use(express.static('public'));

// Socket.IO connection
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);

    // Notify other users in the room
    socket.to(roomId).emit('user-connected', socket.id);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected from room: ${roomId}`);
      socket.to(roomId).emit('user-disconnected', socket.id);

      // Clean up room if empty
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size === 0) {
        rooms.delete(roomId);
      }
    });
  });

  socket.on('signal', ({ userId, signal }) => {
    io.to(userId).emit('signal', { userId: socket.id, signal });
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
