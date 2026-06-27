import React from 'react';
import { Settings, Sparkles, RefreshCw } from 'lucide-react';

export default function GoalForm({
  goal,
  setGoal,
  targetCost,
  setTargetCost,
  monthlySavings,
  setMonthlySavings,
  years,
  setYears,
  expectedReturn,
  setExpectedReturn,
  inflationRate,
  setInflationRate,
  handleAnalyzeSubmit,
  loading,
  token,
  formatINR
}) {
  return (
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
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
          ) : token ? (
            'Save This Goal Plan'
          ) : (
            'Log In & Save Goal Plan'
          )}
        </button>
      </form>
    </div>
  );
}
