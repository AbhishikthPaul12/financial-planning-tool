import React from 'react';
import { Clock, Trash2, Lock, FileSpreadsheet, ChevronRight } from 'lucide-react';

export default function SavedPlans({
  token,
  history,
  selectedIds,
  handleSelectAll,
  handleSelectRow,
  handleDeleteSelected,
  handleDeleteRow,
  loadHistoryItem,
  setShowAuthModal,
  setAuthError,
  setAuthMode,
  formatINR
}) {
  return (
    <div className="card history-card">
      <div className="card-header justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex items-center gap-2" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
  );
}
