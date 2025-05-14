const mongoose = require("mongoose");

const dailyList = [
  {
    key: new mongoose.Types.ObjectId().toString(),
    title: "Check-in to your Adsvilla account",
    status: 0,
    max: 1,
    coins: "500",
    href: 'https://adsvilla.net',
    claimed: false,
  },
  {
    key: new mongoose.Types.ObjectId().toString(),
    title: "Watch an Ads",
    status: 0,
    max: 10,
    coins: "500",
    href: '',
    claimed: false,
  },
];

module.exports = dailyList;