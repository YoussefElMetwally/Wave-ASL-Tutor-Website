const Test = require("../models/testModel");

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
