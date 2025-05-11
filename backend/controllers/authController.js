const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// exports.checkLogin = (req, res, next) => {
//   if (JSON.stringify(req.cookies) == "{}") {
//     return res.redirect("/views/login");
//   }
//   next();
// };

exports.checkLogin = (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, "verySecretValue", (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

exports.getIdFromCookie = (req) => {
  // Check if token is available in cookies
  if (!req.cookies || !req.cookies.User) {
    // If not in cookies, check if it's in the Authorization header
    if (req.headers && req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, "verySecretValue");
        return decoded.id;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Extract token from cookies
  const token = req.cookies.User;
  try {
    const decoded = jwt.verify(token, "verySecretValue");
    return decoded.id;
  } catch (error) {
    return null;
  }
};

exports.logout = (req, res) => {
  res.clearCookie("User");
  res.json({ message: "Logged out successfully" });
};

// Email Service

// Check if email configuration is set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "Email configuration is missing. Please set EMAIL_USER and EMAIL_PASS in your .env file"
  );
}

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

exports.sendPasswordResetEmail = async (email, resetToken) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email configuration is missing");
  }

  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your Wave! account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #00aaff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
      ">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Propagate the error to be handled by the controller
  }
};

// Middleware to check if a user is enrolled in a course
exports.checkEnrollment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseSlug = req.params.slug;
    
    // First, find the course by slug
    const course = await require('../models/courseModel').findOne({
      title: { $regex: new RegExp(courseSlug.replace(/-/g, " "), "i") },
    });
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if user is enrolled in this course
    const enrollment = await require('../models/enrollmentModel').findOne({
      user_id: userId,
      course_id: course.course_id
    });
    
    if (!enrollment) {
      return res.status(403).json({ 
        message: "Access denied",
        error: "You are not enrolled in this course"
      });
    }
    
    // User is enrolled, proceed to the next middleware
    next();
  } catch (error) {
    console.error("Enrollment check error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Middleware to check if a user is enrolled in a course for lesson access
exports.checkLessonAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseSlug = req.params.courseSlug;
    
    // First, find the course by slug
    const course = await require('../models/courseModel').findOne({
      title: { $regex: new RegExp(courseSlug.replace(/-/g, " "), "i") },
    });
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if user is enrolled in this course
    const enrollment = await require('../models/enrollmentModel').findOne({
      user_id: userId,
      course_id: course.course_id
    });
    
    if (!enrollment) {
      return res.status(403).json({ 
        message: "Access denied",
        error: "You are not enrolled in this course" 
      });
    }
    
    // Add course info to request for potential later use
    req.course = course;
    
    // User is enrolled, proceed to the next middleware
    next();
  } catch (error) {
    console.error("Lesson access check error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
