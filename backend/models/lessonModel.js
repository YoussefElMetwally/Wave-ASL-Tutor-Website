const mongoose = require("mongoose");
const moment = require("moment");

const lessonSchema = new mongoose.Schema({
  lesson_id: { type: String, unique: true },
  title: { type: String, required: true },
  videos: [{ type: String }],
  answers: [{ type: String }],
  questions: [{ type: mongoose.Schema.Types.String, ref: "question" }], // References Question IDs
});

lessonSchema.pre("save", async function (next) {
  const lesson = this;

  if (lesson.isNew) {
    try {
      const lastLesson = await mongoose
        .model("lesson")
        .findOne()
        .sort({ lesson_id: -1 });
      let lastIdNumber = 0;

      if (lastLesson && lastLesson.lesson_id) {
        lastIdNumber = parseInt(lastLesson.lesson_id.split("-")[1], 10);
      }

      const newIdNumber = (lastIdNumber + 1).toString().padStart(10, "0");
      lesson.lesson_id = `Lesson-${newIdNumber}`;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

let Lesson = mongoose.model("lesson", lessonSchema);

module.exports = Lesson;
