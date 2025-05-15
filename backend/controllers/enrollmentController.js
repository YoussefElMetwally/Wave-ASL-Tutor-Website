const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

exports.incrementCompletedLessons = async (req, res) => {
  try {
    const user_id = req.body.user_id;
    const course_id = req.body.course_id;
    const lesson_id = req.body.lesson_id;

    // Step 1: Find enrollment
    const enrollment = await Enrollment.findOne({ user_id, course_id });
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Initialize completedLessonsArray if it doesn't exist
    if (!enrollment.completed_lessons_id) {
      enrollment.completed_lessons_id = [];
    }

    // Check if this lesson has already been completed
    const lessonAlreadyCompleted = enrollment.completed_lessons_id.includes(lesson_id);
    
    // Only increment and add to the array if the lesson hasn't been completed before
    if (!lessonAlreadyCompleted) {
      // Step 2: Increment completed lessons
      enrollment.completed_lessons += 1;
      enrollment.completed_lessons_id.push(lesson_id);
    }

    // Step 3: Get course data
    const course = await Course.findOne({ course_id });
    if (!course) {
      throw new Error("Course not found");
    }

    const totalLessons = course.lessons?.length || 0;
    const totalTests = course.tests?.length || 0;
    const totalItems = totalLessons + totalTests;

    const completed =
      (enrollment.completed_lessons || 0) + (enrollment.completed_tests || 0);
    enrollment.progress_percentage =
      totalItems > 0 ? (completed / totalItems) * 100 : 0;

    // Step 4: Check for course completion
    if (enrollment.progress_percentage >= 100) {
      enrollment.status = "Completed";
      enrollment.completion_date = new Date();
    }

    // Step 5: Save changes
    await enrollment.save();

    res.status(200).json({
      message: "Completed lessons updated successfully",
      progress: enrollment.progress_percentage,
      lessonWasCounted: !lessonAlreadyCompleted
    });
  } catch (error) {
    console.error("Error updating completed lessons:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getEnrollments = async (req, res) => {
  try {
    // Get user ID from the decoded token in the middleware
    const userId = req.user.id;
    console.log("Getting enrollments for user:", userId);

    const userEnrollments = await Enrollment.find({ user_id: userId });
    console.log("Found enrollments:", userEnrollments);

    res.status(200).json(userEnrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching enrolled courses." });
  }
};
