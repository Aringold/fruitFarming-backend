const mongoose = require("mongoose");

const specialList = [
  {
    key: new mongoose.Types.ObjectId().toString(),
    title: "Create account on Adsvilla website",
    status: 0,
    coins: "5000",
    href: 'https://adsvilla.net/signup.php',
    max: 1,
    claimed: false,
  },
  {
    key: new mongoose.Types.ObjectId().toString(),
    title: "Join our Telegram channel",
    status: 0,
    coins: "5000",
    href: 'https://t.me/advillage',
    max: 1,
    claimed: false,
  },
  {
    key: new mongoose.Types.ObjectId().toString(),
    title: "Follow us on X",
    status: 0,
    coins: "5000",
    href: 'https://x.com/adsvillanet',
    max: 1,
    claimed: false,
  },
  {
    key: new mongoose.Types.ObjectId().toString(),
    title: "Subscribe to our YouTube Channel",
    status: 0,
    coins: "5000",
    href: 'https://youtube.com/@adsvillaofficial',
    max: 1,
    claimed: false,
  },
];

module.exports = specialList;