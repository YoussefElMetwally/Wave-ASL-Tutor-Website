// Requiring dependencies
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const express = require("express");
const cors = require("cors");
const app = express();

const { errorHandler } = require("./middleware/errorHandler");
const { logger } = require("./middleware/logger");
const { loadModel } = require("./controllers/onnxController");

// Using .env File
require("dotenv").config();

// Connecting to MongoDB
const db = require("./config/database");
db();

// Using middleware
app.use(
  cors({
    origin:
      "http://localhost:" + process.env.FRONTEND_PORT ||
      "http://localhost:" + process.env.BACKEND_PORT,
    credentials: true, // Allows cookies to be sent
  })
);

// Load ONNX model on server start
loadModel().then(() => {
  console.log("Ready to accept requests.");
});

app.use(cookieParser());
app.use(express.json());
app.use(logger);

// Using body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Using morgan Request Logger
app.use(morgan("dev"));

// Using Resources Folder
app.use(express.static("src"));

// Using Routes
const routes = require("./routes/routes");
app.use("/", routes);

// Redirecting to page not found if wrong url is used
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.redirect("/views/404");
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.listen(process.env.BACKEND_PORT);
