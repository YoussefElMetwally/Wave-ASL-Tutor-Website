const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Course = require("../models/courseModel");
const Enrollment = require("../models/enrollmentModel");
const { getIdFromCookie, sendPasswordResetEmail } = require("./authController");

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
          res.json({ status: 200, message: "Access Granted", token: token });
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

exports.enroll = async (req, res) => {
  try {
    const user_id = getIdFromCookie(req);
    const course_id = req.body.course_id;

    // Check if the course exists - use course_id field instead of _id
    const course = await Course.findOne({ course_id: course_id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the user exists - use user_id field instead of _id
    const user = await User.findOne({ user_id: user_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only check prerequisites if the course has one
    if (course.prereq) {
      const prerequisite = await Enrollment.findOne({
        user_id: user_id,
        course_id: course.prereq,
        status: "Completed",
      });

      if (!prerequisite) {
        // Get the prerequisite course title
        const prereqCourse = await Course.findOne({ course_id: course.prereq });
        return res.status(404).json({
          message: "Course Pre-Requisite Incomplete",
          prereqCourse: prereqCourse
            ? prereqCourse.title
            : "prerequisite course",
        });
      }
    }

    // Check if user is already enrolled in the course
    const existingEnrollment = await Enrollment.findOne({
      user_id: user_id,
      course_id: course_id,
    });

    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "User is already enrolled in this course" });
    }

    // Create a new enrollment
    const newEnrollment = new Enrollment({
      user_id: user_id,
      course_id: course_id,
      date_enrolled: new Date(),
    });

    await newEnrollment.save();

    res
      .status(201)
      .json({ message: "Enrollment successful", enrollment: newEnrollment });
  } catch (error) {
    console.error("Enrollment Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateUserData = async (req, res) => {
  try {
    const user_id = getIdFromCookie(req);
    const name = req.body.name;
    const password = req.body.password;

    // Fetch the user from the database
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if there is something to update
    if (!name && !password) {
      return res
        .status(400)
        .json({ message: "Provide at least one field to update" });
    }

    // Update fields if provided
    if (name) {
      user.name = name;
    }

    if (password) {
      // Ensure the new password is different from the current hashed password
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          message: "New password cannot be the same as the old password",
        });
      }

      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();

    res.status(200).json({ message: "User data updated successfully", user });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getUserData = async (req, res) => {
  try {
    // Get user ID from the decoded token in the middleware
    const userId = req.user.id;

    // Find the user by ID
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user data excluding sensitive information
    res.status(200).json({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token that expires in 1 hour
    const resetToken = jwt.sign({ id: user.user_id }, "verySecretValue", {
      expiresIn: "1h",
    });

    try {
      // Send reset email
      await sendPasswordResetEmail(email, resetToken);
      res.status(200).json({
        message: "Password reset instructions have been sent to your email",
      });
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      res.status(500).json({
        message: "Failed to send reset email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      message: "An error occurred while processing your request",
      error: error.message,
    });
  }
};

exports.setPfp = async (req, res) => {
  try {
    const userID = req.body.user_id;

    // Fetch the user from the database
    const user = await User.findOne({ user_id: userID });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profile_picture = req.body.pfp;
    await user.save();

    res.status(200).json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error("Profile Picture Update request error:", error);
    res.status(500).json({
      message: "An error occurred while processing your request",
      error: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the token
    const decoded = jwt.verify(token, "verySecretValue");
    const user = await User.findOne({ user_id: decoded.id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCurrentCourse = async (req, res) => {
  try {
    const userID = req.body.user_id;
    const enrollment = await Enrollment.findOne({
      user_id: userID,
      status: "Enrolled",
    });

    res.status(200).json(enrollment);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error Fetching Current Course: " + error });
  }
};
