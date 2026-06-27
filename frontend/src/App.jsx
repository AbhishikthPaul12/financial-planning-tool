import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  XCircle
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

// Financial Engine Helpers
import {
  formatINR,
  runLocalProjections,
  generateSuggestions,
  calculateEMI
} from './utils/financialEngine';

// Modular Presentation Components
import DashboardHeader from './components/DashboardHeader';
import GoalForm from './components/GoalForm';
import GoalPlanner from './components/GoalPlanner';
import LoanEstimator from './components/LoanEstimator';
import SavedPlans from './components/SavedPlans';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';

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
  const [loanInterest, setLoanInterest] = useState(10.5);
  const [loanTenure, setLoanTenure] = useState(3);
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
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
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: 'Expected Market Growth Savings (Expected)',
          data: calculatedData.trajectory.map(t => t.savingsModerate),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointRadius: 0,
          fill: true,
        },
        {
          label: 'Low Market Growth Savings',
          data: calculatedData.trajectory.map(t => t.savingsConservative),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: 'Goal Cost (Inflation Adjusted)',
          data: calculatedData.trajectory.map(t => t.costModerate),
          borderColor: '#ef4444',
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

  const suggestions = generateSuggestions(calculatedData, targetCost, monthlySavings, years, expectedReturn, inflationRate);
  const emiCalculation = calculateEMI(calculatedData, customLoanAmount, loanInterest, loanTenure);

  if (!token) {
    return (
      <div className="auth-wall-container animate-fade">
        <div className="auth-wall-card">
          <div className="auth-wall-header">
            <img src="/logo.png" alt="GoalHorizon Logo" className="auth-wall-logo" />
            <h1 className="brand-title">GoalHorizon</h1>
            <p>Predict goal feasibility, sandbox savings growth pathways, and estimate EMIs under a secure personal portfolio.</p>
          </div>
          
          <div className="auth-wall-tabs">
            <button 
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-wall-form">
            {authError && <div className="modal-error-alert">{authError}</div>}
            
            <div className="modal-form-group">
              <label>Username</label>
              <input 
                type="text" 
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Enter username (min 3 chars)"
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter password (min 5 chars)"
                required
              />
            </div>

            <button type="submit" className={`auth-wall-submit ${authMode === 'login' ? 'btn-blue' : 'btn-emerald'}`}>
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <DashboardHeader 
        token={token}
        username={username}
        handleOpenProfile={handleOpenProfile}
        handleLogout={handleLogout}
        setShowAuthModal={setShowAuthModal}
        setAuthError={setAuthError}
      />

      {/* Main Layout Grid */}
      <main className="main-content">
        <div className="grid-container">
          
          {/* Left Column: Form & Sandbox */}
          <div className="left-panel">
            <GoalForm 
              goal={goal}
              setGoal={setGoal}
              targetCost={targetCost}
              setTargetCost={setTargetCost}
              monthlySavings={monthlySavings}
              setMonthlySavings={setMonthlySavings}
              years={years}
              setYears={setYears}
              expectedReturn={expectedReturn}
              setExpectedReturn={setExpectedReturn}
              inflationRate={inflationRate}
              setInflationRate={setInflationRate}
              handleAnalyzeSubmit={handleAnalyzeSubmit}
              loading={loading}
              token={token}
              formatINR={formatINR}
            />
            {errorMessage && <div className="error-alert">{errorMessage}</div>}
            {successMessage && <div className="success-alert">{successMessage}</div>}
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
                <IndianRupee className="w-4 h-4 mr-2" /> Goal Loan Estimator
              </button>
            </div>

            {/* TAB PANEL 1: Goal Planner */}
            {activeMode === 'planner' && (
              <GoalPlanner 
                calculatedData={calculatedData}
                suggestions={suggestions}
                getChartData={getChartData}
                chartOptions={chartOptions}
                getStatusDetails={getStatusDetails}
                formatINR={formatINR}
              />
            )}

            {/* TAB PANEL 2: Dedicated Goal Loan Estimator */}
            {activeMode === 'loan' && (
              <LoanEstimator 
                calculatedData={calculatedData}
                customLoanAmount={customLoanAmount}
                setCustomLoanAmount={setCustomLoanAmount}
                loanInterest={loanInterest}
                setLoanInterest={setLoanInterest}
                loanTenure={loanTenure}
                setLoanTenure={setLoanTenure}
                emiCalculation={emiCalculation}
                formatINR={formatINR}
              />
            )}

            {/* Run History List */}
            <SavedPlans 
              token={token}
              history={history}
              selectedIds={selectedIds}
              handleSelectAll={handleSelectAll}
              handleSelectRow={handleSelectRow}
              handleDeleteSelected={handleDeleteSelected}
              handleDeleteRow={handleDeleteRow}
              loadHistoryItem={loadHistoryItem}
              setShowAuthModal={setShowAuthModal}
              setAuthError={setAuthError}
              setAuthMode={setAuthMode}
              formatINR={formatINR}
            />

          </div>

        </div>
      </main>

      {/* Auth Modal Overlay */}
      <AuthModal 
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authUsername={authUsername}
        setAuthUsername={setAuthUsername}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        setAuthError={setAuthError}
        handleAuthSubmit={handleAuthSubmit}
      />

      {/* Profile & Portfolio Stats Modal */}
      <ProfileModal 
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        username={username}
        statsLoading={statsLoading}
        profileStats={profileStats}
        formatINR={formatINR}
      />
    </div>
  );
}
