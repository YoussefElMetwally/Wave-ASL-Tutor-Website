const Lesson = require("../models/lessonModel");
const Question = require("../models/questionModel");
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
    const lessonId = req.params.id;
    console.log("Fetching lesson with ID:", lessonId);

    const lesson = await Lesson.findOne({ lesson_id: lessonId });
    if (!lesson) {
      console.log("Lesson not found");
      return res.status(404).json({ message: "Lesson not found" });
    }

    console.log("Found lesson:", lesson);
    res.status(200).json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    res.status(500).json({ message: "Error fetching lesson" });
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

<<<<<<< HEAD
exports.saveRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const userId = req.user.user_id;
    const lessonId = req.body.lessonId;
    const sign = req.body.sign;

    res.status(200).json({
      message: 'Recording saved successfully',
      filePath: `/uploads/recordings/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error saving recording:', error);
    res.status(500).json({ error: 'Failed to save recording' });
  }
=======
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
>>>>>>> a479feda71c60ab7bea3b3a34125fb53054dd0c2
};
