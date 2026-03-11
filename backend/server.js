const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.post("/analyze-goal", (req, res) => {
    const { goal, targetCost, monthlySavings, years } = req.body;
    
    if (!goal || !targetCost || !monthlySavings || !years) {
        return res.status(400).json({ error: "All fields required" });
    }
    
    const totalSavings = monthlySavings * 12 * years;
    const gap = targetCost - totalSavings;
    const percentage = (totalSavings / targetCost) * 100;
    const required = Math.ceil(targetCost / (years * 12));
    
    let status;
    if (totalSavings >= targetCost) status = "Achievable";
    else if (percentage >= 70) status = "Almost Achievable";
    else status = "Not Achievable";
    
    res.json({
        goal, targetCost, monthlySavings, years,
        totalSavings, gap: gap > 0 ? gap : 0, status,
        requiredMonthlySavings: required,
        savingsPercentage: Math.round(percentage * 100) / 100
    });
});

app.get("/", (req, res) => {
    res.json({ message: "API running" });
});

app.listen(PORT, () => console.log("Server on port " + PORT));
