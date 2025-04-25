const mongoose = require("mongoose");
const express = require("express");
const dotenv = require("dotenv");
const app = express();

const db = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connection Successful");
    })
    .catch((err) => {
      console.log("Connection failed", err);
      db();
    });
};

module.exports = db;
