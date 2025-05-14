const express = require("express");
const router = express.Router();
const passport = require("passport");

const Shop = require("../../modules/Shop");
const User = require("../../modules/User");
const makeScopeList = require("../../utils/makeScopeList");

//get all
router.get(
  "/all",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.user.id });
      const shops = await Shop.find({});
      if (!user) {
        return res.status(400).json({ error: "Not found User!" });
      }
      const userTokens = user.inventory.tokenScope;
      const userPlotIds = user.inventory.plot.map((plotId) => plotId);
      const plotResult = [];
      for (const plotId of userPlotIds) {
        for (const shop of shops) {
          for (const plot of shop.plot) {
            if (plot._id.toString() === plotId.toString()) {
              plotResult.push(plot.level);
            }
          }
        }
      }      const userFruitScopeIds = user.inventory.fruitScope.map(
        (fruidId) => fruidId
      );
      const fruitResult = [];
      for (const fruitId of userFruitScopeIds) {
        for (const shop of shops) {
          for (const fruit of shop.seedings) {
            if (fruit._id.toString() === fruitId.fruit.toString()) {
              fruitResult.push({
                fruit: fruit.fruit,
                scope: fruitId.scope,
                imgSrc: fruit.imgSrc,
              });
            }
          }
        }
      }

      const userWaterScopeIds = user.inventory.waterScope.map(
        (cansId) => cansId
      );
      const waterResult = [];
      for (const cansId of userWaterScopeIds) {
        for (const shop of shops) {
          for (const cans of shop.cans) {
            if (cans._id.toString() === cansId.cans.toString()) {
              waterResult.push({
                cans: cans.level,
                scope: cansId.scope,
                imgSrc: cans.imgSrc,
              });
            }
          }
        }
      }

      return res.json({ userTokens, plotResult, fruitResult, waterResult });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//buy plot
router.post(
  "/plot",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Shop.findOne({ "plot.level": req.body.tools })
      .then((shop) => {
        if (!shop) {
          return res.status(404).json({ error: "Plot not found in Shop" });
        }
        const plot = shop.plot.find((p) => p.level === req.body.tools);
        User.findOne({ _id: req.user.id })
          .then((user) => {
            if (
              user.inventory.plot.some(
                (boughtPlot) => boughtPlot.toString() === plot._id.toString()
              )
            ) {
              return res
                .status(400)
                .json({ error: "Plot already exists in inventory" });
            }
            user.inventory.tokenScope = (Number(user.inventory.tokenScope) - Number(req.body.usedToken)).toString();
            user.inventory.plot.push(plot._id);
            return user.save().then((user) => {
              const userPlotIds = user.inventory.plot.map((plotId) => plotId);
              const result = [];
              const www = userPlotIds.map(async (plotId) => {
                shop.plot.forEach((plot) => {
                  if (plot._id.toString() == plotId.toString()) {
                    result.push(plot.level);
                  }
                });
              });
              res.json(result);
            });
          })
          .catch((err) => res.status(500).json({ error: err.message }));
      })
      .catch((err) => res.status(500).json({ error: err.message }));
  }
);

//get plot data
router.get(
  "/plot",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.user.id });
      if (!user) {
        return res.status(400).json({ error: "Not found User!" });
      }

      const userPlotIds = user.inventory.plot.map((plotId) => plotId);
      const result = [];
      const shops = await Shop.find({});
      const www = userPlotIds.map(async (plotId) => {
        shops.forEach((shop) => {
          shop.plot.forEach((plot) => {
            if (plot._id.toString() == plotId.toString()) {
              result.push(plot.level);
            }
          });
        });
      });
      return res.json({ result });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//buy seedings
