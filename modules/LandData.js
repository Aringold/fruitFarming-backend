const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DetailSchema = new Schema({
  no: {type:String, required: true},
  data: {
    step: {
      type: Number,
      required: true,
      default: 0,
    },
    fruits: {
      type: String,
      required: true,
      default: "apple",
    },
    currentScope: {
      type: Number,
      required: true,
      default: 0,
    },
    selectedCans: {
      type: Boolean,
      required: true,
      default: true,
    },
    selectedFruit: {
      type: Boolean,
      required: true,
      default: true,
    },
  }
})

const PlotSchema = new Schema({
  plotLevel: { type: String, required: true },
  detail: [DetailSchema], // Array of detail subdocuments
});

const LandDataSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  plot: [PlotSchema], // Use PlotSchema for plot
});

module.exports = LandData = mongoose.model('LandDatas', LandDataSchema);
