const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema
const ShopSchema = new Schema({
  plot: [{
    price: {type: String, required: false},
    level: {type: String, required: false}
  }],
  token: [{
    price: {type: String, required: false},
    level: {type: String, required: false}
  }],
  cans: [{
    price: {type: String, required: false},
    level: {type: String, required: false},
    imgSrc: {type: String, required: true},
  }],
  seedings: [{
    price: {type: String, required: true},
    fruit: {type: String, required: true},
    imgSrc: {type: String, required: true},
  }],
})

module.exports = Shop = mongoose.model('shops', ShopSchema);