import React from 'react';
import { Info, LineChart, ChevronRight } from 'lucide-react';
import { Line } from 'react-chartjs-2';

export default function GoalPlanner({
  calculatedData,
  suggestions,
  getChartData,
  chartOptions,
  getStatusDetails,
  formatINR
}) {
  if (!calculatedData) return null;
  const moderate = calculatedData.scenarios.moderate;

  return (
    <div className="tab-panel-content animate-fade">
      
      {/* Feasibility Overview Banner */}
      {moderate && (
        <div className={`feasibility-banner ${getStatusDetails(moderate.status).bgColor}`}>
          <div className="flex items-center space-x-3" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {getStatusDetails(moderate.status).icon}
            <div>
              <h3 className="font-semibold text-lg" style={{ margin: 0 }}>
                Goal Status: {getStatusDetails(moderate.status).badgeText}
              </h3>
              <p className="text-sm opacity-90" style={{ margin: '0.2rem 0 0 0' }}>
                Expected Growth Capital Coverage: {moderate.ratio}x goal cost. 
                {moderate.gap > 0 
                  ? ` Funding Shortfall of ${formatINR(moderate.gap)} remains.` 
                  : ' Goal fully funded!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Savings Pathways Breakdown Cards */}
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
          <Line data={getChartData()} options={chartOptions} />
        </div>
      </div>

    </div>
  );
}
