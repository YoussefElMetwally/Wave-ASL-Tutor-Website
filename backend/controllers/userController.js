const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Course = require("../models/courseModel");
const Enrollment = require("../models/enrollmentModel");
const { getIdFromCookie } = require("./authController");

exports.userLogin = (req, res) => {
  var Email = req.body.email;
  var Password = req.body.password;

  User.findOne({ email: Email }).then((user) => {
    if (user) {
      bcrypt.compare(Password, user.password, function (err, result) {
        if (err) {
          res.json({ status: 400, error: err });
        }
        if (result) {
          let token = jwt.sign({ id: user.user_id }, "verySecretValue", {
            expiresIn: "30d",
          });
          res.cookie("User", token);
          console.log("User cookie: ", req.cookies);
          res.json({ status: 200, message: "Access Granted" });
        } else {
          console.log("Incorrect Password");
          res.json({ status: 400, message: "Incorrect Password" });
        }
      });
    } else {
      console.log("Incorrect Email");
      res.json({ status: 400, message: "Incorrect Email" });
    }
  });
};

exports.userRegister = (req, res) => {
  bcrypt.hash(req.body.password, 10, function (err, hashedPass) {
    if (err) {
      res.json({
        error: err,
      });
    }

    let newUser = new User({
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      name: `${req.body.firstName} ${req.body.lastName}`,
      email: req.body.email,
      password: hashedPass,
    });
    newUser
      .save({ useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        console.log(newUser);
        res.status(200);
      })
      .catch((err) => {
        console.error(err);
        res.status(500);
      });
  });
};

exports.getUserProfile = async (res) => {
  await User.findOne({ user_id: getIdFromCookie() })
    .then((user) => {
      res.render("profile", { user: user });
    })
    .catch((err) => {
      console.error(err);
      res.redirect("/");
    });
};

exports.getUserEnrollments = async (req, res) => {
  try {
    const userId = getIdFromCookie(req); // Assuming this function extracts user ID from cookies

    const enrollments = await Enrollment.find({ user_id: userId }).sort({
      course_id: 1,
    });

    if (!enrollments.length) {
      return res
        .status(404)
        .json({ message: "No enrollments found for this user." });
    }

    res.status(200).json(enrollments);
  } catch (err) {
    console.error("Error fetching enrollments:", err);
    res.status(500).json({ message: "Error fetching enrollments." });
  }
};

exports.getUserCourses = async (req, res) => {
  try {
    const userId = getIdFromCookie(req); // Extract user ID from cookies

    const enrollments = await Enrollment.find({ user_id: userId });

    if (!enrollments.length) {
      return res.status(404).json({ message: "User has no enrolled courses." });
    }

    const courseIds = enrollments.map((enrollment) => enrollment.course_id);

    const courses = await Course.find({ course_id: { $in: courseIds } }).sort({
      course_id: 1,
    });

    res.status(200).json(courses);
  } catch (err) {
    console.error("Error fetching enrollments or courses:", err);
    res.status(500).json({ message: "Error fetching enrollments or courses." });
  }
};
