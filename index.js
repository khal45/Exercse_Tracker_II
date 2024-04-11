const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { Schema } = mongoose;
const { model } = mongoose;
mongoose.connect(process.env.MONGO_URI);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
// middleware to allow access to the body
app.use(express.urlencoded({ extended: true }));
// I think we will need a user model and an exercise model

// create a user schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

// create an exercise schema
const exerciseSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  date: Date,
  duration: Number,
  description: String,
});

const User = model("User", userSchema);
const Exercise = model("Exercise", exerciseSchema);

// post request to /api/users

app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  try {
    let userObj = new User({
      name: username,
    });
    let user = await userObj.save();
    // get user's id
    const { _id } = user;
    const { name } = user;

    res.json({ username: name, _id: _id.toString() });
  } catch (err) {
    console.log(err);
  }
});

// post request to /api/users/:_id/exercises

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;
    // find the user
    const user = await User.findById(_id);

    const exerciseObj = new Exercise({
      user_id: _id,
      date: date ? new Date(date) : new Date(),
      duration,
      description,
    });

    const exercise = await exerciseObj.save();
    res.json({
      _id: user._id,
      username: user.name,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description,
    });
  } catch (err) {
    console.log(err);
  }
});

// get request to /api/users

app.get("/api/users", async (req, res) => {
  try {
    const result = await User.find({}, { __v: 0 });
    // map through 'result' to return desired result
    const updatedUsers = result.map((user) => {
      return { _id: user._id.toString(), username: user.name };
    });
    res.send(updatedUsers);
  } catch (err) {
    console.log(err);
  }
});

// figure out the log logic
// get the basic structure
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    // get the id from the params
    const { _id } = req.params;

    let dateObj = {};
    if (from) {
      dateObj["$gte"] = new Date(from);
    }
    if (to) {
      dateObj["$lte"] = new Date(to);
    }
    let filter = {
      user_id: _id,
    };
    if (from || to) {
      filter.date = dateObj;
    }

    // console.log(from, to, limit);
    // search for the user and get the neccesary info
    const user = await User.findById(_id);
    // get the count
    // const exercises = await Exercise.find(
    //   { user_id: _id },
    //   { __v: 0, _id: 0, user_id: 0 }
    // ).limit(+limit ?? 500);
    // const count = await Exercise.countDocuments({ user_id: _id });
    const exercises = await Exercise.find(filter).limit(+limit ?? 500);
    // console.log(exercises);
    // return only description, duration, date for the log
    const filteredExercise = exercises.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      };
    });

    // console.log(filteredExercise);

    res.json({
      _id: user._id,
      username: user.name,
      count: exercises.length,
      log: filteredExercise,
    });
  } catch (err) {
    console.log(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
