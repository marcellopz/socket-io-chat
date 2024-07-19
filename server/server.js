const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);

let users = [];

const messages = {
  general: [],
  random: [],
};

io.on("connection", (socket) => {
  // "socket" variable is the connection to the specific client
  console.log(socket, "new user");

  socket.on("join server", (username) => {
    const user = {
      username,
      id: socket.id,
    };
    users.push(user);
    io.emit("new user", user); // emitting with io will broadcast to all users
  });

  socket.on("join room", (roomName, callback) => {
    // user joined a room
    socket.join(roomName);
    callback(messages[roomName]);
  });

  socket.on("send message", ({ content, to, sender, chatName, isChannel }) => {
    // send message to a channel or user
    if (isChannel) {
      // if it's a channel
      const payload = {
        content,
        chatName,
        sender,
      };
      socket.to(to).emit("new message", payload);
    } else {
      // if it's a user
      const payload = {
        content,
        chatName: sender,
        sender,
      };
      socket.to(to).emit("new message", payload);
    }

    // save the message
    if (messages[chatName]) {
      // if the chat already exists
      messages[chatName].push({
        sender,
        content,
      });
    } else {
      // if the chat doesn't exist
      messages[chatName] = [{ sender, content }];
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((u) => u.id !== socket.id);
    io.emit("new user", users);
  });
});

httpServer.listen(3000, () => {
  console.log("listening on *:3000");
});
