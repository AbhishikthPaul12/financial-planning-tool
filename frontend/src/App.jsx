import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  TrendingUp, 
  Settings, 
  Database, 
  FileSpreadsheet, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  User,
  UserPlus,
  Info,
  DollarSign,
  Briefcase,
  PieChart,
  Percent,
  Calendar,
  Activity
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export default function App() {
  // Main form input states (support empty string for blank backspaces)
  const [goal, setGoal] = useState('Dream Home Fund');
  const [targetCost, setTargetCost] = useState(2500000);
  const [monthlySavings, setMonthlySavings] = useState(45000);
  const [years, setYears] = useState(5);
  
  // Sandbox adjustable states
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [inflationRate, setInflationRate] = useState(7);
  
  // Dashboard Tab Mode selection ('planner' | 'loan')
  const [activeMode, setActiveMode] = useState('planner');
  
  // Loan EMI Calculator custom input (pre-fills with shortfall if blank)
  const [customLoanAmount, setCustomLoanAmount] = useState('');
  const [loanInterest, setLoanInterest] = useState(10.5); // Default personal loan rate
  const [loanTenure, setLoanTenure] = useState(3); // Years
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // User Profile stats state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStats, setProfileStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Application UI states
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Deletion selection state
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Real-time calculated results for UI display
  const [calculatedData, setCalculatedData] = useState(null);

  // Fetch history on token state changes
  useEffect(() => {
    if (token) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [token]);

  // Recalculate projections locally whenever sandbox sliders or core parameters change
  // Evaluates empty inputs ("") to 0 to keep the simulation chart live without freezing
  useEffect(() => {
    const cost = targetCost === '' ? 0 : Number(targetCost);
    const savings = monthlySavings === '' ? 0 : Number(monthlySavings);
    const y = years === '' ? 0 : Number(years);
    const rRate = expectedReturn === '' ? 0 : Number(expectedReturn);
    const infRate = inflationRate === '' ? 0 : Number(inflationRate);
    
    const data = runLocalProjections(cost, savings, y, rRate, infRate);
    setCalculatedData(data);
  }, [targetCost, monthlySavings, years, expectedReturn, inflationRate]);

  // Fetch past simulations from MERN backend
  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Fetch Profile aggregate stats
  const fetchProfileStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const res = await fetch('/api/v1/profile/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Open profile modal and request stats
  const handleOpenProfile = () => {
    if (!token) return;
    setProfileStats(null);
    setShowProfileModal(true);
    fetchProfileStats();
  };

  // Run projections locally for real-time responsiveness
  const runLocalProjections = (cost, savings, y, retRate, infRate) => {
    const totalMonths = y * 12;
    
    // Scenarios returns/inflations
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

    // Trajectory
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

  // Dynamic Rule-Based Suggestions Engine
  const generateSuggestions = () => {
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

  // EMI / Loan Calculator
  const calculateEMI = () => {
    // Determine the default loan principal (fallback to shortfall, or use custom amount)
    const shortfall = calculatedData ? calculatedData.scenarios.moderate.gap : 0;
    const principal = customLoanAmount === '' ? shortfall : Number(customLoanAmount);

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

  // Auth actions
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const endpoint = authMode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      setToken(data.token);
      setUsername(data.username);
      
      setAuthUsername('');
      setAuthPassword('');
      setShowAuthModal(false);
      
      setSuccessMessage(`Logged in successfully as ${data.username}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setUsername('');
    setHistory([]);
    setSelectedIds([]);
    setShowProfileModal(false);
    setSuccessMessage('Logged out successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Submit form to backend and persist to DB/Memory history
  const handleAnalyzeSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setAuthError('Please log in or sign up to save simulation runs.');
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          goal,
          targetCost: targetCost === '' ? 0 : targetCost,
          monthlySavings: monthlySavings === '' ? 0 : monthlySavings,
          years: years === '' ? 0 : years,
          expectedReturn: expectedReturn === '' ? 0 : expectedReturn,
          inflationRate: inflationRate === '' ? 0 : inflationRate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze goal');
      }

      setSuccessMessage('Goal plan saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchHistory();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete individual simulation
  const handleDeleteRow = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/analyze/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item._id !== id));
        setSelectedIds(prev => prev.filter(itemId => itemId !== id));
        setSuccessMessage('Goal plan removed.');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete record.');
      }
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Delete multiple simulations (Bulk Deletion)
  const handleDeleteSelected = async () => {
    if (!token || selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected goal plans?`)) return;
    
    try {
      const res = await fetch('/api/v1/analyze/delete-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => !selectedIds.includes(item._id)));
        setSelectedIds([]);
        setSuccessMessage('Selected goal plans deleted.');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete records.');
      }
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Row selection checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(history.map(item => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Load a historical simulation back into the workspace
  const loadHistoryItem = (item) => {
    setGoal(item.goal);
    setTargetCost(item.targetCost);
    setMonthlySavings(item.monthlySavings);
    setYears(item.years);
    setExpectedReturn(item.expectedReturn);
    setInflationRate(item.inflationRate);
    setSuccessMessage(`Loaded goal plan: "${item.goal}"`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Generate Chart.js data
  const getChartData = () => {
    if (!calculatedData) return { labels: [], datasets: [] };

    const labels = calculatedData.trajectory.map(t => {
      const year = Math.floor(t.month / 12);
      const month = t.month % 12;
      return month === 0 ? `Yr ${year}` : `Yr ${year} M${month}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'High Market Growth Savings',
          data: calculatedData.trajectory.map(t => t.savingsOptimistic),
          borderColor: '#10b981', // Emerald
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: 'Expected Market Growth Savings (Expected)',
          data: calculatedData.trajectory.map(t => t.savingsModerate),
          borderColor: '#3b82f6', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointRadius: 0,
          fill: true,
        },
        {
          label: 'Low Market Growth Savings',
          data: calculatedData.trajectory.map(t => t.savingsConservative),
          borderColor: '#f59e0b', // Amber
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: 'Goal Cost (Inflation Adjusted)',
          data: calculatedData.trajectory.map(t => t.costModerate),
          borderColor: '#ef4444', // Red
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: {
            family: "'Outfit', sans-serif",
            size: 11
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: 12,
          font: {
            family: "'Outfit', sans-serif"
          }
        },
        grid: {
          color: '#334155',
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: {
            family: "'Outfit', sans-serif"
          },
          callback: function(value) {
            return '₹' + (value >= 100000 ? (value / 100000).toFixed(1) + ' L' : value);
          }
        },
        grid: {
          color: '#334155',
          drawBorder: false
        }
      }
    }
  };

  const formatINR = (value) => {
    if (value === '' || isNaN(value)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'Achievable':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badgeText: 'Achievable'
        };
      case 'Almost Achievable':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badgeText: 'Almost Achievable'
        };
      default:
        return {
          icon: <XCircle className="w-5 h-5 text-red-400" />,
          bgColor: 'bg-red-500/10 border-red-500/30 text-red-400',
          badgeText: 'Not Achievable'
        };
    }
  };

  const suggestions = generateSuggestions();
  const emiCalculation = calculateEMI();
  const activeShortfall = calculatedData ? calculatedData.scenarios.moderate.gap : 0;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/logo.png" alt="GoalHorizon Logo" className="navbar-logo mr-2 rounded-lg" />
          <span className="brand-title">GoalHorizon Predictor</span>
        </div>
        
        <div className="navbar-controls">
          {token ? (
            <div className="user-profile-widget">
              <button onClick={handleOpenProfile} className="btn-profile-trigger" title="Open Portfolio Analytics Dashboard">
                <User className="w-4 h-4" />
              </button>
              <span className="username-label mr-3">{username}</span>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut className="w-4 h-4 mr-1" /> Log Out
              </button>
            </div>
          ) : (
            <button onClick={() => { setAuthError(''); setShowAuthModal(true); }} className="btn-login-trigger">
              <LogIn className="w-4 h-4 mr-1" /> Sign In / Sign Up
            </button>
          )}
        </div>
      </nav>

      {/* Main Layout Grid */}
      <main className="main-content">
        <div className="grid-container">
          
          {/* Left Column: Form & Sandbox */}
          <div className="left-panel">
            <div className="card form-card">
              <div className="card-header">
                <Settings className="w-5 h-5 text-blue-400" />
                <h2>Goal Planning Inputs</h2>
              </div>
              
              <form onSubmit={handleAnalyzeSubmit} className="goal-form">
                <div className="form-group">
                  <label htmlFor="goal">Financial Goal</label>
                  <input 
                    type="text" 
                    id="goal" 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value)} 
                    placeholder="e.g. Dream Home, Retirement Fund"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="targetCost">Target Goal Cost (₹)</label>
                  <input 
                    type="text" 
                    id="targetCost" 
                    value={targetCost === 0 || targetCost === '' ? '' : targetCost} 
                    onChange={(e) => setTargetCost(e.target.value === '' ? '' : Number(e.target.value))} 
                    placeholder="e.g. 2500000"
                    required 
                  />
                  <span className="form-helper">{formatINR(targetCost)}</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="monthlySavings">Monthly Savings (₹)</label>
                    <input 
                      type="text" 
                      id="monthlySavings" 
                      value={monthlySavings === 0 || monthlySavings === '' ? '' : monthlySavings} 
                      onChange={(e) => setMonthlySavings(e.target.value === '' ? '' : Number(e.target.value))} 
                      placeholder="e.g. 45000"
                      required 
                    />
                    <span className="form-helper">{formatINR(monthlySavings)} / mo</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="years">Timeline (Years)</label>
                    <input 
                      type="text" 
                      id="years" 
                      value={years === 0 || years === '' ? '' : years} 
                      onChange={(e) => setYears(e.target.value === '' ? '' : Number(e.target.value))} 
                      placeholder="e.g. 5"
                      required 
                    />
                  </div>
                </div>

                {/* Adjust Market Conditions */}
                <div className="sandbox-section">
                  <div className="sandbox-header">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3>Adjust Market Conditions</h3>
                  </div>
                  
                  <div className="slider-group">
                    <div className="slider-label">
                      <span>Expected Return Rate:</span>
                      <span className="slider-value text-blue-400">{expectedReturn === '' ? 0 : expectedReturn}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      step="0.5"
                      value={expectedReturn === '' ? 0 : expectedReturn} 
                      onChange={(e) => setExpectedReturn(e.target.value === '' ? '' : Number(e.target.value))} 
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label">
                      <span>Annual Inflation Rate:</span>
                      <span className="slider-value text-red-400">{inflationRate === '' ? 0 : inflationRate}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      step="0.5"
                      value={inflationRate === '' ? 0 : inflationRate} 
                      onChange={(e) => setInflationRate(e.target.value === '' ? '' : Number(e.target.value))} 
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : token ? 'Save This Goal Plan' : 'Log In & Save Goal Plan'}
                </button>
              </form>

              {errorMessage && <div className="error-alert">{errorMessage}</div>}
              {successMessage && <div className="success-alert">{successMessage}</div>}
            </div>
          </div>

          {/* Right Column: Mode selector tabs & Panels */}
          <div className="right-panel">
            
            {/* Toggle Mode Navigation Tab bar */}
            <div className="dashboard-tab-bar">
              <button 
                onClick={() => setActiveMode('planner')}
                className={`tab-btn ${activeMode === 'planner' ? 'active' : ''}`}
              >
                <PieChart className="w-4 h-4 mr-2" /> Goal Planner
              </button>
              <button 
                onClick={() => setActiveMode('loan')}
                className={`tab-btn ${activeMode === 'loan' ? 'active' : ''}`}
              >
                <DollarSign className="w-4 h-4 mr-2" /> Goal Loan Estimator
              </button>
            </div>

            {/* TAB PANEL 1: Goal Planner */}
            {activeMode === 'planner' && (
              <div className="tab-panel-content animate-fade">
                
                {/* Feasibility Overview Banner */}
                {calculatedData && calculatedData.scenarios.moderate && (
                  <div className={`feasibility-banner ${getStatusDetails(calculatedData.scenarios.moderate.status).bgColor}`}>
                    <div className="flex items-center space-x-3">
                      {getStatusDetails(calculatedData.scenarios.moderate.status).icon}
                      <div>
                        <h3 className="font-semibold text-lg">
                          Goal Status: {getStatusDetails(calculatedData.scenarios.moderate.status).badgeText}
                        </h3>
                        <p className="text-sm opacity-90">
                          Expected Growth Capital Coverage: {calculatedData.scenarios.moderate.ratio}x goal cost. 
                          {calculatedData.scenarios.moderate.gap > 0 
                            ? ` Funding Shortfall of ${formatINR(calculatedData.scenarios.moderate.gap)} remains.` 
                            : ' Goal fully funded!'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scenario Savings Pathways Breakdown Cards */}
                {calculatedData && (
                  <div className="scenarios-grid">
                    
                    {/* Low Growth */}
                    <div className="scenario-card conservative">
                      <div className="scenario-tag">Low Growth</div>
                      <div className="scenario-metric">
                        <span className="label">Expected Return</span>
                        <span className="value">{calculatedData.scenarios.conservative.expectedReturn}%</span>
                      </div>
                      <div className="scenario-metric">
                        <span className="label">Inflation Rate</span>
                        <span className="value">{calculatedData.scenarios.conservative.inflationRate}%</span>
                      </div>
                      <div className="divider"></div>
                      <div className="scenario-metric">
                        <span className="label">Future Goal Cost</span>
                        <span className="value">{formatINR(calculatedData.scenarios.conservative.futureTargetCost)}</span>
                      </div>
                      <div className="scenario-metric">
                        <span className="label">Projected Savings</span>
                        <span className="value">{formatINR(calculatedData.scenarios.conservative.futureSavings)}</span>
                      </div>
                      <div className="divider"></div>
                      <div className="scenario-status-row">
                        <span className="status-indicator-dot conservative"></span>
                        <span className="status-text">{calculatedData.scenarios.conservative.status}</span>
                      </div>
                      <div className="required-monthly">
                        <span>Req. Savings: </span>
                        <strong>{formatINR(calculatedData.scenarios.conservative.requiredMonthlySavings)}/mo</strong>
                      </div>
                    </div>

                    {/* Expected Growth */}
                    <div className="scenario-card moderate active">
                      <div className="scenario-tag">Expected Growth</div>
                      <div className="scenario-metric">
                        <span className="label">Expected Return</span>
                        <span className="value">{calculatedData.scenarios.moderate.expectedReturn}%</span>
                      </div>
                      <div className="scenario-metric">
                        <span className="label">Inflation Rate</span>
                        <span className="value">{calculatedData.scenarios.moderate.inflationRate}%</span>
                      </div>
                      <div className="divider"></div>
                      <div className="scenario-metric">
                        <span className="label">Future Goal Cost</span>
                        <span className="value">{formatINR(calculatedData.scenarios.moderate.futureTargetCost)}</span>
                      </div>
                      <div className="scenario-metric">
                        <span className="label">Projected Savings</span>
                        <span className="value">{formatINR(calculatedData.scenarios.moderate.futureSavings)}</span>
                      </div>
                      <div className="divider"></div>
                      <div className="scenario-status-row">
                        <span className="status-indicator-dot moderate"></span>
                        <span className="status-text">{calculatedData.scenarios.moderate.status}</span>
                      </div>
                      <div className="required-monthly text-blue-400">
                        <span>Req. Savings: </span>
                        <strong>{formatINR(calculatedData.scenarios.moderate.requiredMonthlySavings)}/mo</strong>
                      </div>
                    </div>

                    {/* High Growth */}
                    <div className="scenario-card optimistic">
                      <div className="scenario-tag">High Growth</div>
                      <div className="scenario-metric">
                        <span className="label">Expected Return</span>
                        <span className="value">{calculatedData.scenarios.optimistic.expectedReturn}%</span>
                      </div>
                      <div className="scenario-metric">
                        <span className="label">Inflation Rate</span>
                        <span className="value">{calculatedData.scenarios.optimistic.inflationRate}%</span>
                      </div>
                      <div className="divider"></div>
                      <div className="scenario-metric">
                        <span className="label">Future Goal Cost</span>
                        <span className="value">{formatINR(calculatedData.scenarios.optimistic.futureTargetCost)}</span>
                      </div>
                      <div className="scenario-metric">
                        <span className="label">Projected Savings</span>
                        <span className="value">{formatINR(calculatedData.scenarios.optimistic.futureSavings)}</span>
                      </div>
                      <div className="divider"></div>
                      <div className="scenario-status-row">
                        <span className="status-indicator-dot optimistic"></span>
                        <span className="status-text">{calculatedData.scenarios.optimistic.status}</span>
                      </div>
                      <div className="required-monthly">
                        <span>Req. Savings: </span>
                        <strong>{formatINR(calculatedData.scenarios.optimistic.requiredMonthlySavings)}/mo</strong>
                      </div>
                    </div>

                  </div>
                )}

                {/* Recommendations Box */}
                {suggestions && (
                  <div className="card suggestions-card">
                    <div className="card-header">
                      <Info className="w-5 h-5 text-blue-400" />
                      <h2>Suggestions for Reaching Your Goal</h2>
                    </div>
                    <div className="suggestions-content">
                      <p className="suggestions-summary font-semibold">{suggestions.summary}</p>
                      <ul className="suggestions-tips-list">
                        {suggestions.tips.map((tip, idx) => (
                          <li key={idx} className="suggestions-tip-item">
                            <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Feasibility Projections Chart */}
                <div className="card chart-card">
                  <div className="card-header">
                    <LineChart className="w-5 h-5 text-emerald-400" />
                    <h2>Savings Growth Pathways</h2>
                  </div>
                  <div className="chart-wrapper">
                    {calculatedData ? (
                      <Line data={getChartData()} options={chartOptions} />
                    ) : (
                      <div className="chart-placeholder">Loading chart data...</div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB PANEL 2: Dedicated Goal Loan Estimator */}
            {activeMode === 'loan' && (
              <div className="tab-panel-content animate-fade">
                <div className="card emi-card">
                  <div className="card-header">
                    <Activity className="w-5 h-5 text-rose-400" />
                    <h2>Goal Loan & EMI Estimator</h2>
                  </div>
                  
                  <div className="emi-calculator-grid">
                    <div className="emi-calculator-inputs">
                      <p className="emi-calculator-intro mb-4">
                        If your savings plan has a shortfall, calculate the loan terms needed to borrow the difference.
                      </p>
                      
                      <div className="form-group mb-3">
                        <label>Loan Principal Amount (₹)</label>
                        <input 
                          type="text" 
                          value={customLoanAmount} 
                          onChange={(e) => setCustomLoanAmount(e.target.value === '' ? '' : Number(e.target.value))} 
                          placeholder={activeShortfall > 0 ? `Active Shortfall: ₹${activeShortfall.toLocaleString()}` : "Enter custom loan amount"}
                        />
                        {customLoanAmount === '' && activeShortfall > 0 && (
                          <span className="form-helper text-emerald-400">
                            Auto-filled with your current shortfall: <strong>{formatINR(activeShortfall)}</strong>.
                          </span>
                        )}
                        {customLoanAmount === '' && activeShortfall <= 0 && (
                          <span className="form-helper text-slate-400">
                            Your savings plan is fully funded! Enter any custom loan amount to estimate terms.
                          </span>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Interest Rate (% p.a.)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={loanInterest} 
                            onChange={(e) => setLoanInterest(Number(e.target.value))} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Repayment Term (Years)</label>
                          <input 
                            type="number" 
                            value={loanTenure} 
                            onChange={(e) => setLoanTenure(Number(e.target.value))} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="emi-calculator-outputs">
                      {emiCalculation ? (
                        <>
                          <div className="emi-result-card">
                            <span className="emi-result-label">Estimated Monthly Payment (EMI)</span>
                            <span className="emi-result-value text-rose-400">{formatINR(emiCalculation.emi)}</span>
                          </div>
                          <div className="emi-details-row">
                            <div className="emi-detail-item">
                              <span className="label">Total Interest Cost</span>
                              <span className="value">{formatINR(emiCalculation.totalInterest)}</span>
                            </div>
                            <div className="emi-detail-item">
                              <span className="label">Total Amount Repayable</span>
                              <span className="value">{formatINR(emiCalculation.totalRepayment)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="emi-empty-state text-center py-5">
                          <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-2 opacity-50" />
                          <p className="text-sm text-slate-400">
                            Enter a loan amount in the input field to calculate your monthly EMI and interest metrics.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Run History List (Requires Auth) */}
            <div className="card history-card">
              <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h2>Saved Goal Plans</h2>
                </div>
                
                {token && selectedIds.length > 0 && (
                  <button 
                    onClick={handleDeleteSelected}
                    className="btn-delete-bulk"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete Selected ({selectedIds.length})
                  </button>
                )}
              </div>
              
              <div className="history-list-wrapper">
                {!token ? (
                  <div className="history-auth-prompt">
                    <Lock className="w-10 h-10 opacity-30 mb-3 text-amber-400 animate-bounce" />
                    <h3>Goal History Vault Locked</h3>
                    <p className="max-w-md mx-auto text-sm text-slate-400 mt-1 mb-4">
                      Create a secure account or log in to catalog previous simulation runs, compare plans, and manage your history.
                    </p>
                    <button 
                      onClick={() => { setAuthError(''); setAuthMode('login'); setShowAuthModal(true); }}
                      className="btn-login-prompt"
                    >
                      Sign In / Register
                    </button>
                  </div>
                ) : history.length === 0 ? (
                  <div className="history-empty">
                    <FileSpreadsheet className="w-8 h-8 opacity-40 mb-2" />
                    <p>No saved goal plans found. Press "Save This Goal Plan" to catalog your first calculation.</p>
                  </div>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th className="checkbox-col">
                          <input 
                            type="checkbox" 
                            onChange={handleSelectAll} 
                            checked={selectedIds.length === history.length && history.length > 0} 
                          />
                        </th>
                        <th>Goal Name</th>
                        <th>Target Cost</th>
                        <th>Monthly Savings</th>
                        <th>Timeline</th>
                        <th>Market Config</th>
                        <th>Status</th>
                        <th className="actions-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item._id} className={`history-row ${selectedIds.includes(item._id) ? 'row-selected' : ''}`}>
                          <td className="checkbox-col">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(item._id)} 
                              onChange={() => handleSelectRow(item._id)} 
                            />
                          </td>
                          <td className="font-semibold text-white">{item.goal}</td>
                          <td>{formatINR(item.targetCost)}</td>
                          <td>{formatINR(item.monthlySavings)}/mo</td>
                          <td>{item.years} yrs</td>
                          <td>{item.expectedReturn}% / {item.inflationRate}%</td>
                          <td>
                            <span className={`status-badge-mini ${
                              item.scenarios.moderate.status === 'Achievable' ? 'badge-green' :
                              item.scenarios.moderate.status === 'Almost Achievable' ? 'badge-yellow' : 'badge-red'
                            }`}>
                              {item.scenarios.moderate.status}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button 
                              onClick={() => loadHistoryItem(item)}
                              className="btn-load-history mr-2"
                              title="Load parameters into workspace"
                            >
                              Load <ChevronRight className="w-3 h-3 ml-1" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(item._id)}
                              className="btn-delete-row"
                              title="Delete simulation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Auth Modal (Login / Sign Up Overlay) */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {authMode === 'login' ? (
                <>
                  <LogIn className="w-6 h-6 text-blue-400" />
                  <h2>Access Your Account</h2>
                </>
              ) : (
                <>
                  <UserPlus className="w-6 h-6 text-emerald-400" />
                  <h2>Register Account</h2>
                </>
              )}
              <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="modal-form">
              {authError && <div className="modal-error-alert">{authError}</div>}
              
              <div className="modal-form-group">
                <label htmlFor="authUsername">Username</label>
                <input 
                  type="text" 
                  id="authUsername"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Enter username (min 3 chars)"
                  required
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="authPassword">Password</label>
                <input 
                  type="password" 
                  id="authPassword"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter password (min 5 chars)"
                  required
                />
              </div>

              <button type="submit" className={`modal-btn-submit ${authMode === 'login' ? 'btn-blue' : 'btn-emerald'}`}>
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="modal-switch-mode">
                {authMode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <span onClick={() => { setAuthMode('register'); setAuthError(''); }} className="switch-link text-emerald-400">
                      Sign up here
                    </span>
                  </p>
                ) : (
                  <p>
                    Already registered?{' '}
                    <span onClick={() => { setAuthMode('login'); setAuthError(''); }} className="switch-link text-blue-400">
                      Log in here
                    </span>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile & Portfolio Stats Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <User className="w-6 h-6 text-blue-400" />
              <h2>Portfolio Analytics & Profile</h2>
              <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}>&times;</button>
            </div>
            
            <div className="profile-modal-body">
              <div className="profile-meta-row mb-4">
                <div className="user-avatar-large mr-3">
                  {username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">{username}</h3>
                  <span className="text-sm text-slate-400">Portfolio Status: Active</span>
                </div>
              </div>

              {statsLoading ? (
                <div className="profile-loading-spinner text-center py-5">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
                  <p className="text-sm text-slate-400 mt-2">Aggregating portfolio simulations...</p>
                </div>
              ) : profileStats ? (
                <div className="profile-stats-container">
                  <h4 className="section-title-mini text-slate-400 mb-3 uppercase tracking-wider text-xs font-bold">Aggregate Statistics</h4>
                  <div className="profile-stats-grid mb-4">
                    <div className="stat-box">
                      <span className="stat-label">Total Saved Plans</span>
                      <span className="stat-value text-white">{profileStats.totalSimulations}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Goal Capital Tracked</span>
                      <span className="stat-value text-blue-400">{formatINR(profileStats.totalTargetCost)}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Avg. Timeline</span>
                      <span className="stat-value text-white">{profileStats.avgTimeline} yrs</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Avg. Expected Return</span>
                      <span className="stat-value text-emerald-400">{profileStats.avgReturn}%</span>
                    </div>
                  </div>

                  <h4 className="section-title-mini text-slate-400 mb-2 uppercase tracking-wider text-xs font-bold">Goal Success Distribution</h4>
                  <div className="feasibility-outcomes-wrapper mb-3">
                    <div className="feasibility-outcome-bar">
                      <div 
                        className="bar-segment segments-achievable" 
                        style={{ width: `${(profileStats.achievableCount / (profileStats.totalSimulations || 1)) * 100}%` }}
                        title={`Achievable: ${profileStats.achievableCount}`}
                      ></div>
                      <div 
                        className="bar-segment segments-almost" 
                        style={{ width: `${(profileStats.almostCount / (profileStats.totalSimulations || 1)) * 100}%` }}
                        title={`Almost Achievable: ${profileStats.almostCount}`}
                      ></div>
                      <div 
                        className="bar-segment segments-not" 
                        style={{ width: `${(profileStats.notCount / (profileStats.totalSimulations || 1)) * 100}%` }}
                        title={`Not Achievable: ${profileStats.notCount}`}
                      ></div>
                    </div>
                    <div className="feasibility-outcome-labels">
                      <div className="outcome-label-item">
                        <span className="dot dot-green"></span>
                        <span>Achievable: <strong>{profileStats.achievableCount}</strong></span>
                      </div>
                      <div className="outcome-label-item">
                        <span className="dot dot-yellow"></span>
                        <span>Almost: <strong>{profileStats.almostCount}</strong></span>
                      </div>
                      <div className="outcome-label-item">
                        <span className="dot dot-red"></span>
                        <span>Not Achievable: <strong>{profileStats.notCount}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="profile-error-alert text-center py-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">Unable to load aggregate portfolio metrics.</p>
                </div>
              )}
              
              <div className="profile-modal-footer mt-4 pt-3 border-t border-slate-800">
                <button className="btn-profile-close" onClick={() => setShowProfileModal(false)}>Close Portfolio</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
