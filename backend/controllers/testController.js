const Test = require("../models/testModel");
const TestScore = require("../models/testScoreModel");

exports.getTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ test_id: 1 });
    res.status(200).json(tests);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findOne({ test_id: req.body.test_id });
    if (!test) {
      return res.status(400).json({ message: "Test not found" });
    }
    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: "Invalid ID format" });
  }
};

exports.createTestScore = async (req, res) => {
  try {
    const test_id = req.body.test_id;
    const your_score = req.body.your_score;
    const user_id = getIdFromCookie(req);

    if (!test_id || your_score === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new test score entry
    const testScore = new TestScore({ user_id, test_id, your_score });
    await testScore.save();

    res
      .status(201)
      .json({ message: "Test score added successfully", testScore });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTestScores = async (req, res) => {
  try {
    const user_id = getIdFromCookie(req);

    const scores = await TestScore.find({ user_id }).populate(
      "test_id",
      "name"
    );

    res.status(200).json({ scores });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
