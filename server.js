const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");

const users = require("./routes/api/users");
const shops = require("./routes/api/shop");
const inventories = require("./routes/api/inventory");
const bonus = require("./routes/api/bonus");
const landData = require("./routes/api/landData");
const referral = require('./routes/api/referral');
const cron = require("node-cron");
const User = require("./modules/User");

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.raw());
app.use(bodyParser.json());

// app.use(cors({  origin: '*'}));

const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://fruitfarmmer.onrender.com", // Production domain
];
const corsOptions = {
  origin: function (origin, callback) {
    // Check if the incoming origin is in the allowedOrigins array
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies and credentials to be sent with requests
};
app.use(cors(corsOptions));

// DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport Config
require("./config/passport")(passport);

// Use routes
app.use("/api/users", users);
app.use("/api/shops", shops);
app.use("/api/inventories", inventories);
app.use("/api/bonus", bonus);
app.use("/api/landData", landData);
app.use("/api/referral", referral);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    message: err,
  });
});

const resetDailyTasks = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Resetting daily tasks...");
    try {
      await User.updateMany(
        {},
        {
          $set: {
            "dailyTask.$[].status": 0,
            "dailyTask.$[].claimed": false,
          },
          $currentDate: { lastReset: true },
        }
      );
      console.log("Daily tasks reset successfully!");
    } catch (error) {
      console.error("Error resetting daily tasks:", error);
    }
  });
};

resetDailyTasks();

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
