const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = new mongoose.Schema({
  user_id: { type: String, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  name: { type: String },
  date_created: { type: Date, default: Date.now },
  profile_picture: {
    type: String,
    default: "../src/profilePictures/default_pfp.jpeg",
  },
  // Streak tracking fields
  current_streak: { type: Number, default: 0 },
  max_streak: { type: Number, default: 0 },
  last_activity_date: { type: Date },
  streak_updated_today: { type: Boolean, default: false }
});

userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isNew) {
    try {
      const lastUser = await mongoose
        .model("user")
        .findOne()
        .sort({ user_id: -1 });
      let lastIdNumber = 0;

      if (lastUser && lastUser.user_id) {
        lastIdNumber = parseInt(lastUser.user_id.split("-")[1], 10);
      }

      const newIdNumber = (lastIdNumber + 1).toString().padStart(10, "0");
      user.user_id = `User-${newIdNumber}`;
    } catch (err) {
      return next(err);
    }
  }

  next();
});

let User = mongoose.model("user", userSchema);

module.exports = User;
