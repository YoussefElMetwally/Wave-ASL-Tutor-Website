const Course = require("../models/courseModel");
const Question = require("../models/questionModel");
const Test = require("../models/testModel");
const TestScore = require("../models/testScoreModel");
const Enrollment = require("../models/enrollmentModel");

// Generate a quiz for a course
exports.getCourseQuiz = async (req, res) => {
  try {
    const { courseSlug } = req.params;
    const user_id = req.user.id;
    
    console.log("Searching for course with slug:", courseSlug);

    // Find the course
    const course = await Course.findOne({
      title: { $regex: new RegExp(courseSlug.replace(/-/g, " "), "i") }
    });
    
    if (!course) {
      console.log("Course not found for slug:", courseSlug);
      return res.status(404).json({ message: "Course not found" });
    }
    
    console.log("Found course:", course.title, "with ID:", course.course_id);

    // Check if user is enrolled and has completed all lessons
    console.log("Checking enrollment for user:", user_id, "in course:", course.course_id);
    const enrollment = await Enrollment.findOne({ 
      user_id, 
      course_id: course.course_id 
    });
    
    console.log("Enrollment found:", enrollment ? "Yes" : "No");

    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Check if course is already completed
    if (enrollment.status === "Completed") {
      return res.status(200).json({ 
        message: "You have already completed this course",
        completed: true
      });
    }

    // Check if all lessons are completed
    const totalLessons = course.lessons?.length || 0;
    if (enrollment.completed_lessons < totalLessons) {
      return res.status(403).json({ 
        message: "You need to complete all lessons before taking the quiz",
        completed_lessons: enrollment.completed_lessons,
        total_lessons: totalLessons
      });
    }

    // Check if there's an existing test for this course
    let test = null;
    if (course.tests && course.tests.length > 0) {
      // Use existing test
      test = await Test.findOne({ test_id: course.tests[0] });
      
      if (test) {
        // Fetch questions for the test
        const questions = await Promise.all(
          test.questions.map(qId => Question.findOne({ question_id: qId }))
        );
        
        // Return the quiz
        return res.status(200).json({
          test_id: test.test_id,
          title: test.title,
          questions: questions.map(q => ({
            question_id: q.question_id,
            question: q.question,
            mcq: q.mcq,
            image_url: q.image_url,
            type: q.type
            // Don't send the answer to frontend!
          }))
        });
      }
    }

    // If no test exists, create a dummy test with generic questions
    // In a real implementation, you would have actual course-specific questions
    const dummyQuestions = generateDummyQuestions(courseSlug);
    
    // Create and save the questions
    const savedQuestions = [];
    for (const q of dummyQuestions) {
      const question = new Question({
        question: q.question,
        mcq: q.options,
        answer: q.answer,
        type: q.type || "MCQ",
        image_url: q.image_url || null
      });
      
      await question.save();
      savedQuestions.push(question);
    }
    
    // Create and save the test
    test = new Test({
      title: `${course.title} Completion Quiz`,
      max_score: savedQuestions.length,
      questions: savedQuestions.map(q => q.question_id)
    });
    
    await test.save();
    
    // Add test to course
    if (!course.tests) {
      course.tests = [];
    }
    course.tests.push(test.test_id);
    await course.save();
    
    // Return the quiz
    return res.status(200).json({
      test_id: test.test_id,
      title: test.title,
      questions: savedQuestions.map(q => ({
        question_id: q.question_id,
        question: q.question,
        mcq: q.mcq,
        image_url: q.image_url,
        type: q.type
        // Don't send the answer to frontend!
      }))
    });
    
  } catch (error) {
    console.error("Error getting course quiz:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Submit quiz answers
exports.submitCourseQuiz = async (req, res) => {
  try {
    const { courseSlug } = req.params;
    const { answers } = req.body;
    const user_id = req.user.id;
    
    console.log("Searching for course with slug for quiz submission:", courseSlug);
    console.log("Received answers:", JSON.stringify(answers));
    console.log("User ID:", user_id);

    // Find the course
    const course = await Course.findOne({
      title: { $regex: new RegExp(courseSlug.replace(/-/g, " "), "i") }
    });
    
    if (!course) {
      console.log("Course not found for quiz submission, slug:", courseSlug);
      return res.status(404).json({ message: "Course not found" });
    }
    
    console.log("Found course for quiz submission:", course.title, "with ID:", course.course_id);

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({ 
      user_id, 
      course_id: course.course_id 
    });

    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Get the test
    if (!course.tests || course.tests.length === 0) {
      console.log("No tests found for course:", course.title);
      return res.status(404).json({ message: "No quiz found for this course" });
    }
    
    console.log("Looking for test with ID:", course.tests[0]);
    const test = await Test.findOne({ test_id: course.tests[0] });
    if (!test) {
      console.log("Test not found with ID:", course.tests[0]);
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    console.log("Found test:", test.title);

    // Fetch questions to check answers
    console.log("Looking up questions with IDs:", test.questions);
    const questions = await Promise.all(
      test.questions.map(qId => Question.findOne({ question_id: qId }))
    );
    
    console.log("Found questions:", questions.length);

    // Calculate score
    let score = 0;
    const questionMap = {};
    
    questions.forEach(q => {
      if (q) {
        questionMap[q.question_id] = q;
        console.log("Mapped question:", q.question_id, q.question);
      } else {
        console.log("Warning: Null question found in results");
      }
    });

    console.log("Answer keys in questionMap:", Object.keys(questionMap));
    console.log("Answer keys submitted:", Object.keys(answers));

    for (const [questionId, answer] of Object.entries(answers)) {
      console.log(`Checking answer for ${questionId}: submitted "${answer}"`);
      if (questionMap[questionId]) {
        console.log(`  Correct answer is: "${questionMap[questionId].answer}"`);
        if (questionMap[questionId].answer === answer) {
          console.log("  ✓ CORRECT");
          score++;
        } else {
          console.log("  ✗ INCORRECT");
        }
      } else {
        console.log("  ! Question not found in map");
      }
    }
    
    console.log(`Final score: ${score}/${questions.length}`);

    // Save the test score
    console.log("Creating TestScore with user_id:", user_id);
    console.log("Test _id:", test._id);
    
    try {
      const testScore = new TestScore({
        user_id,
        test_id: test._id,
        your_score: score
      });
      
      console.log("TestScore object created:", testScore);
      await testScore.save();
      console.log("TestScore saved successfully");
    } catch (saveError) {
      console.error("Error saving test score:", saveError);
      // Continue execution even if test score save fails
    }

    // Update enrollment if passed (4/5 or better)
    const passed = score >= 4; // 80% passing threshold
    
    if (passed) {
      enrollment.status = "Completed";
      enrollment.completion_date = new Date();
      enrollment.completed_tests = (enrollment.completed_tests || 0) + 1;
      
      // Update progress percentage
      const totalItems = (course.lessons?.length || 0) + (course.tests?.length || 0);
      const completed = enrollment.completed_lessons + enrollment.completed_tests;
      enrollment.progress_percentage = totalItems > 0 ? (completed / totalItems) * 100 : 0;
      
      await enrollment.save();
    }

    // Return the results
    res.status(200).json({
      score,
      total: questions.length,
      passed,
      message: passed ? "Congratulations! You passed the quiz." : "You didn't pass the quiz. Try again!"
    });
    
  } catch (error) {
    console.error("Error submitting quiz:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to generate dummy questions based on course name
function generateDummyQuestions(courseSlug) {
  // In a real implementation, you would fetch real questions from a database
  // For now, we'll use dummy questions with ASL sign images
  const courseName = courseSlug.replace(/-/g, " ");
  
  return [
    {
      question: "What ASL sign is shown in this image?",
      image_url: "/images/asl/letter_m.jpg", // Path to image of letter M hand sign
      options: [
        "Letter T",
        "Number 5",
        "Letter M",
        "Letter A"
      ],
      answer: "Letter M",
      type: "Image-MCQ"
    },
    {
      question: "What ASL sign is shown in this image?",
      image_url: "/images/asl/number_5.jpg", // Path to image of number 5 hand sign
      options: [
        "Letter B",
        "Number 5",
        "Letter F",
        "Number 8"
      ],
      answer: "Number 5",
      type: "Image-MCQ"
    },
    {
      question: "What ASL sign is shown in this image?",
      image_url: "/images/asl/letter_a.jpg", // Path to image of letter A hand sign
      options: [
        "Letter A",
        "Number 1",
        "Letter S",
        "Letter T"
      ],
      answer: "Letter A",
      type: "Image-MCQ"
    },
    {
      question: "What ASL sign is shown in this image?",
      image_url: "/images/asl/letter_z.jpg", // Path to image of letter Z hand sign
      options: [
        "Number 7",
        "Letter X",
        "Letter Z",
        "Letter G"
      ],
      answer: "Letter Z",
      type: "Image-MCQ"
    },
    {
      question: "What ASL sign is shown in this image?",
      image_url: "/images/asl/number_10.jpg", // Path to image of number 10 hand sign
      options: [
        "Number 1",
        "Letter L",
        "Number 10",
        "Letter K"
      ],
      answer: "Number 10",
      type: "Image-MCQ"
    }
  ];
} 