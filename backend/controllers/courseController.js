const Course = require("../models/courseModel");
const Enrollment = require("../models/enrollmentModel");

const calculateUserProgress = async (userId, courseId) => {
  try {
    const enrollment = await Enrollment.findOne({
      user_id: userId,
      course_id: courseId,
    });

    return enrollment ? enrollment.progress_percentage : 0;
  } catch (error) {
    console.error("Error calculating progress:", error);
    return 0;
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ course_id: 1 }).lean();

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const progress = await calculateUserProgress(
          req.user.id,
          course.course_id
        );
        return {
          ...course,
          progress,
        };
      })
    );

    res.status(200).json(coursesWithProgress);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findOne({ course_id: req.body.course_id });
    if (!course) {
      return res.status(400).json({ message: "Course not found" });
    }

    if (req.user) {
      const progress = await calculateUserProgress(
        req.user.id,
        course.course_id
      );
      course.progress = progress;
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: "Invalid ID format" });
  }
};
