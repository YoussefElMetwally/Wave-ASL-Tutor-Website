const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/recordings');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept video files only
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
  }
});

const { checkLogin, logout } = require("../controllers/authController");
const {
  userLogin,
  userRegister,
  enroll,
  updateUserData,
  getUserData,
} = require("../controllers/userController");
const {
  getCourses,
  getCourseById,
  getCourseBySlug,
} = require("../controllers/courseController");
// const { getPrediction } = require("../controllers/huggingFaceController");
const {
  getLessonQuestions,
  getLessonById,
  getLessons,
<<<<<<< HEAD
  saveRecording,
=======
  createLesson,
>>>>>>> a479feda71c60ab7bea3b3a34125fb53054dd0c2
} = require("../controllers/lessonController");
const {
  getTests,
  getTestById,
  createTestScore,
  getTestScores,
} = require("../controllers/testController");
const {
  // predictStatic,
  // predictDynamic,
  predict,
} = require("../controllers/onnxController");
const {
  incrementCompletedLessons,
} = require("../controllers/enrollmentController");

// User authentication routes
router.post("/api/logout", logout);
router.post("/api/login", userLogin);
router.post("/api/register", userRegister);

// User Routes
router.post("/api/user/enroll", checkLogin, enroll);
router.put("/api/user/updateData", updateUserData);
router.get("/api/user/profile", checkLogin, getUserData);

// Course routes
router.get("/api/courses", checkLogin, getCourses);
router.get("/api/courses/:slug", checkLogin, getCourseBySlug);
router.get("/api/courses/:id", checkLogin, getCourseById);

// Lesson routes
router.get("/api/lessons", checkLogin, getLessons);
router.get("/api/lessons/:id", checkLogin, getLessonById);
router.get("/api/lessons/:id/questions", checkLogin, getLessonQuestions);

// Test routes
router.get("/api/tests", checkLogin, getTests);
router.get("/api/tests/:id", checkLogin, getTestById);
router.get("/api/testScores", checkLogin, getTestScores);
router.post("/api/testScores/create", checkLogin, createTestScore);

// Enrollment routes
router.put("/api/enrollment/increment", checkLogin, incrementCompletedLessons);

// ONNX prediction route
router.post("/api/predict", checkLogin, predict);

// router.post("/api/predict/static", checkLogin, predictStatic);
// router.post("/api/predict/dynamic", checkLogin, predictDynamic);

// database population
router.post("/api/lesson/create", createLesson);
//router.post("/api/test/create", createTest);

// // Hugging Face prediction route
// router.post("/api/predict", checkLogin, getPrediction);

// Save recording route
router.post("/api/save-recording", checkLogin, upload.single('video'), saveRecording);

module.exports = router;
