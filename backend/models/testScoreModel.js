const mongoose = require("mongoose");

const testScoreSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    your_score: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const TestScore = mongoose.model("testScore", testScoreSchema);

module.exports = TestScore;
