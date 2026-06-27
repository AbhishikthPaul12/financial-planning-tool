import React from 'react';
import { Activity, IndianRupee } from 'lucide-react';

export default function LoanEstimator({
  calculatedData,
  customLoanAmount,
  setCustomLoanAmount,
  loanInterest,
  setLoanInterest,
  loanTenure,
  setLoanTenure,
  emiCalculation,
  formatINR
}) {
  const activeShortfall = calculatedData ? calculatedData.scenarios.moderate.gap : 0;

  return (
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
                <IndianRupee className="w-12 h-12 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-slate-400">
                  Enter a loan amount in the input field to calculate your monthly EMI and interest metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
