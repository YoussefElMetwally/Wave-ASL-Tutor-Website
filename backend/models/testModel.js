const mongoose = require("mongoose");
const moment = require("moment");

const testSchema = new mongoose.Schema({
  test_ID: { type: String, unique: true },
  title: { type: String, required: true },
  max_score: { type: Number, required: true },
  questions: [{ type: mongoose.Schema.Types.String, ref: "question" }], // References Question IDs
});

testSchema.pre("save", async function (next) {
  const test = this;

  if (test.isNew) {
    try {
      const lastTest = await mongoose
        .model("test")
        .findOne()
        .sort({ test_id: -1 });
      let lastIdNumber = 0;

      if (lastTest && lastTest.test_id) {
        lastIdNumber = parseInt(lastTest.test_id.split("-")[1], 10);
      }

      const newIdNumber = (lastIdNumber + 1).toString().padStart(10, "0");
      test.test_id = `Test-${newIdNumber}`;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

let Test = mongoose.model("test", testSchema);

module.exports = Test;
