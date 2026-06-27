import React from 'react';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthModal({
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  handleAuthSubmit
}) {
  if (!showAuthModal) return null;

  return (
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
  );
}
