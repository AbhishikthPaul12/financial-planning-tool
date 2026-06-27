const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const GoalAnalysis = require("../models/GoalAnalysis");
const { runProjections } = require("../planningEngine");
const { validateGoalAnalysisInput } = require("../validation");
const { authenticateToken } = require("../middleware/auth");

// Helper to check if MongoDB is active
function isDatabaseConnected(app) {
  return mongoose.connection.readyState === 1 && !app.locals.useInMemory;
}

// POST /api/v1/analyze
// Protected: user must be authenticated
router.post("/analyze", authenticateToken, validateGoalAnalysisInput, async (req, res) => {
  try {
    const { goal, targetCost, monthlySavings, years, expectedReturn, inflationRate } = req.body;
    const userId = req.user.id;
    
    // Run projections across scenarios
    const projections = runProjections(targetCost, monthlySavings, years, expectedReturn, inflationRate);
    
    // Build schema record
    const recordData = {
      userId,
      goal,
      targetCost,
      monthlySavings,
      years,
      expectedReturn,
      inflationRate,
      scenarios: projections.scenarios
    };
    
    let savedRecord;
    
    if (isDatabaseConnected(req.app)) {
      try {
        const analysis = new GoalAnalysis(recordData);
        savedRecord = await analysis.save();
        console.log(`[Database] Persisted analysis run: ${savedRecord._id} for user: ${userId}`);
      } catch (dbErr) {
        console.warn("[Database] Failed to save, falling back to memory:", dbErr.message);
      }
    }
    
    if (!savedRecord) {
      // In-memory fallback
      const inMemoryId = new mongoose.Types.ObjectId().toString();
      savedRecord = {
        _id: inMemoryId,
        ...recordData,
        createdAt: new Date()
      };
      req.app.locals.inMemoryHistory.unshift(savedRecord);
      console.log(`[Memory] Logged analysis run: ${inMemoryId} for user: ${userId}`);
    }
    
    return res.status(200).json({
      success: true,
      recordId: savedRecord._id,
      scenarios: projections.scenarios,
      trajectory: projections.trajectory
    });
    
  } catch (error) {
    console.error("Simulation run error:", error);
    return res.status(500).json({ error: "An error occurred while executing the simulation." });
  }
});

// GET /api/v1/history
// Protected: user must be authenticated, only returns their own records
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (isDatabaseConnected(req.app)) {
      try {
        const history = await GoalAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(100);
        return res.status(200).json(history);
      } catch (dbErr) {
        console.warn("[Database] Failed to query, falling back to memory:", dbErr.message);
      }
    }
    
    // Memory fallback history: filter by this user's mock id
    const userHistory = req.app.locals.inMemoryHistory.filter(item => String(item.userId) === String(userId));
    return res.status(200).json(userHistory);
  } catch (error) {
    console.error("History retrieval error:", error);
    return res.status(500).json({ error: "An error occurred while retrieving history logs." });
  }
});

// DELETE /api/v1/analyze/:id
// Protected: deletes a single record belonging to the authenticated user
router.delete("/analyze/:id", authenticateToken, async (req, res) => {
  try {
    const recordId = req.params.id;
    const userId = req.user.id;
    
    if (isDatabaseConnected(req.app)) {
      const result = await GoalAnalysis.deleteOne({ _id: recordId, userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Record not found or unauthorized to delete." });
      }
      console.log(`[Database] Deleted analysis run: ${recordId}`);
      return res.status(200).json({ success: true, message: "Record successfully deleted." });
    } else {
      // In-memory fallback delete
      const index = req.app.locals.inMemoryHistory.findIndex(
        item => String(item._id) === String(recordId) && String(item.userId) === String(userId)
      );
      if (index === -1) {
        return res.status(404).json({ error: "Record not found or unauthorized to delete." });
      }
      req.app.locals.inMemoryHistory.splice(index, 1);
      console.log(`[Memory] Deleted analysis run: ${recordId}`);
      return res.status(200).json({ success: true, message: "Record successfully deleted." });
    }
  } catch (error) {
    console.error("Single deletion error:", error);
    return res.status(500).json({ error: "An error occurred while deleting the record." });
  }
});

// POST /api/v1/analyze/delete-multiple
// Protected: deletes multiple records belonging to the authenticated user
router.post("/analyze/delete-multiple", authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "An array of record IDs is required for bulk deletion." });
    }
    
    if (isDatabaseConnected(req.app)) {
      const result = await GoalAnalysis.deleteMany({ _id: { $in: ids }, userId });
      console.log(`[Database] Bulk deleted ${result.deletedCount} analysis runs`);
      return res.status(200).json({ success: true, message: `Successfully deleted ${result.deletedCount} records.` });
    } else {
      // In-memory fallback bulk delete
      const initialCount = req.app.locals.inMemoryHistory.length;
      req.app.locals.inMemoryHistory = req.app.locals.inMemoryHistory.filter(
        item => !(ids.includes(String(item._id)) && String(item.userId) === String(userId))
      );
      const deletedCount = initialCount - req.app.locals.inMemoryHistory.length;
      console.log(`[Memory] Bulk deleted ${deletedCount} analysis runs`);
      return res.status(200).json({ success: true, message: `Successfully deleted ${deletedCount} records.` });
    }
  } catch (error) {
    console.error("Bulk deletion error:", error);
    return res.status(500).json({ error: "An error occurred while deleting the records." });
  }
});

