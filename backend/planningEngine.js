/**
 * Financial Planning & Feasibility Engine
 */

function calculateAnnuityDue(monthlySavings, annualReturnRate, totalMonths) {
  const r = annualReturnRate / 100 / 12;
  if (r === 0) return monthlySavings * totalMonths;
  return monthlySavings * ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
}

function calculateAnnuityDueFactor(annualReturnRate, totalMonths) {
  const r = annualReturnRate / 100 / 12;
  if (r === 0) return totalMonths;
  return ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
}

function calculateFutureTargetCost(initialCost, annualInflationRate, years) {
  return initialCost * Math.pow(1 + annualInflationRate / 100, years);
}

function calculateScenario(initialCost, monthlySavings, years, expectedReturn, inflationRate) {
  const futureTargetCost = Math.round(calculateFutureTargetCost(initialCost, inflationRate, years));
  
  const totalMonths = years * 12;
  const factor = calculateAnnuityDueFactor(expectedReturn, totalMonths);
  const futureSavings = Math.round(monthlySavings * factor);
  
  const gap = Math.max(0, futureTargetCost - futureSavings);
  const ratio = Math.round((futureSavings / futureTargetCost) * 1000) / 1000;
  
  let status;
  if (ratio >= 1.0) {
    status = "Achievable";
  } else if (ratio >= 0.7) {
    status = "Almost Achievable";
  } else {
    status = "Not Achievable";
  }
  
  const requiredMonthlySavings = Math.ceil(futureTargetCost / factor);
  
  return {
    expectedReturn,
    inflationRate,
    futureTargetCost,
    futureSavings,
    gap,
    ratio,
    status,
    requiredMonthlySavings
  };
}

function runProjections(targetCost, monthlySavings, years, expectedReturn, inflationRate) {
  // Scenarios:
  // Moderate (Base): return = expectedReturn, inflation = inflationRate
  // Conservative: return = max(0, expectedReturn - 2.0), inflation = inflationRate + 1.5
  // Optimistic: return = expectedReturn + 2.0, inflation = max(0, inflationRate - 1.5)
  
  const moderate = calculateScenario(targetCost, monthlySavings, years, expectedReturn, inflationRate);
  const conservative = calculateScenario(
    targetCost,
    monthlySavings,
    years,
    Math.max(0, expectedReturn - 2.0),
    inflationRate + 1.5
  );
  const optimistic = calculateScenario(
    targetCost,
    monthlySavings,
    years,
    expectedReturn + 2.0,
    Math.max(0, inflationRate - 1.5)
  );
  
  // Generate monthly trajectory points for charting
  const trajectory = [];
  const totalMonths = years * 12;
  
  const rConservative = Math.max(0, expectedReturn - 2.0) / 100 / 12;
  const rModerate = expectedReturn / 100 / 12;
  const rOptimistic = (expectedReturn + 2.0) / 100 / 12;
  
  const infConservative = (inflationRate + 1.5) / 100;
  const infModerate = inflationRate / 100;
  const infOptimistic = Math.max(0, inflationRate - 1.5) / 100;
  
  for (let m = 0; m <= totalMonths; m++) {
    // Savings growth for each scenario (annuity due at month m)
    const factorCons = rConservative === 0 ? m : ((Math.pow(1 + rConservative, m) - 1) / rConservative) * (1 + rConservative);
    const factorMod = rModerate === 0 ? m : ((Math.pow(1 + rModerate, m) - 1) / rModerate) * (1 + rModerate);
    const factorOpt = rOptimistic === 0 ? m : ((Math.pow(1 + rOptimistic, m) - 1) / rOptimistic) * (1 + rOptimistic);
    
    const savingsCons = Math.round(monthlySavings * factorCons);
    const savingsMod = Math.round(monthlySavings * factorMod);
    const savingsOpt = Math.round(monthlySavings * factorOpt);
    
    // Smoothly inflating target cost at month m (using compound interest interpolated monthly)
    const costCons = Math.round(targetCost * Math.pow(1 + infConservative, m / 12));
    const costMod = Math.round(targetCost * Math.pow(1 + infModerate, m / 12));
    const costOpt = Math.round(targetCost * Math.pow(1 + infOptimistic, m / 12));
    
    trajectory.push({
      month: m,
      savingsConservative: m === 0 ? 0 : savingsCons,
      savingsModerate: m === 0 ? 0 : savingsMod,
      savingsOptimistic: m === 0 ? 0 : savingsOpt,
      costConservative: costCons,
      costModerate: costMod,
      costOptimistic: costOpt
    });
  }
  
  return {
    scenarios: {
      conservative,
      moderate,
      optimistic
    },
    trajectory
  };
}

module.exports = {
  runProjections,
  calculateScenario
};
