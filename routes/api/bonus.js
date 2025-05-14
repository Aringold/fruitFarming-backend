const express = require("express");
const router = express.Router();
const passport = require("passport");
// const cookieParser = require('cookie-parser');
const axios = require('axios');
const Shop = require("../../modules/Shop");
const User = require("../../modules/User");
const makeScopeList = require("../../utils/makeScopeList");
const keys = require("../../config/keys");
const { TwitterApi } = require('twitter-api-v2');
const dailyList = require('../../utils/dailyList');

// 2 hours in milliseconds
const BONUS_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Example bonuses, could be anything like coins, gems, etc.
const BONUSES = {
  bonus_1: { amount: 10, description: '10 coins' },
  bonus_2: { amount: 5, description: '5 gems' },
  bonus_3: { amount: 1, description: '1 special item' },
};

// router.use(cookieParser());

const bonuses = [
  { id: 1, name: '2 Guava', timer: 90, locked: true, claimed: false },
  { id: 2, name: '2 Apple', timer: 90, locked: true, claimed: false },
  { id: 3, name: '2 Guava', timer: 90, locked: true, claimed: false },
  { id: 4, name: '25 Cane', timer: 90, locked: true, claimed: false }
];

// GET route to check bonus eligibility
router.get('/bonus', (req, res) => {
  const lastClaimed = req.cookies.lastClaimed || null;
  const now = Date.now();

  let eligible = false;
  if (lastClaimed) {
    const lastClaimedDate = new Date(lastClaimed).getTime();
    eligible = now - lastClaimedDate > BONUS_INTERVAL;
  } else {
    eligible = true; // Eligible if never claimed before
  }

  res.status(200).json({ eligible, lastClaimed, bonuses: BONUSES });
});

// POST route to claim the bonus
router.post('/claim-bonus', (req, res) => {
  const lastClaimed = req.cookies.lastClaimed || null;
  const now = Date.now();

  if (lastClaimed) {
    const lastClaimedDate = new Date(lastClaimed).getTime();
    if (now - lastClaimedDate < BONUS_INTERVAL) {
      return res.status(400).json({ message: 'Bonus already claimed within the last 2 hours!' });
    }
  }

  // Update the last claimed date and set it in the cookies
  res.cookie('lastClaimed', now, { maxAge: BONUS_INTERVAL });
  res.status(200).json({ message: 'Bonus claimed successfully!', lastClaimed: now, bonuses: BONUSES });
});

router.get('/bonuses', (req, res) => {
  // Auto-unlock bonuses where timer is 0
  bonuses.forEach(bonus => {
    if (bonus.timer <= 0 && bonus.locked) {
      bonus.locked = false;
    }
  });
  res.json(bonuses);
});

router.post('/bonuses/:id/claim', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const bonus = bonuses.find(b => b.id === id);

  if (bonus && !bonus.locked && !bonus.claimed) {
    bonus.claimed = true;
    res.json(bonus);
  } else if (bonus && bonus.claimed) {
    res.status(400).json({ error: 'Bonus already claimed' });
  } else {
    res.status(400).json({ error: 'Bonus is locked or not found' });
  }
});

router.post('/bonuses/tick', (req, res) => {
  bonuses.forEach(bonus => {
    if (bonus.timer > 0) {
      bonus.timer -= 1;
    }
    if (bonus.timer <= 0 && bonus.locked) {
      bonus.locked = false;
    }
  });
  res.json(bonuses);
});

router.post('/update/:tools', passport.authenticate("jwt", { session: false }), async (req, res) => {
  const tools = req.params.tools;
  const scope = req.body.scope
  if (tools === 'token') {
    const result = await addToken(req.user.id, scope)
    return res.status(200).json(result);
  }
  else if (tools === 'watering') {
    const result = await addCans('1', req.user.id);
    return res.status(200).json(result);
  } else {
    const result = await addSeedings(tools, req.user.id)
    return res.status(200).json(result);
  }
})

router.get('/watchAds', passport.authenticate("jwt", { session: false }), async (req, res) => {
  const result = await addToken(req.user.id, "50")
  return res.status(200).json(result);
})

async function addCans(level, userId) {
  try {
    // Find the user based on the ID stored in the JWT
    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found!" };
    }

    // Find the shop with the matching cans level
    const shop = await Shop.findOne({ "cans.level": level });
    if (!shop) {
      return { error: "Plot not found in Shop" };
    }

    // Find the specific cans item
    const cans = shop.cans.find((p) => p.level === level);
    if (!cans) {
      return { error: "Cans item not found in Shop" };
    }

    // Update the user's inventory based on the cans item
    user.inventory.waterScope.forEach((inventoryCans) => {
      if (inventoryCans.cans.toString() === cans._id.toString()) {
        // Convert scope to a number, decrement it, ensure it doesn’t go below zero, then convert back to string
        inventoryCans.scope = (
          Number(inventoryCans.scope) + 1
        ).toString();
      }
    });
    // Save the user and respond with the updated inventory
    await user.save();
    return user.inventory.waterScope;
  } catch (error) {
    console.error("Internal Server Error:", error); // Log the error for debugging
    return { error: "Internal Server Error" };
  }
}

