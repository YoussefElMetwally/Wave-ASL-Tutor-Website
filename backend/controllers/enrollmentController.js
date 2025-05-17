const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");

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

    // Initialize completed_lessons_id if it doesn't exist
    if (!enrollment.completed_lessons_id) {
      enrollment.completed_lessons_id = [];
    }

    // Check if this lesson has already been completed
    const lessonAlreadyCompleted =
      enrollment.completed_lessons_id.includes(lesson_id);

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

    // Step 5: Update user streak if a new lesson was completed
    if (!lessonAlreadyCompleted) {
      await updateUserStreak(user_id);
    }

    // Step 6: Save changes
    await enrollment.save();

    // Get updated user information including streak
    const user = await User.findOne({ user_id });
    const streakInfo = {
      current_streak: user.current_streak,
      max_streak: user.max_streak
    };

    res.status(200).json({
      message: "Completed lessons updated successfully",
      progress: enrollment.progress_percentage,
      lessonWasCounted: !lessonAlreadyCompleted,
      streak: streakInfo
    });
  } catch (error) {
    console.error("Error updating completed lessons:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Helper function to update user streak
async function updateUserStreak(user_id) {
  try {
    const user = await User.findOne({ user_id });
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if streak was already updated today
    if (user.streak_updated_today) {
      const lastActivityDate = new Date(user.last_activity_date);
      const lastActivityDay = new Date(
        lastActivityDate.getFullYear(),
        lastActivityDate.getMonth(),
        lastActivityDate.getDate()
      );
      
      // If already updated today, just return
      if (today.getTime() === lastActivityDay.getTime()) {
        return;
      }
    }
    
    if (!user.last_activity_date) {
      // First activity - start streak at 1
      user.current_streak = 1;
      user.max_streak = 1;
    } else {
      const lastActivityDate = new Date(user.last_activity_date);
      const lastActivityDay = new Date(
        lastActivityDate.getFullYear(),
        lastActivityDate.getMonth(),
        lastActivityDate.getDate()
      );
      
      // Calculate the difference in days
      const timeDiff = today.getTime() - lastActivityDay.getTime();
      const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      if (dayDiff === 1) {
        // Activity on consecutive day - increment streak
        user.current_streak += 1;
        if (user.current_streak > user.max_streak) {
          user.max_streak = user.current_streak;
        }
      } else if (dayDiff === 0) {
        // Already counted for today
        return;
      } else {
        // Streak broken - reset to 1
        user.current_streak = 1;
      }
    }
    
    // Update user's last activity date and mark as updated today
    user.last_activity_date = now;
    user.streak_updated_today = true;
    
    // Save user with updated streak
    await user.save();
    
    // Schedule reset of streak_updated_today flag for midnight
    scheduleStreakFlagReset(user_id);
    
  } catch (error) {
    console.error("Error updating user streak:", error);
  }
}

// Reset the streak_updated_today flag at midnight
function scheduleStreakFlagReset(user_id) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(async () => {
    try {
      const user = await User.findOne({ user_id });
      if (user) {
        user.streak_updated_today = false;
        await user.save();
      }
    } catch (error) {
      console.error("Error resetting streak flag:", error);
    }
  }, timeUntilMidnight);
}

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
