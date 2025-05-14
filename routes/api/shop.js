const express = require('express');
const router = express.Router();

const Shop = require('../../modules/Shop');

//create && add plot
router.post('/plot', (req, res) => {
  Shop.findOne()  // Use findOne if you're expecting a single document
    .then((shop) => {
      if (!shop) {
        // If no shop is found, you need to create a new shop first
        const newShop = new Shop({
          plot: [{
            level: req.body.level,
            price: req.body.price,
          }]
        });
        return newShop.save().then(shop => res.json(shop));
      } else {
        // If a shop is found, add the new plot
        const newPlot = {
          level: req.body.level,
          price: req.body.price,
        };
        shop.plot.push(newPlot);
        return shop.save().then(shop => res.json(shop));
      }
    })
    .catch(err => res.status(500).json({ error: err.message }));
});
router.post('/tokens', (req, res) => {
  Shop.findOne()  // Use findOne if you're expecting a single document
    .then((shop) => {
      if (!shop) {
        // If no shop is found, you need to create a new shop first
        const newShop = new Shop({
          token: [{
            level: req.body.level,
            price: req.body.price,
          }],
        });
        return newShop.save().then(shop => res.json(shop));
      } else {
        // If a shop is found, add the new token
        const newToken = {
          level: req.body.level,
          price: req.body.price,
        };
        shop.token.push(newToken);
        return shop.save().then(shop => res.json(shop));
      }
    })
    .catch(err => res.status(500).json({ error: err.message }));
});
router.post('/cans', (req, res) => {
  Shop.findOne()  // Use findOne if you're expecting a single document
    .then((shop) => {
      if (!shop) {
        // If no shop is found, you need to create a new shop first
        const newShop = new Shop({
          cans: [{
            level: req.body.level,
            price: req.body.price,
            imgSrc: req.body.imgSrc
          }],
        });
        return newShop.save().then(shop => res.json(shop));
      } else {
        // If a shop is found, add the new cans
        const newCans = {
          level: req.body.level,
          price: req.body.price,
          imgSrc: req.body.imgSrc
        };
        shop.cans.push(newCans);
        return shop.save().then(shop => res.json(shop));
      }
    })
    .catch(err => res.status(500).json({ error: err.message }));
});
router.post('/seedings', (req, res) => {
  Shop.findOne()  // Use findOne if you're expecting a single document
    .then((shop) => {
      if (!shop) {
        // If no shop is found, you need to create a new shop first
        const newShop = new Shop({
          seedings: [{
            fruit: req.body.fruit,
            price: req.body.price,
            imgSrc: req.body.imgSrc
          }],
        });
        return newShop.save().then(shop => res.json(shop));
      } else {
        // If a shop is found, add the new cans
        const newSeedings = {
          fruit: req.body.fruit,
          price: req.body.price,
          imgSrc: req.body.imgSrc
        };
        shop.seedings.push(newSeedings);
        return shop.save().then(shop => res.json(shop));
      }
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;