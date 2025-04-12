const Lesson = require("../models/lessonModel");
const Question = require("../models/questionModel");

exports.getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ lesson_id: 1 });
    res.status(200).json(lessons);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ lesson_id: req.body.lesson_id });
    if (!lesson) {
      return res.status(400).json({ message: "Lesson not found" });
    }
    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Invalid ID format" });
  }
};

exports.getLessonQuestions = async (req, res) => {
  try {
    const lessonID = req.body;
    const lesson = await Lesson.findOne({ lesson_id: lessonID });

    if (!lesson) {
      return res.status(400).json({ message: "Lesson not found" });
    }

    // Fetch questions manually using question IDs
    const questions = await Question.find({
      question_id: { $in: lesson.questions },
    });

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving lesson questions" });
  }
};

exports.createLesson = (req, res) => {
  let newLesson = new Lesson({
    title: req.body.title,
    videos: req.body.videos,
    answers: req.body.answers,
  });
  newLesson
    .save({ useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log(newLesson);
      res.status(200);
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
    });
};
