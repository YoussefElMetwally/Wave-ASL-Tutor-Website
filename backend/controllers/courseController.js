const Course = require("../models/courseModel");

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ course_id: 1 });
    res.status(200).json(courses);
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
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: "Invalid ID format" });
  }
};
