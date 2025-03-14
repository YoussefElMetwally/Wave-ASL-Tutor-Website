const express = require("express");
const router = express.Router();

const { checkLogin, logout } = require("../controllers/authController");
const { userLogin, userRegister } = require("../controllers/userController");
const {
  getCourses,
  getCourseById,
} = require("../controllers/courseController");
const { getPrediction } = require("../controllers/huggingFaceController");
const {
  getLessonQuestions,
  getLessonById,
  getLessons,
} = require("../controllers/lessonController");
const { getTests, getTestById } = require("../controllers/testController");

// User authentication routes
router.post("/api/logout", logout);
router.post("/api/login", userLogin);
router.post("/api/register", userRegister);

// Course routes
router.get("/api/courses", checkLogin, getCourses);
router.get("/api/courses/:id", checkLogin, getCourseById);

// Lesson routes
router.get("/api/lessons", checkLogin, getLessons);
router.get("/api/lessons/:id", checkLogin, getLessonById);
router.get("/api/lessons/:id/questions", checkLogin, getLessonQuestions);

// Test routes
router.get("/api/tests", checkLogin, getTests);
router.get("/api/tests/:id", checkLogin, getTestById);

// Hugging Face prediction route
router.post("/api/predict", checkLogin, getPrediction);

module.exports = router;
