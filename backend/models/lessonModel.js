const mongoose = require("mongoose");
const moment = require("moment");

const lessonSchema = new mongoose.Schema({
  lesson_id: { type: String, unique: true },
  title: { type: String, required: true },
  videos: [{ type: String }],
  answers: [{ type: String }],
  model_path: {
    type: String,
    required: true,
    default: process.env.DYNAMIC_PATH,
  },
  model_labels: [
    {
      type: String,
      required: true,
      default: [
        "Number 0",
        "Number 1",
        "Number 2",
        "Number 3",
        "Number 4",
        "Number 5",
        "Number 6",
        "Number 7",
        "Number 8",
        "Number 9",
        "Number 10",
        "Number 11",
        "Number 12",
        "Number 13",
        "Number 14",
        "Number 15",
        "Number 16",
        "Number 17",
        "Number 18",
        "Number 19",
        "Number 20",
        "Letter A",
        "Letter B",
        "Letter C",
        "Letter D",
        "Letter E",
        "Letter F",
        "Letter G",
        "Letter H",
        "Letter I",
        "Letter J",
        "Letter K",
        "Letter L",
        "Letter M",
        "Letter N",
        "Letter O",
        "Letter P",
        "Letter Q",
        "Letter R",
        "Letter S",
        "Letter T",
        "Letter U",
        "Letter V",
        "Letter W",
        "Letter X",
        "Letter Y",
        "Letter Z",
      ],
    },
  ],
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
