const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  inventory: {
    fruitScope: [
      {
        fruit: { type: Schema.Types.ObjectId, ref: "shops" },
        scope: { type: String, required: true },
      },
    ],
    tokenScope: { type: String, requured: false },
    waterScope: [
      {
        cans: { type: Schema.Types.ObjectId, ref: "shops" },
        scope: { type: String, required: true },
      },
    ],
    plot: [{ type: Schema.Types.ObjectId, ref: "shops" }],
  },
  specialTask: [{
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    status: { type: Number, required: true },
    coins: { type: String, required: true },
    max: { type: Number, required: true }, // Maximum value for progress
    href: { type: String, required: false },
    claimed: { type: Boolean, default: false },
  }],
  dailyTask: [{
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    status: { type: Number, default: 0 }, // 0 = incomplete, 1 = complete
    coins: { type: String, required: true }, // Reward for task completion
    max: { type: Number, required: true }, // Maximum value for progress
    href: { type: String, required: false },
    claimed: { type: Boolean, default: false },
  }],
  lastReset: { type: Date, default: Date.now },
  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = User = mongoose.model("users", UserSchema);
