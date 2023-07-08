require('dotenv').config();
const SERVER_PORT = process.env.SERVER_PORT
const express = require("express");
const server = express();
const morgan = require("morgan");

server.use(morgan("dev"));
server.use(express.json());

// Logging functionality
server.use((req, res, next) => {
  console.log("<---Body Logger START--->");
  console.log(req.body);
  console.log("<---Body Logger END--->");

  next();
});

const apiRouter = require("./api");
server.use("/api", apiRouter);


server.listen(SERVER_PORT, () => {
  console.log("Server is running on port", SERVER_PORT);
});
