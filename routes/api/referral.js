const express = require("express");
const router = express.Router();
const passport = require("passport");

const Shop = require("../../modules/Shop");
const User = require("../../modules/User");

router.get('/link', passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }
    return res.status(200).json({userid: user.name})
  } catch (error) {
    
  }
}) 

module.exports = router;