import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { Mail, Lock, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Login = ({ onLogin }) => {
  const [isFlipped, setIsFlipped] = useState(false); // false = Sign In, true = Sign Up
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      if (!auth) throw new Error("Firebase not configured");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.displayName) {
        onLogin(user.displayName.replace(/[^a-zA-Z0-9]/g, ''));
      }
    } catch (err) {
      console.error(err);
      setError(err.message === "Firebase not configured" ? err.message : 'Google Sign-In failed.');
    }
  };

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    try {
      setIsLoading(true);
      setError('');
      
      const endpoint = type === 'signin' ? '/login' : '/register';
      const payload = { username: username.trim(), password };
      if (type === 'signup') {
        payload.email = email.trim();
      }

      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const data = await res.json();
          onLogin(data.username);
          return;
        } else {
          const data = await res.json();
          throw new Error(data.error || "Authentication failed");
        }
      } catch (err) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          console.warn("Backend not available, falling back to local storage.");
          if (type === 'signup') {
            const existing = localStorage.getItem(`user_${username.trim()}`);
            if (existing) throw new Error("Username already exists locally. Please sign in.");
            localStorage.setItem(`user_${username.trim()}`, password);
            if (email.trim()) localStorage.setItem(`user_${username.trim()}_email`, email.trim());
            onLogin(username.trim());
            return;
          } else {
            const storedPass = localStorage.getItem(`user_${username.trim()}`);
            if (storedPass && storedPass === password) {
              onLogin(username.trim());
              return;
            } else if (!storedPass) {
              throw new Error("User not found locally. Please sign up.");
            } else {
              throw new Error("Invalid password.");
            }
          }
        }
        throw err;
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const SocialLinks = () => (
    <div className="flex justify-center gap-4 mb-4 mt-2">
      <button type="button" onClick={handleGoogleSignIn} className="w-10 h-10 rounded-full border border-glass-border flex items-center justify-center hover:border-brand-primary hover:text-brand-primary transition-colors bg-glass-bg text-glass-text shadow-sm">
        <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      </button>
      <button type="button" className="w-10 h-10 rounded-full border border-glass-border flex items-center justify-center hover:border-brand-primary hover:text-brand-primary transition-colors bg-glass-bg text-glass-text shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
      </button>
    </div>
  );

  return (
    <div className="h-screen w-full bg-glass-bg flex items-center justify-center p-4 selection:bg-brand-primary/30 overflow-hidden font-sans">
      
      {/* Required CSS for the precise Double Slider animation */}
      <style>{`
        .custom-container {
          background-color: var(--glass-panel);
          border: 1px solid var(--glass-border);
          border-radius: 1.5rem;
          box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
          position: relative;
          overflow: hidden;
          width: 850px;
          max-width: 100%;
          min-height: 550px;
        }

        .custom-form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
        }

        .custom-sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }

        .custom-container.active .custom-sign-in-container {
          transform: translateX(100%);
          opacity: 0;
          z-index: 1;
        }

        .custom-sign-up-container {
          left: 0;
          width: 50%;
          opacity: 0;
          z-index: 1;
        }

        .custom-container.active .custom-sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .custom-overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }

        .custom-container.active .custom-overlay-container {
          transform: translateX(-100%);
        }

        .custom-overlay {
          background: #8B5CF6;
          background: linear-gradient(to right, #d946ef, #8B5CF6);
          background-repeat: no-repeat;
          background-size: cover;
          background-position: 0 0;
          color: #FFFFFF;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .custom-container.active .custom-overlay {
          transform: translateX(50%);
        }

        .custom-overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 40px;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }

        .custom-overlay-left {
          transform: translateX(-20%);
        }

        .custom-container.active .custom-overlay-left {
          transform: translateX(0);
        }

        .custom-overlay-right {
          right: 0;
          transform: translateX(0);
        }

        .custom-container.active .custom-overlay-right {
          transform: translateX(20%);
        }
      `}</style>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-brand-primary/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] bg-brand-secondary/40 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className={`custom-container ${isFlipped ? 'active' : ''}`}>
        
        {/* Sign Up Container */}
        <div className="custom-form-container custom-sign-up-container bg-glass-panel flex items-center justify-center">
          <form onSubmit={(e) => handleSubmit(e, 'signup')} className="bg-glass-panel flex items-center justify-center flex-col px-10 w-full h-full text-center">
            <h1 className="font-bold text-3xl m-0 text-glass-text">Create Account</h1>
            <SocialLinks />
            <span className="text-xs mb-4 text-glass-muted">or use your email for registration</span>
            
            {error && <p className="text-accent-danger text-xs w-full bg-accent-danger/10 p-2 rounded mb-2 border border-accent-danger/20">{error}</p>}
            
            <div className="relative w-full mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-glass-muted" />
              </div>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-glass-bg border border-glass-border px-4 py-3 pl-10 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-primary text-glass-text" />
            </div>

            <div className="relative w-full mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-glass-muted" />
              </div>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-glass-bg border border-glass-border px-4 py-3 pl-10 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-primary text-glass-text" />
            </div>

            <div className="relative w-full mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-glass-muted" />
              </div>
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-glass-bg border border-glass-border px-4 py-3 pl-10 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-primary text-glass-text" />
            </div>

            <button type="submit" disabled={isLoading || !username || !password} className="rounded-[20px] border border-[#8B5CF6] bg-[#8B5CF6] text-white text-[12px] font-bold py-3 px-11 tracking-[1px] uppercase transition-transform active:scale-95 hover:bg-[#7c3aed] outline-none disabled:opacity-70 mt-2">
              {isLoading ? 'Wait...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Container */}
        <div className="custom-form-container custom-sign-in-container bg-glass-panel flex items-center justify-center">
          <form onSubmit={(e) => handleSubmit(e, 'signin')} className="bg-glass-panel flex items-center justify-center flex-col px-10 w-full h-full text-center">
            <h1 className="font-bold text-3xl m-0 text-glass-text">Sign In</h1>
            <SocialLinks />
            <span className="text-xs mb-4 text-glass-muted">or use your account</span>
            
            {error && <p className="text-accent-danger text-xs w-full bg-accent-danger/10 p-2 rounded mb-2 border border-accent-danger/20">{error}</p>}
            
            <div className="relative w-full mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-glass-muted" />
              </div>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-glass-bg border border-glass-border px-4 py-3 pl-10 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-primary text-glass-text" />
            </div>

            <div className="relative w-full mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-glass-muted" />
              </div>
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-glass-bg border border-glass-border px-4 py-3 pl-10 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-primary text-glass-text" />
            </div>

            <a href="#" className="text-glass-muted hover:text-glass-text transition-colors text-sm mb-4 decoration-none">Forgot your password?</a>
            <button type="submit" disabled={isLoading || !username || !password} className="rounded-[20px] border border-[#8B5CF6] bg-[#8B5CF6] text-white text-[12px] font-bold py-3 px-11 tracking-[1px] uppercase transition-transform active:scale-95 hover:bg-[#7c3aed] outline-none disabled:opacity-70">
              {isLoading ? 'Wait...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className="custom-overlay-container pointer-events-none">
          <div className="custom-overlay">
            {/* Left Panel */}
            <div className="custom-overlay-panel custom-overlay-left pointer-events-auto">
              <h1 className="font-bold text-3xl m-0 mb-4">Hello, Friend!</h1>
              <p className="text-[14px] font-[300] leading-5 tracking-[0.5px] mt-0 mb-8 mx-0">Enter your personal details and start your journey with us</p>
              <button onClick={() => {
                setError('');
                setUsername('');
                setEmail('');
                setPassword('');
                setIsFlipped(false);
              }} className="bg-transparent border border-white text-white rounded-[20px] text-[12px] font-bold py-3 px-11 tracking-[1px] uppercase transition-transform active:scale-95 hover:bg-white hover:text-[#8B5CF6] outline-none">
                Sign In
              </button>
            </div>
            
            {/* Right Panel */}
            <div className="custom-overlay-panel custom-overlay-right pointer-events-auto">
              <h1 className="font-bold text-3xl m-0 mb-4">Welcome Back!</h1>
              <p className="text-[14px] font-[300] leading-5 tracking-[0.5px] mt-0 mb-8 mx-0">To keep connected with us please login with your personal info</p>
              <button onClick={() => {
                setError('');
                setUsername('');
                setEmail('');
                setPassword('');
                setIsFlipped(true);
              }} className="bg-transparent border border-white text-white rounded-[20px] text-[12px] font-bold py-3 px-11 tracking-[1px] uppercase transition-transform active:scale-95 hover:bg-white hover:text-[#8B5CF6] outline-none">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
