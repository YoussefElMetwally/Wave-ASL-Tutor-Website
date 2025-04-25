const Lesson = require("../models/lessonModel");
const Question = require("../models/questionModel");
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

exports.saveRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const userId = req.user.user_id;
    const lessonId = req.body.lessonId;
    const sign = req.body.sign;
    
    // Here you can process the video data directly from memory
    // The video data is available in req.file.buffer
    
    // Process video data here - for example, you might:
    // 1. Send it to a video processing service
    // 2. Analyze it directly
    // 3. Stream it to another storage service
    
    res.status(200).json({
      message: 'Recording processed successfully',
      videoSize: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('Error processing recording:', error);
    res.status(500).json({ error: 'Failed to process recording' });
  }
};
