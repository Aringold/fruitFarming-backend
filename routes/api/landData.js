const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require('mongoose');

const User = require("../../modules/User");
const LandData = require("../../modules/LandData");

router.get(
  "/:plotLevel",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const plotLevel = req.params.plotLevel;
      let landData = await LandData.findOne({ user: userId });
      if (!landData) {
        return res.status(200).json({data: null});
      }
      let plot = landData.plot.find(p => p.plotLevel === plotLevel);
      let doubleArray = Array.from({ length: 6 }, () => Array(4).fill(null));
      plot.detail.forEach(item => {
        let plotNo = parseInt(item.no, 10);
        let tensDigit = Math.floor((plotNo % 100) / 10);  // tens digit determines the row (1-6)
        let onesDigit = plotNo % 10;  // ones digit determines the column (1-4)
        if (tensDigit >= 1 && tensDigit <= 6 && onesDigit >= 1 && onesDigit <= 4) {
          doubleArray[tensDigit - 1][onesDigit - 1] = item.data;
        }
      });
      console.log(doubleArray);
      
      return res.status(200).json(doubleArray);
      // return res.status(200).json(plot.detail);
    } catch (error) {}
  }
);

// async function updateOrCreateLandData(userId, plotLevel, no, newData) {
//   try {
//     let landData = await LandData.findOne({ user: userId });

//     if (!landData) {
//       landData = new LandData({
//         user: userId,
//         plot: [{
//           plotLevel: plotLevel,
//           detail: [{ no: no, data: newData }]
//         }]
//       });
//       await landData.save();
//       return { message: "New LandData created", landData };
//     }

//     let plot = landData.plot.find(p => p.plotLevel === plotLevel);
//     if (!plot) {
//       landData.plot.push({
//         plotLevel: plotLevel,
//         detail: [{ no: no, data: newData }]
//       });
//       await landData.save();
//       return { message: "New plot created", landData };
//     }

//     let detail = plot.detail.find(d => d.no === no);
//     if (!detail) {
//       plot.detail.push({ no: no, data: newData });
//       await landData.save();
//       return { message: "New detail created", landData };
//     }

//     // Update existing detail
//     detail.data = { ...detail.data, ...newData };
//     await landData.save();
//     return { message: "Data updated", landData };
//   } catch (error) {
//     console.error("Error updating or creating LandData:", error);
//     throw new Error("An error occurred while updating or creating LandData.");
//   }
// }

// Updated Express route

async function updateOrCreateLandData(userId, plotLevel, no, newData) {
  try {
    // Attempt to update the existing plot and detail
    const landData = await LandData.findOneAndUpdate(
      { user: userId, 'plot.plotLevel': plotLevel, 'plot.detail.no': no },
      {
        $set: { 
          'plot.$[p].detail.$[d].data': newData 
        }
      },
      {
        new: true, // Return the updated document
        arrayFilters: [
          { 'p.plotLevel': plotLevel },
          { 'd.no': no }
        ]
      }
    );

    if (landData) {
      return { message: "Data updated", landData };
    }

    // If the plot level exists but the specific detail does not, add it
    const plotExists = await LandData.findOne({ user: userId, 'plot.plotLevel': plotLevel });
    if (plotExists) {
      const updatedLandData = await LandData.findOneAndUpdate(
        { user: userId, 'plot.plotLevel': plotLevel },
        {
          $push: { 'plot.$[p].detail': { no: no, data: newData } }
        },
        {
          new: true,
          arrayFilters: [{ 'p.plotLevel': plotLevel }]
        }
      );

      return { message: "Detail added to existing plot", landData: updatedLandData };
    }

    // If the plot level does not exist, create it with the detail
    const newLandData = await LandData.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          plot: {
            plotLevel: plotLevel,
            detail: [{ no: no, data: newData }]
          }
        }
      },
      { new: true, upsert: true }
    );
    return { message: "New plot and detail created", landData: newLandData };
  } catch (error) {
    console.error("Error updating or creating LandData:", error);
    throw new Error(`An error occurred while updating or creating LandData: ${error.message}`);
  }
}


router.post('/:plotLevel', passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const { no, data } = req.body;
    const userId = req.user.id;
    const plotLevel = req.params.plotLevel;
    
    if (!userId || !plotLevel || !no || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        receivedData: req.body,
        missingFields: {
          userId: !userId,
          plotLevel: !plotLevel,
          no: !no,
          data: !data
        }
      });
    }

    // Validate data structure
    const requiredFields = ['step', 'fruits', 'currentScope', 'selectedCans', 'selectedFruit'];
    const missingDataFields = requiredFields.filter(field => !(field in data));
    if (missingDataFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required data fields',
        missingFields: missingDataFields
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const result = await updateOrCreateLandData(userId, plotLevel, no, data);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/landdata route:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});



module.exports = router;
