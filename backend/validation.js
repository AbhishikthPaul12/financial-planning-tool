/**
 * Input validations for Financial Goal Analyzer
 */
function validateGoalAnalysisInput(req, res, next) {
  const { goal, targetCost, monthlySavings, years, expectedReturn, inflationRate } = req.body;
  
  if (goal === undefined || typeof goal !== 'string' || goal.trim() === '') {
    return res.status(400).json({ error: "Goal name is required and must be a valid text string." });
  }
  
  const parsedTargetCost = Number(targetCost);
  if (isNaN(parsedTargetCost) || parsedTargetCost <= 0) {
    return res.status(400).json({ error: "Target cost must be a positive number." });
  }
  
  const parsedMonthlySavings = Number(monthlySavings);
  if (isNaN(parsedMonthlySavings) || parsedMonthlySavings <= 0) {
    return res.status(400).json({ error: "Monthly savings must be a positive number." });
  }
  
  const parsedYears = Number(years);
  if (isNaN(parsedYears) || !Number.isInteger(parsedYears) || parsedYears < 1 || parsedYears > 50) {
    return res.status(400).json({ error: "Timeline must be an integer between 1 and 50 years." });
  }
  
  const parsedExpectedReturn = Number(expectedReturn);
  if (isNaN(parsedExpectedReturn) || parsedExpectedReturn < 0 || parsedExpectedReturn > 100) {
    return res.status(400).json({ error: "Expected return must be a percentage rate between 0% and 100%." });
  }
  
  const parsedInflationRate = Number(inflationRate);
  if (isNaN(parsedInflationRate) || parsedInflationRate < 0 || parsedInflationRate > 100) {
    return res.status(400).json({ error: "Inflation rate must be a percentage rate between 0% and 100%." });
  }
  
  // Attach parsed numbers to req.body so down-stream route handlers don't have to parse them
  req.body.targetCost = parsedTargetCost;
  req.body.monthlySavings = parsedMonthlySavings;
  req.body.years = parsedYears;
  req.body.expectedReturn = parsedExpectedReturn;
  req.body.inflationRate = parsedInflationRate;
  
  next();
}

module.exports = {
  validateGoalAnalysisInput
};
