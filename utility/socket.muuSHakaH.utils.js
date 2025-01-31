const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("Vendor connected:", socket.id);

  // Listen for location updates from the driver
  socket.on("updateLocation", (locationData) => {
    io.emit("driverLocation", locationData); // Broadcast the location to all connected clients
  });

  socket.on("disconnect", () => {
    console.log("Vendor disconnected:", socket.id);
  });
});
