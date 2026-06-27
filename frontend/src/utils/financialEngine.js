// GoalHorizon Financial Projections and Calculations Helper Module

// Formats number to Indian Rupee (INR) representation
export const formatINR = (value) => {
  if (value === '' || isNaN(value) || value === null || value === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

// Calculates future cost and savings projection pathways under 3 growth environments
export const runLocalProjections = (cost, savings, y, retRate, infRate) => {
  const totalMonths = y * 12;
  
  // Define growth environments (scenarios) return/inflation rates
  const scenarios = {
    conservative: {
      returnRate: Math.max(0, retRate - 2.0),
      inflationRate: infRate + 1.5
    },
    moderate: {
      returnRate: retRate,
      inflationRate: infRate
    },
    optimistic: {
      returnRate: retRate + 2.0,
      inflationRate: Math.max(0, infRate - 1.5)
    }
  };

  const calculateScenarioDetails = (rAnnual, iAnnual) => {
    const futureCost = Math.round(cost * Math.pow(1 + iAnnual / 100, y));
    const rMonthly = rAnnual / 100 / 12;
    const factor = rMonthly === 0 ? totalMonths : ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly) * (1 + rMonthly);
    const futureSavs = Math.round(savings * factor);
    const gap = Math.max(0, futureCost - futureSavs);
    const ratio = futureCost === 0 ? 0 : Math.round((futureSavs / futureCost) * 1000) / 1000;
    
    let status = 'Not Achievable';
    if (ratio >= 1.0) status = 'Achievable';
    else if (ratio >= 0.7) status = 'Almost Achievable';
    
    const reqSavings = factor === 0 ? 0 : Math.ceil(futureCost / factor);
    
    return {
      expectedReturn: rAnnual,
      inflationRate: iAnnual,
      futureTargetCost: futureCost,
      futureSavings: futureSavs,
      gap,
      ratio,
      status,
      requiredMonthlySavings: reqSavings,
      annuityDueFactor: factor
    };
  };

  const consDetails = calculateScenarioDetails(scenarios.conservative.returnRate, scenarios.conservative.inflationRate);
  const modDetails = calculateScenarioDetails(scenarios.moderate.returnRate, scenarios.moderate.inflationRate);
  const optDetails = calculateScenarioDetails(scenarios.optimistic.returnRate, scenarios.optimistic.inflationRate);

  // Generate monthly plot points for the graphs
  const trajectory = [];
  const rCons = scenarios.conservative.returnRate / 100 / 12;
  const rMod = scenarios.moderate.returnRate / 100 / 12;
  const rOpt = scenarios.optimistic.returnRate / 100 / 12;
  const infCons = scenarios.conservative.inflationRate / 100;
  const infMod = scenarios.moderate.inflationRate / 100;
  const infOpt = scenarios.optimistic.inflationRate / 100;

  for (let m = 0; m <= totalMonths; m++) {
    const fCons = rCons === 0 ? m : ((Math.pow(1 + rCons, m) - 1) / rCons) * (1 + rCons);
    const fMod = rMod === 0 ? m : ((Math.pow(1 + rMod, m) - 1) / rMod) * (1 + rMod);
    const fOpt = rOpt === 0 ? m : ((Math.pow(1 + rOpt, m) - 1) / rOpt) * (1 + rOpt);

    trajectory.push({
      month: m,
      savingsConservative: m === 0 ? 0 : Math.round(savings * fCons),
      savingsModerate: m === 0 ? 0 : Math.round(savings * fMod),
      savingsOptimistic: m === 0 ? 0 : Math.round(savings * fOpt),
      costConservative: Math.round(cost * Math.pow(1 + infCons, m / 12)),
      costModerate: Math.round(cost * Math.pow(1 + infMod, m / 12)),
      costOptimistic: Math.round(cost * Math.pow(1 + infOpt, m / 12))
    });
  }

  return {
    scenarios: {
      conservative: consDetails,
      moderate: modDetails,
      optimistic: optDetails
    },
    trajectory
  };
};

// Computes actionable suggestions and potential timeline/rate adjustments
export const generateSuggestions = (calculatedData, targetCost, monthlySavings, years, expectedReturn, inflationRate) => {
  if (!calculatedData) return null;
  const moderate = calculatedData.scenarios.moderate;
  const cost = targetCost === '' ? 0 : Number(targetCost);
  const savings = monthlySavings === '' ? 0 : Number(monthlySavings);
  const y = years === '' ? 0 : Number(years);
  const rRate = expectedReturn === '' ? 0 : Number(expectedReturn);
  
  if (cost === 0 || savings === 0 || y === 0) return null;

  if (moderate.status === 'Achievable') {
    const excessSavings = moderate.futureSavings - moderate.futureTargetCost;
    const potentialReduction = savings - moderate.requiredMonthlySavings;
    
    let earlyMonths = 0;
    const rMonthly = rRate / 100 / 12;
    for (let m = 1; m <= y * 12; m++) {
      const factor = rMonthly === 0 ? m : ((Math.pow(1 + rMonthly, m) - 1) / rMonthly) * (1 + rMonthly);
      const savingsProj = savings * factor;
      const costProj = cost * Math.pow(1 + inflationRate / 100, m / 12);
      if (savingsProj >= costProj) {
        earlyMonths = (y * 12) - m;
        break;
      }
    }

    return {
      status: 'Achievable',
      summary: 'Your savings plan is fully funded under expected market conditions!',
      tips: [
        `You will accumulate an excess surplus of ${formatINR(excessSavings)} by Year ${y}.`,
        potentialReduction > 100 
          ? `You could reduce your deposits by ${formatINR(potentialReduction)}/month (saving ${formatINR(moderate.requiredMonthlySavings)}/month instead) and still secure your goal.`
          : null,
        earlyMonths > 0 
          ? `If you maintain your current saving rate of ${formatINR(savings)}/month, you will secure this goal ${earlyMonths} months ahead of schedule.`
          : null
      ].filter(Boolean)
    };
  } else {
    const extraSavingsNeeded = moderate.requiredMonthlySavings - savings;

    let additionalTimelineNeeded = 0;
    const rMonthly = rRate / 100 / 12;
    let tempYears = y;
    for (let i = 0; i < 360; i++) { // Max 30 years extension
      tempYears += 0.1;
      const tempMonths = Math.round(tempYears * 12);
      const factor = rMonthly === 0 ? tempMonths : ((Math.pow(1 + rMonthly, tempMonths) - 1) / rMonthly) * (1 + rMonthly);
      const savingsProj = savings * factor;
      const costProj = cost * Math.pow(1 + inflationRate / 100, tempYears);
      if (savingsProj >= costProj) {
        additionalTimelineNeeded = Math.round((tempYears - y) * 10) / 10;
        break;
      }
    }

    let requiredYield = 0;
    let low = 0, high = 100;
    const totalMonths = y * 12;
    for (let iter = 0; iter < 20; iter++) {
      const mid = (low + high) / 2;
      const rMid = mid / 100 / 12;
      const factorMid = rMid === 0 ? totalMonths : ((Math.pow(1 + rMid, totalMonths) - 1) / rMid) * (1 + rMid);
      const savingsProj = savings * factorMid;
      if (savingsProj < moderate.futureTargetCost) {
        low = mid;
      } else {
        high = mid;
      }
    }
    requiredYield = Math.round(high * 10) / 10;

    const yieldTips = requiredYield <= 25 
      ? `Increase your expected portfolio yield to ${requiredYield}% by allocating assets towards high-growth instruments (e.g. Equities or Mutual Funds).`
      : `An expected yield of ${requiredYield}% is historically unrealistic for a ${y}-year tenure. Focus on increasing savings or extending the timeline.`;

    return {
      status: 'Gapped',
      summary: `Your projections indicate a funding shortfall of ${formatINR(moderate.gap)} under expected market conditions.`,
      tips: [
        `Increase monthly savings by ${formatINR(extraSavingsNeeded)} (setting total savings to ${formatINR(moderate.requiredMonthlySavings)}/month).`,
        additionalTimelineNeeded > 0 
          ? `Extend your savings timeline by ${additionalTimelineNeeded} years (target timeline: ${Math.round((y + additionalTimelineNeeded)*10)/10} years) under current rates.`
          : 'Extending timeline is not sufficient. Consider significantly increasing monthly deposits.',
        yieldTips
      ]
    };
  }
};

// Calculates loan EMI, total interest, and total repayment costs
export const calculateEMI = (calculatedData, customLoanAmount, loanInterest, loanTenure) => {
  const activeShortfall = calculatedData ? calculatedData.scenarios.moderate.gap : 0;
  const principal = customLoanAmount === '' ? activeShortfall : Number(customLoanAmount);

  const rMonthly = Number(loanInterest) / 100 / 12;
  const nMonths = Number(loanTenure) * 12;

  if (isNaN(rMonthly) || isNaN(nMonths) || nMonths <= 0 || principal <= 0) return null;

  let emi = 0;
  if (rMonthly === 0) {
    emi = principal / nMonths;
  } else {
    emi = (principal * rMonthly * Math.pow(1 + rMonthly, nMonths)) / (Math.pow(1 + rMonthly, nMonths) - 1);
  }

  const totalRepayment = emi * nMonths;
  const totalInterest = totalRepayment - principal;

  return {
    principal,
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalRepayment: Math.round(totalRepayment)
  };
};