// GET /api/v1/profile/stats
// Protected: returns aggregate dashboard statistics for the logged-in user
router.get("/profile/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let stats;

    if (isDatabaseConnected(req.app)) {
      try {
        const result = await GoalAnalysis.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $group: {
              _id: null,
              totalSimulations: { $sum: 1 },
              totalTargetCost: { $sum: "$targetCost" },
              totalMonthlySavings: { $sum: "$monthlySavings" },
              avgTimeline: { $avg: "$years" },
              avgReturn: { $avg: "$expectedReturn" },
              avgInflation: { $avg: "$inflationRate" },
              achievableCount: {
                $sum: { $cond: [{ $eq: ["$scenarios.moderate.status", "Achievable"] }, 1, 0] }
              },
              almostCount: {
                $sum: { $cond: [{ $eq: ["$scenarios.moderate.status", "Almost Achievable"] }, 1, 0] }
              },
              notCount: {
                $sum: { $cond: [{ $eq: ["$scenarios.moderate.status", "Not Achievable"] }, 1, 0] }
              }
            }
          }
        ]);
        if (result.length > 0) {
          stats = result[0];
          delete stats._id;
        }
      } catch (dbErr) {
        console.warn("[Database] Failed to aggregate stats, falling back to memory:", dbErr.message);
      }
    }

    if (!stats) {
      // Memory fallback calculation
      const userHistory = req.app.locals.inMemoryHistory.filter(
        item => String(item.userId) === String(userId)
      );
      
      const totalSimulations = userHistory.length;
      let totalTargetCost = 0;
      let totalMonthlySavings = 0;
      let sumTimeline = 0;
      let sumReturn = 0;
      let sumInflation = 0;
      let achievableCount = 0;
      let almostCount = 0;
      let notCount = 0;

      userHistory.forEach(item => {
        totalTargetCost += item.targetCost || 0;
        totalMonthlySavings += item.monthlySavings || 0;
        sumTimeline += item.years || 0;
        sumReturn += item.expectedReturn || 0;
        sumInflation += item.inflationRate || 0;

        const status = item.scenarios.moderate.status;
        if (status === 'Achievable') achievableCount++;
        else if (status === 'Almost Achievable') almostCount++;
        else notCount++;
      });

      stats = {
        totalSimulations,
        totalTargetCost,
        totalMonthlySavings,
        avgTimeline: totalSimulations === 0 ? 0 : sumTimeline / totalSimulations,
        avgReturn: totalSimulations === 0 ? 0 : sumReturn / totalSimulations,
        avgInflation: totalSimulations === 0 ? 0 : sumInflation / totalSimulations,
        achievableCount,
        almostCount,
        notCount
      };
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalSimulations: stats.totalSimulations || 0,
        totalTargetCost: stats.totalTargetCost || 0,
        totalMonthlySavings: stats.totalMonthlySavings || 0,
        avgTimeline: Math.round((stats.avgTimeline || 0) * 10) / 10,
        avgReturn: Math.round((stats.avgReturn || 0) * 10) / 10,
        avgInflation: Math.round((stats.avgInflation || 0) * 10) / 10,
        achievableCount: stats.achievableCount || 0,
        almostCount: stats.almostCount || 0,
        notCount: stats.notCount || 0
      }
    });
  } catch (error) {
    console.error("Profile stats calculation error:", error);
    return res.status(500).json({ error: "An error occurred while calculating profile statistics." });
  }
});

module.exports = router;
