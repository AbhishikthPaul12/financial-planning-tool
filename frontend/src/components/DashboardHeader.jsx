import React from 'react';
import { User, LogOut, LogIn } from 'lucide-react';

export default function DashboardHeader({ 
  token, 
  username, 
  handleOpenProfile, 
  handleLogout, 
  setShowAuthModal, 
  setAuthError 
}) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/logo.png" alt="GoalHorizon Logo" className="navbar-logo mr-2 rounded-lg" />
        <span className="brand-title">GoalHorizon Predictor</span>
      </div>
      
      <div className="navbar-controls">
        {token ? (
          <div className="user-profile-widget">
            <button 
              onClick={handleOpenProfile} 
              className="btn-profile-trigger" 
              title="Open Portfolio Analytics Dashboard"
            >
              <User className="w-4 h-4" />
            </button>
            <span className="username-label mr-3">{username}</span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut className="w-4 h-4 mr-1" /> Log Out
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setAuthError(''); setShowAuthModal(true); }} 
            className="btn-login-trigger"
          >
            <LogIn className="w-4 h-4 mr-1" /> Sign In / Sign Up
          </button>
        )}
      </div>
    </nav>
  );
}
