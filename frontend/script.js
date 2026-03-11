const API_URL = "http://localhost:5001/analyze-goal";
let savingsChart = null;

function formatCurrency(amount) {
    return "Rs. " + amount.toLocaleString("en-IN");
}

function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.classList.add("show");
    setTimeout(() => errorDiv.classList.remove("show"), 5000);
}

function getStatusClass(status) {
    if (status === "Achievable") return "status-achievable";
    if (status === "Almost Achievable") return "status-almost";
    return "status-not";
}

function updateChart(targetCost, totalSavings) {
    const ctx = document.getElementById("savingsChart").getContext("2d");
    if (savingsChart) savingsChart.destroy();
    
    savingsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Target Cost", "Total Savings"],
            datasets: [{
                data: [targetCost, totalSavings],
                backgroundColor: ["rgba(102, 126, 234, 0.8)", "rgba(118, 75, 162, 0.8)"],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => formatCurrency(value) }
                }
            }
        }
    });
}

function displayResults(data) {
    document.getElementById("resultSection").classList.remove("hidden");
    const badge = document.getElementById("statusBadge");
    badge.textContent = data.status;
    badge.className = "status-badge " + getStatusClass(data.status);
    
    document.getElementById("resultGoal").textContent = data.goal;
    document.getElementById("resultTarget").textContent = formatCurrency(data.targetCost);
    document.getElementById("resultSavings").textContent = formatCurrency(data.totalSavings);
    document.getElementById("resultGap").textContent = formatCurrency(data.gap);
    
    const rec = document.getElementById("recommendation");
    if (data.status === "Achievable") {
        rec.innerHTML = "<strong>Congratulations!</strong> Your goal is achievable.";
    } else {
        rec.innerHTML = "<strong>Recommendation:</strong> Save <strong>" + formatCurrency(data.requiredMonthlySavings) + "</strong> per month to reach this goal.";
    }
    
    updateChart(data.targetCost, data.totalSavings);
}

async function analyzeGoal() {
    const goal = document.getElementById("goal").value.trim();
    const targetCost = parseFloat(document.getElementById("targetCost").value);
    const monthlySavings = parseFloat(document.getElementById("monthlySavings").value);
    const years = parseInt(document.getElementById("years").value);
    
    if (!goal || isNaN(targetCost) || isNaN(monthlySavings) || isNaN(years)) {
        showError("Please fill all fields");
        return;
    }
    
    if (targetCost <= 0 || monthlySavings <= 0 || years <= 0) {
        showError("Values must be positive");
        return;
    }
    
    const btn = document.querySelector(".analyze-btn");
    btn.textContent = "Analyzing...";
    btn.disabled = true;
    
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goal, targetCost, monthlySavings, years })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        
        displayResults(data);
    } catch (err) {
        showError(err.message || "Server error. Is backend running on port 5001?");
    } finally {
        btn.textContent = "Analyze Goal";
        btn.disabled = false;
    }
}
