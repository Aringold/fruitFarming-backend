const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const mongoose = require("mongoose");
// Load Input
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load user modal
const User = require("../../modules/User");
const Shop = require("../../modules/Shop");
const LandData = require("../../modules/LandData");
const makeScopeList = require('../../utils/makeScopeList');
const specialList = require('../../utils/specialList');
const dailyList = require('../../utils/dailyList');

// @route   POST api/users/register
// @desc    Register route
// @access  Public
router.post("/register", (req, res) => {
  User.findOne({ name: req.body.name }).then(user => {
    if (user) {
      return res.status(409).json({ message: "Name already exists" });
    } else {
      Shop.findOne()
        .then(shop => {
          const plot = shop.plot.find(plot => plot.level === "1");
          const fruit = shop.seedings.find(seedings => seedings.fruit === "strawberry");
          const cans = shop.cans.find(cans => cans.level === "1");
          const inventory = {
            tokenScope: '0',
            waterScope: [{cans: cans._id, scope: '3'}],
            plot: [plot._id],
            fruitScope: [{fruit: fruit._id, scope: '1'}]
          }
          const newUser = new User({
            name: req.body.name,
            fullname: req.body.fullname,
            inventory: inventory,
            specialTask: specialList.map(task => ({
              ...task,
              key: new mongoose.Types.ObjectId().toString(), // Always generate unique keys
            })),
            dailyTask: dailyList.map(task => ({
              ...task,
              key: new mongoose.Types.ObjectId().toString(), // Always generate unique keys
            })),
          });
          newUser
            .save()
            .then(user =>{
              res.status(201).json({ user: user.name, fullname: user.fullname })})
            .catch(err => console.warn(err));
        })
    }
  });
});

//@route    POST api/users/check
// @desc    Register route
// @access  Public
router.post("/check", (req, res) => {
  const userName = req.body.name;

  if (!userName) {
    return res.status(400).json({ message: "Name is required" });
  }

  User.findOne({ name: userName })
    .then(user => {
      if (user) {
        return res.status(200).json({ message: "User is already registered" });
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    })
    .catch(err => {
      console.error("Error finding user:", err);
      res.status(500).json({ message: "Error checking user status" });
    });
});

// @route   POST api/users/login
// @desc    Login User/ Return JWT
// @access  Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const name = req.body.name;
  User.findOne({ name }).then(user => {
    if (!user) {
      errors.name = "User not found";
      return res.status(404).json(errors);
    }
    if (user) {
      const payLoad = { id: user.id, name: user.name, fullname: user.fullname }; // Create JWT payload
      jwt.sign( payLoad, keys.secretOrKey, { expiresIn: '1h' }, (err, token) => {
        res.json({
          success: true,
          token: "Bearer " + token,
          scopeList: makeScopeList(user)
        });
      });
    } else {
      errors.password = "Password incorrect";
      return res.status(400).json(errors);
    }
  });
});

// @route   POST api/users/refresh
// @desc    Return JWT
// @access  Public
router.post("/refresh", async (req, res) => {
  let authToken = req.headers.authorization;
  if (!authToken && req.body.token) {
    authToken = req.body.token;
  }

  if (!authToken) {
    return res.status(400).json({ error: 'No authorization token provided' });
  }

  const token = authToken.split(' ')[1]; 

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    jwt.verify(token, keys.secretOrKey, (err, decode) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      const newPayload = { id: decode.id, name: decode.name };
      const newAccessToken = jwt.sign(newPayload, keys.secretOrKey, { expiresIn: '1h' });
  
      res.json({
        token: "Bearer " + newAccessToken,
      });
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});


module.exports = router;