async function addSeedings(fruit, userId) {
  try {
    // Find the user based on the ID stored in the JWT
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return { error: "User not found!" };
    }
    // Find the shop with the matching tools
    const shop = await Shop.findOne({ "seedings.fruit": fruit });
    if (!shop) {
      return { error: "Plot not found in Shop" };
    }
    const seedings = shop.seedings.find((p) => p.fruit === fruit);
    if (!seedings) {
      return { error: "Seeding item not found in Shop" };
    }
    const item = user.inventory.fruitScope.find((item) =>
      item.fruit.equals(seedings._id)
    );
    if (item) {
      let scope = Number(item.scope) + 1;
      item.scope = scope.toString();
    } else {
      user.inventory.fruitScope.push({
        fruit: seedings._id,
        scope: 1,
      });
    }
    await user.save();
    return user.inventory.fruitScope;
  } catch (error) {
    console.error("Internal Server Error:", error); // Log the error for debugging
    return { error: "Internal Server Error" };
  }  
}

async function addToken(userId, scope) {
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return { error: "User not found!" };
    }
    temp = Number(user.inventory.tokenScope) + Number(scope);
    user.inventory.tokenScope = temp.toString();
    return user.save().then((user) => user.inventory.tokenScope);
  } catch (error) {
    console.error("Internal Server Error:", error); // Log the error for debugging
    return { error: "Internal Server Error" };
  }
}

router.get('/getStatus', passport.authenticate("jwt", { session: false }), async (req, res) => {

  const userName = 'andrey'; // Static username, can be replaced with `req.user.fullname` if needed
  // const userName = req.user.fullname; // Static username, can be replaced with `req.user.fullname` if needed

  try {
    const apiUrl = `https://adsvilla.net/tgpi.php?token=293n758bcmdshof83dnm7s3mchkd93&uname=${encodeURIComponent(userName)}`;

    // Fetch data from the external API
    const { data } = await axios.get(apiUrl);

    // Task definitions with dynamic values from API response
    const taskTitles = [
      { title: "Complete 10 PTC ads on BitcoTasks", key: "Complete 10 PTC ads on BitcoTasks status", coins: "1000" },
      { title: "Complete 10 Tasks on Excentiv", key: "Complete 10 Tasks on Excentiv status", coins: "1000" },
      { title: "Receive earnings from Timewall", key: "Receive earnings from Timewall status", coins: "1500" },
      { title: "Complete a survey on CPX Research", key: "Complete a survey on CPX Research status", coins: "1500" },
      { title: "Complete any task on BitLabs", key: "Complete any task on BitLabs status", coins: "2000" },
      { title: "Complete 30 PTC ads in a day", key: "Complete 30 PTC ads in a day status=", coins: "1500" },
      { title: "Complete all daily missions", key: "Complete all daily missions status", coins: "5000" },
    ];

    // Map tasks to include status, claimed, and other details
    const tasks = taskTitles.map(task => ({
      title: task.title,
      status: data[task.key] || 0,
      coins: task.coins,
      max: 1,
      href: 'https://adsvilla.net',
      claimed: data[task.key] === 1,
    }));

    // Send the tasks array as the response
    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching task data:", error);
    return res.status(500).json({ error: "Failed to fetch task data. Please try again later." });
  }
});


router.get('/TaskList', passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    return res.status(200).json({specialTask: user.specialTask, dailyTask: user.dailyTask});
  } catch (error) {
    console.error("Internal Server Error:", error); // Log the error for debugging
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const client = new TwitterApi({
  appKey: keys.x_apiKey,
  appSecret: keys.x_apiSecret,
  accessToken: keys.x_accessToken,
  accessSecret: keys.x_accessSecret,
});

router.post('/updateTaskList', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { title, isSpecialTask } = req.body;

    try {
      // Find the user
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found!' });
      }

      const taskList = isSpecialTask ? user.specialTask : user.dailyTask;

      const task = taskList.find((task) => task.title === title);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      task.status = Math.min(task.status + 1, task.max);

      await user.save();

      return res.status(200).json({specialTask: user.specialTask, dailyTask: user.dailyTask});
    } catch (error) {
      console.error('Internal Server Error:', error); // Log the error for debugging
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.post('/claim-task', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const {title, coin, isSpecialTask} = req.body;
  const userId = req.user.id;
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found!" });
  }

  const task = isSpecialTask ? user.specialTask : user.dailyTask;
  const taskIndex = task.findIndex(t => t.title === title);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  if (task[taskIndex].claimed) {
    return res.status(400).json({ message: 'Task already claimed' });
  }
  task[taskIndex].claimed = true;
  temp = Number(user.inventory.tokenScope) + Number(coin);
  user.inventory.tokenScope = temp.toString();
  await user.save();
  return res.status(200).json({ specialTask: user.specialTask, dailyTask: user.dailyTask });
});

async function getUserIdByUsername(username) {
  try {
    const user = await client.v2.userByUsername(username);
    console.log('User ID:', user.data.id);  // This will log your numeric userId
    return user.data.id;
  } catch (error) {
    console.error('Error fetching userId:', error);
  }
}

module.exports = router;