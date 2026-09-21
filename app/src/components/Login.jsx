import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Login = ({ onLogin }) => {
  const [view, setView] = useState('main'); // 'main', 'signin', 'signup', 'google-username'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [googleId, setGoogleId] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callAuthEndpoint = async (endpoint, payload) => {
    try {
      setIsLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      
      onLogin(data.username);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to backend server.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!auth) throw new Error("Firebase not configured");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setGoogleId(user.uid);
      
      if (user.displayName) {
        // Attempt to login directly if they have a display name
        await callAuthEndpoint('/google-auth', { 
          username: user.displayName.replace(/[^a-zA-Z0-9]/g, ''), 
          googleId: user.uid 
        });
      } else {
        setView('google-username');
      }
    } catch (err) {
      console.error(err);
      setError(err.message === "Firebase not configured" ? err.message : 'Google Sign-In failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    if (view === 'signin') {
      await callAuthEndpoint('/login', { username: username.trim(), password });
    } else if (view === 'signup') {
      await callAuthEndpoint('/register', { username: username.trim(), password });
    } else if (view === 'google-username') {
      await callAuthEndpoint('/google-auth', { username: username.trim(), googleId });
    }
  };

  const resetView = () => {
    setView('main');
    setError('');
    setUsername('');
    setPassword('');
    setGoogleId(null);
  };

  return (
    <div className="min-h-screen bg-glass-bg text-glass-text flex items-center justify-center p-4 selection:bg-brand-primary/30">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 md:p-12 w-full max-w-md relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.6)] mb-6 z-10">
          <span className="text-white font-black text-2xl">LT</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 z-10">
          {view === 'main' && 'Welcome Back'}
          {view === 'signin' && 'Sign In'}
          {view === 'signup' && 'Create Account'}
          {view === 'google-username' && 'Complete Profile'}
        </h1>
        <p className="text-glass-muted text-center mb-8 z-10">
          {view === 'main' && 'Continue your LeetCode mastery journey.'}
          {view === 'signin' && 'Enter your credentials to continue.'}
          {view === 'signup' && 'Join the forge and track your progress.'}
          {view === 'google-username' && 'Choose a username to enter the forge.'}
        </p>

        {view === 'main' && (
          <div className="w-full z-10 flex flex-col gap-4">
            {error && <p className="text-accent-danger text-sm mb-2 text-center">{error}</p>}
            
            <button 
              onClick={() => setView('signin')}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] transition-all"
            >
              Sign In
            </button>
            
            <button 
              onClick={() => setView('signup')}
              className="w-full py-3 px-4 bg-black/20 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all text-sm"
            >
              Sign Up
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-white/30 text-xs uppercase">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white text-black rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign In with Google
            </button>
          </div>
        )}

        {view !== 'main' && (
          <form onSubmit={handleSubmit} className="w-full z-10">
            {error && <p className="text-accent-danger text-sm mb-4 text-center">{error}</p>}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-glass-muted">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all text-glass-text placeholder-glass-muted"
                placeholder="Enter your username"
                autoFocus
              />
            </div>
            
            {(view === 'signin' || view === 'signup') && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-glass-muted">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all text-glass-text placeholder-glass-muted"
                  placeholder="Enter a secure password"
                />
              </div>
            )}
            
            <button 
              type="submit"
              className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] transition-all disabled:opacity-50 mb-4"
              disabled={!username.trim() || ((view === 'signin' || view === 'signup') && !password) || isLoading}
            >
              {isLoading ? 'Processing...' : (view === 'signin' ? 'Sign In' : (view === 'signup' ? 'Sign Up' : 'Continue'))}
            </button>
            
            <button 
              type="button"
              onClick={resetView}
              className="w-full py-3 px-4 bg-black/20 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all text-sm"
            >
              Back
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
