const Course = require("../models/courseModel");
const Enrollment = require("../models/enrollmentModel");
const Lesson = require("../models/lessonModel");

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

exports.getCourseBySlug = async (req, res) => {
  try {
    const courseSlug = req.params.slug;
    console.log("Fetching course with slug:", courseSlug);

    const course = await Course.findOne({
      title: { $regex: new RegExp(courseSlug.replace(/-/g, " "), "i") },
    });

    if (!course) {
      console.log("Course not found");
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Found course:", course);
    console.log("Course lessons array:", course.lessons);

    // Fetch lessons using the lesson IDs from the course
    const lessons = await Lesson.find({
      lesson_id: { $in: course.lessons },
    });
    console.log("Fetched lessons:", lessons);

    // Add lesson data to the course object
    const courseWithLessons = {
      ...course.toObject(),
      lessons: lessons.map((lesson) => ({
        id: lesson.lesson_id,
        title: lesson.title,
        video: lesson.video,
        questions: lesson.questions,
        completed: false, // You can add this based on user progress
      })),
    };

    res.status(200).json(courseWithLessons);
  } catch (error) {
    console.error("Error fetching course by slug:", error);
    res.status(500).json({ message: "Error fetching course" });
  }
};
