const targetCost = 1000000;
const monthlySavings = 30000;
const years = 3;
const expectedReturn = 10;
const inflationRate = 6;

// Formula 1: Future Target Cost (Inflated)
const futureTargetCost = Math.round(targetCost * Math.pow(1 + inflationRate / 100, years));

// Formula 2: Future Savings with Monthly Compounding (Annuity Due)
const r = expectedReturn / 100 / 12;
const n = years * 12;
const annuityDueFactor = r === 0 ? n : ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
const futureSavings = Math.round(monthlySavings * annuityDueFactor);

// Formula 3: Gap
const gap = Math.max(0, futureTargetCost - futureSavings);

// Formula 4: Ratio
const ratio = Math.round((futureSavings / futureTargetCost) * 1000) / 1000;

// Formula 5: Status
let status;
if (ratio >= 1.0) {
  status = "Achievable";
} else if (ratio >= 0.7) {
  status = "Almost Achievable";
} else {
  status = "Not Achievable";
}

// Formula 6: Required Monthly Savings to reach target
const requiredMonthlySavings = Math.ceil(futureTargetCost / annuityDueFactor);

const result = {
  expectedReturn,
  inflationRate,
  futureTargetCost,
  futureSavings,
  gap,
  ratio,
  status,
  requiredMonthlySavings
};

console.log("Calculated Engine Output:");
console.log(JSON.stringify(result, null, 2));

// Assertions to verify against expected output
const expectedOutput = {
  expectedReturn: 10,
  inflationRate: 6,
  futureTargetCost: 1191016,
  futureSavings: 1263900,
  gap: 0,
  ratio: 1.061,
  status: 'Achievable',
  requiredMonthlySavings: 28271
};

let allPassed = true;
for (const key in expectedOutput) {
  if (result[key] !== expectedOutput[key]) {
    console.error(`Mismatch for key ${key}: Expected ${expectedOutput[key]}, Got ${result[key]}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log("\nSuccess! All mathematical formula assertions passed!");
} else {
  console.error("\nFailed: Formula calculations do not match the target output.");
  process.exit(1);
}