router.post(
  "/seedings",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Shop.findOne({ "seedings.fruit": req.body.tools })
      .then((shop) => {
        if (!shop) {
          return res.status(404).json({ error: "Seedings not found in Shop" });
        }
        const fruit = shop.seedings.find(
          (seed) => seed.fruit === req.body.tools
        );
        if (!fruit) {
          return res
            .status(404)
            .json({ error: "Fruit not found in Shop seedings" });
        }
        const userId = req.user.id;
        const fruitId = fruit._id; // Ensure this is correctly compared
        const newScope = req.body.scope;
        User.findOne({ _id: userId })
          .then((user) => {
            if (!user) {
              return res.status(404).json({ error: "User not found" });
            }
            user.inventory.tokenScope = (Number(user.inventory.tokenScope) - Number(req.body.usedToken)).toString();
            const item = user.inventory.fruitScope.find((item) =>
              item.fruit.equals(fruitId)
            );
            if (item) {
              let scope = Number(newScope) + Number(item.scope);
              item.scope = scope.toString();
            } else {
              user.inventory.fruitScope.push({
                fruit: fruitId,
                scope: newScope,
              });
            }
            return user.save().then((user) => {
              res.json(makeScopeList(user));
            });
          })
          .catch((err) => {
            res
              .status(500)
              .json({ error: err.message, sdfsd: "sdfsdfsdfsdfsfd" });
          });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  }
);

//update cans
router.post(
  "/update/cans",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Find the user based on the ID stored in the JWT
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found!" });
      }

      // Find the shop with the matching cans level
      const shop = await Shop.findOne({ "cans.level": req.body.tools });
      if (!shop) {
        return res.status(404).json({ error: "Plot not found in Shop" });
      }

      // Find the specific cans item
      const cans = shop.cans.find((p) => p.level === req.body.tools);
      if (!cans) {
        return res.status(404).json({ error: "Cans item not found in Shop" });
      }

      // Update the user's inventory based on the cans item
      user.inventory.waterScope.forEach((inventoryCans) => {
        if (inventoryCans.cans.toString() === cans._id.toString()) {
          // Convert scope to a number, decrement it, ensure it doesn’t go below zero, then convert back to string
          inventoryCans.scope = Math.max(
            Number(inventoryCans.scope) - 1,
            0
          ).toString();
        }
      });
      // Save the user and respond with the updated inventory
      await user.save();
      return res.json(user.inventory.waterScope);
    } catch (error) {
      console.error("Internal Server Error:", error); // Log the error for debugging
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//update seedins
router.post(
  "/update/seedings",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Find the user based on the ID stored in the JWT
      const user = await User.findOne({ _id: req.user.id });
      if (!user) {
        return res.status(404).json({ error: "User not found!" });
      }
      // Find the shop with the matching tools
      const shop = await Shop.findOne({ "seedings.fruit": req.body.tools });
      if (!shop) {
        return res.status(404).json({ error: "Plot not found in Shop" });
      }
      const seedings = shop.seedings.find((p) => p.fruit === req.body.tools);
      if (!seedings) {
        return res
          .status(404)
          .json({ error: "Seeding item not found in Shop" });
      }
      user.inventory.fruitScope.forEach((inventorySeedings) => {
        if (inventorySeedings.fruit.toString() === seedings._id.toString()) {
          let temp = Math.max(Number(inventorySeedings.scope) - 1, 0);
          inventorySeedings.scope = temp.toString();
        }
      });
      await user.save();
      return res.json(user.inventory.fruitScope);
    } catch (error) {
      console.error("Internal Server Error:", error); // Log the error for debugging
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//update tokens
router.post(
  "/update/tokens",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.user.id });
      if (!user) {
        return res.status(404).json({ error: "User not found!" });
      }
      user.inventory.tokenScope =  req.body.scope;
      return user.save().then((user) => res.json(user.inventory.tokenScope));
    } catch (error) {
      console.error("Internal Server Error:", error); // Log the error for debugging
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//buy tokens
router.post(
  "/tokens",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ _id: req.user.id }).then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      let newScope = Number(user.inventory.tokenScope) + Number(req.body.scope);
      user.inventory.tokenScope = newScope.toString();
      return user.save().then((user) => {
        res.json(makeScopeList(user));
      });
    });
  }
);

//buy water
router.post(
  "/cans",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Shop.findOne({ "cans.level": req.body.tools })
      .then((shop) => {
        if (!shop) {
          return res.status(404).json({ error: "Seedings not found in Shop" });
        }
        const can = shop.cans.find((can) => can.level === req.body.tools);
        if (!can) {
          return res
            .status(404)
            .json({ error: "Fruit not found in Shop seedings" });
        }
        const userId = req.user.id;
        const canId = can._id; // Ensure this is correctly compared
        const newScope = req.body.scope;
        User.findOne({ _id: userId })
          .then((user) => {
            if (!user) {
              return res.status(404).json({ error: "User not found" });
            }
            user.inventory.tokenScope = (Number(user.inventory.tokenScope) - Number(req.body.usedToken)).toString();

            const item = user.inventory.waterScope.find((item) =>
              item.cans.equals(canId)
            );
            if (item) {
              let scope = Number(newScope) + Number(item.scope);
              item.scope = scope.toString();
            } else {
              user.inventory.waterScope.push({
                cans: canId,
                scope: newScope,
              });
            }
            return user.save().then((user) => {
              res.json(makeScopeList(user));
            });
          })
          .catch((err) => {
            res
              .status(500)
              .json({ error: err.message, sdfsd: "sdfsdfsdfsdfsfd" });
          });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  }
);

module.exports = router;
