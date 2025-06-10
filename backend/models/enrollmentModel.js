const mongoose = require("mongoose");
const moment = require("moment");

const enrollmentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.String, ref: "User", required: true },
  course_id: {
    type: mongoose.Schema.Types.String,
    ref: "Course",
    required: true,
  },
  date_enrolled: { type: Date, default: Date.now },
  completion_date: { type: Date },
  completed_lessons: { type: Number, default: 0 },
  completed_tests: { type: Number, default: 0 },
  completed_lessons_id: [
    { type: mongoose.Schema.Types.String, ref: "lesson", default: [] },
  ],
  progress_percentage: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Enrolled", "Completed"],
    default: "Enrolled",
  },
});

enrollmentSchema.pre("save", async function (next) {
  const course = await mongoose
    .model("course")
    .findOne({ course_id: this.course_id });
  if (course) {
    const total_lessons = course.lessons?.length || 0;
    const total = (course.lessons?.length || 0) + (course.tests?.length || 0);
    const completed =
      (this.completed_lessons || 0) + (this.completed_tests || 0);
    this.progress_percentage =
      total > 0 ? (completed / total) * 100 : 0; // Now correctly includes tests in percentage calculation
  }
  next();
});

let Enrollment = mongoose.model("enrollment", enrollmentSchema);

module.exports = Enrollment;
