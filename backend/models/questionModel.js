const mongoose = require("mongoose");
const moment = require("moment");

const questionSchema = new mongoose.Schema({
  question_id: { type: String, unique: true },
  question: { type: String, required: true },
  image_url: { type: String }, // URL to the image of the ASL sign
  mcq: { type: [String], default: [] }, // Array of options for MCQ
  answer: { type: String, required: true },
  type: { type: String, enum: ["MCQ", "Text", "Image-MCQ"], required: true }, // Type of question
});

questionSchema.pre("save", async function (next) {
  const question = this;

  if (question.isNew) {
    try {
      const lastQuestion = await mongoose
        .model("question")
        .findOne()
        .sort({ question_id: -1 });
      let lastIdNumber = 0;

      if (lastQuestion && lastQuestion.question_id) {
        lastIdNumber = parseInt(lastQuestion.question_id.split("-")[1], 10);
      }

      const newIdNumber = (lastIdNumber + 1).toString().padStart(10, "0");
      question.question_id = `Question-${newIdNumber}`;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

let Question = mongoose.model("question", questionSchema);

module.exports = Question;
