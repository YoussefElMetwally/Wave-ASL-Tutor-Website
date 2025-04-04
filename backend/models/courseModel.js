const mongoose = require("mongoose");
const moment = require("moment");

const courseSchema = new mongoose.Schema({
  course_id: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  level: { type: String, default: "A1" },
  lessons: [{ type: mongoose.Schema.Types.String, ref: "lesson" }],
  tests: [{ type: mongoose.Schema.Types.String, ref: "test" }],
});

courseSchema.pre("save", async function (next) {
  const course = this;

  if (course.isNew) {
    try {
      const lastCourse = await mongoose
        .model("course")
        .findOne()
        .sort({ course_id: -1 });
      let lastIdNumber = 0;

      if (lastCourse && lastCourse.course_id) {
        lastIdNumber = parseInt(lastCourse.course_id.split("-")[1], 10);
      }

      const newIdNumber = (lastIdNumber + 1).toString().padStart(10, "0");
      course.course_id = `Course-${newIdNumber}`;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

let Course = mongoose.model("course", courseSchema);

module.exports = Course;
