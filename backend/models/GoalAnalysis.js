const mongoose = require("mongoose");

const ScenarioSchema = new mongoose.Schema({
  expectedReturn: { type: Number, required: true },
  inflationRate: { type: Number, required: true },
  futureTargetCost: { type: Number, required: true },
  futureSavings: { type: Number, required: true },
  gap: { type: Number, required: true },
  ratio: { type: Number, required: true },
  status: { type: String, required: true },
  requiredMonthlySavings: { type: Number, required: true }
}, { _id: false });

const GoalAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  goal: { type: String, required: true, trim: true },
  targetCost: { type: Number, required: true },
  monthlySavings: { type: Number, required: true },
  years: { type: Number, required: true },
  expectedReturn: { type: Number, required: true },
  inflationRate: { type: Number, required: true },
  scenarios: {
    conservative: { type: ScenarioSchema, required: true },
    moderate: { type: ScenarioSchema, required: true },
    optimistic: { type: ScenarioSchema, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GoalAnalysis", GoalAnalysisSchema);
