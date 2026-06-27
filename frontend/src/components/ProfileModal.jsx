import React from 'react';
import { User, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ProfileModal({
  showProfileModal,
  setShowProfileModal,
  username,
  statsLoading,
  profileStats,
  formatINR
}) {
  if (!showProfileModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
      <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <User className="w-6 h-6 text-blue-400" />
          <h2>Portfolio Analytics & Profile</h2>
          <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}>&times;</button>
        </div>
        
        <div className="profile-modal-body">
          <div className="profile-meta-row mb-4" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div className="user-avatar-large mr-3">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-white text-lg font-bold" style={{ margin: 0 }}>{username}</h3>
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
  );
}
