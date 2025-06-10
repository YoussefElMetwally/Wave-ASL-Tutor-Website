const express = require("express");
const router = express.Router();

const {
  checkLogin,
  logout,
  checkEnrollment,
  checkLessonAccess,
} = require("../controllers/authController");
const {
  userLogin,
  userRegister,
  enroll,
  updateUserData,
  getUserData,
  requestPasswordReset,
  resetPassword,
  getCurrentCourse,
  setPfp,
  getUserStreak,
} = require("../controllers/userController");
const {
  getCourses,
  getCourseById,
  getCourseBySlug,
} = require("../controllers/courseController");
const {
  getLessonQuestions,
  getLessonById,
  getLessons,
  createLesson,
} = require("../controllers/lessonController");
const {
  getTests,
  getTestById,
  createTestScore,
  getTestScores,
} = require("../controllers/testController");
const {
  getCourseQuiz,
  submitCourseQuiz,
} = require("../controllers/quizController");
const { classify } = require("../controllers/onnxController");
const {
  incrementCompletedLessons,
  getEnrollments,
} = require("../controllers/enrollmentController");
const { TTS } = require("../controllers/huggingfaceController");

// User authentication routes
router.post("/api/logout", logout);
router.post("/api/login", userLogin);
router.post("/api/register", userRegister);
router.post("/api/request-password-reset", requestPasswordReset);
router.post("/api/reset-password", resetPassword);

// User Routes
router.post("/api/user/enroll", checkLogin, enroll);
router.put("/api/user/updateData", updateUserData);
router.get("/api/user/profile", checkLogin, getUserData);
router.get("/api/user/getCurrentCourse", checkLogin, getCurrentCourse);
router.post("/api/user/setPfp", checkLogin, setPfp);
router.get("/api/user/streak", checkLogin, getUserStreak);

// Enrollement routes
router.get("/api/enrollment/getEnrollments", checkLogin, getEnrollments);
router.post("/api/enrollment/increment", checkLogin, incrementCompletedLessons);

// Course routes
router.get("/api/courses", checkLogin, getCourses);
router.get("/api/courses/:slug", checkLogin, checkEnrollment, getCourseBySlug);
router.get("/api/courses/:id", checkLogin, getCourseById);

// Lesson routes
router.get("/api/lessons", checkLogin, getLessons);
router.get("/api/lessons/:id", checkLogin, getLessonById);
router.get("/api/lessons/:id/questions", checkLogin, getLessonQuestions);
router.get(
  "/api/courses/:courseSlug/lessons/:id",
  checkLogin,
  checkLessonAccess,
  getLessonById
);

// Test routes
router.get("/api/tests", checkLogin, getTests);
router.get("/api/tests/:id", checkLogin, getTestById);
router.post("/api/testScores/create", checkLogin, createTestScore);
router.get("/api/testScores", checkLogin, getTestScores);

// Course quiz routes
router.get("/api/courses/:courseSlug/quiz", checkLogin, getCourseQuiz); // Temporarily removed checkEnrollment
router.post("/api/courses/:courseSlug/quiz/submit", checkLogin, submitCourseQuiz); // Temporarily removed checkEnrollment

// ONNX prediction route
router.post("/api/classify", checkLogin, classify);

// database population
router.post("/api/lesson/create", createLesson);
//router.post("/api/test/create", createTest);

// huggingface routes
router.post("/api/aslts", checkLogin, TTS);

module.exports = router;
