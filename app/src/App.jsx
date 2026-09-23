import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import questionsData from './data/questions.json';
import SideNav from './components/SideNav';
import Login from './components/Login';
import './index.css';
import achievementsData from './data/achievements.json';
import { calculateStreak, getDailyCounts, getPeriodicStats, getTimeStats, calculateXP, calculateLevel, getDailyQuests, getUnlockedAchievements } from './utils';

const Dashboard = lazy(() => import('./components/Dashboard'));
const SkillTree = lazy(() => import('./components/SkillTree'));
const ProblemBoard = lazy(() => import('./components/ProblemBoard'));
const Analytics = lazy(() => import('./components/Analytics'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [questions] = useState(questionsData);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem('completedQuestions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const today = new Date().toISOString().split('T')[0];
        const newCompleted = {};
        parsed.forEach(id => newCompleted[id] = today);
        return newCompleted;
      }
      return parsed;
    }
    return {};
  });

  const [trackedTime, setTrackedTime] = useState(() => {
    const saved = localStorage.getItem('trackedTime');
    return saved ? JSON.parse(saved) : {};
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Fetch initial data from backend on login
  useEffect(() => {
    if (username) {
      fetch(`${API_URL}/sync/${username}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch data");
        })
        .then(data => {
          if (data.completed && Object.keys(data.completed).length > 0) {
            setCompleted(prev => ({...prev, ...data.completed}));
          }
          if (data.trackedTime && Object.keys(data.trackedTime).length > 0) {
            setTrackedTime(prev => ({...prev, ...data.trackedTime}));
          }
        })
        .catch(err => console.error("Error fetching from backend:", err));
    }
  }, [username]);

  // Sync to localStorage and Backend when completed or trackedTime changes
  useEffect(() => {
    localStorage.setItem('completedQuestions', JSON.stringify(completed));
    localStorage.setItem('trackedTime', JSON.stringify(trackedTime));
    
    if (username) {
      // Sync to backend
      fetch(`${API_URL}/sync/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, trackedTime })
      }).catch(err => console.error("Error syncing to backend:", err));
    }
  }, [completed, trackedTime, username]);

  useEffect(() => {
    localStorage.setItem('username', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleCompletion = useCallback((id) => {
    setCompleted(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = new Date().toISOString().split('T')[0];
      }
      return next;
    });
  }, []);

  const addTrackedTime = useCallback((seconds) => {
    if (seconds <= 0) return;
    const today = new Date().toISOString().split('T')[0];
    setTrackedTime(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + seconds
    }));
  }, []);

  const pickRandomProblem = useCallback(() => {
    const incomplete = questions.filter(q => !completed[q.id]);
    if (incomplete.length === 0) {
      alert("You've completed all problems! 🎉");
      return;
    }
    const randomIndex = Math.floor(Math.random() * incomplete.length);
    const problem = incomplete[randomIndex];
    window.open(problem.url, '_blank', 'noopener,noreferrer');
  }, [questions, completed]);

  const patternsData = useMemo(() => {
    const groups = {};
    questions.forEach(q => {
      const p = q.pattern || 'Uncategorized';
      if (!groups[p]) groups[p] = [];
      groups[p].push(q);
    });
    
    return Object.keys(groups).map(pattern => {
      const qs = groups[pattern];
      const completedCount = qs.filter(q => completed[q.id]).length;
      return {
        name: pattern,
        questions: qs,
        total: qs.length,
        completed: completedCount,
        progress: qs.length > 0 ? (completedCount / qs.length) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);
  }, [questions, completed]);

  const totalQuestions = questions.length;
  const completedQuestionsCount = Object.keys(completed).length;
  const overallProgress = totalQuestions > 0 ? (completedQuestionsCount / totalQuestions) * 100 : 0;
  
  const currentStreak = useMemo(() => calculateStreak(completed), [completed]);
  const heatmapData = useMemo(() => getDailyCounts(completed), [completed]);
  const { monthlyCompleted } = useMemo(() => getPeriodicStats(completed), [completed]);
  const timeStats = useMemo(() => getTimeStats(trackedTime), [trackedTime]);
  const totalXP = useMemo(() => calculateXP(completed, questions), [completed, questions]);
  const levelData = useMemo(() => calculateLevel(totalXP), [totalXP]);
  const dailyQuests = useMemo(() => getDailyQuests(questions, completed), [questions, completed]);
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(completed, questions, currentStreak), [completed, questions, currentStreak]);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem('username');
    setUsername('');
    setCompleted({});
    setTrackedTime({});
  }, []);

  if (!username) {
    return <Login onLogin={setUsername} />;
  }

  return (
    <div className="min-h-screen bg-glass-bg text-glass-text font-sans selection:bg-brand-primary/30 flex">
      <Suspense fallback={null}>
        {isSettingsOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)}
            achievements={achievementsData}
            unlockedAchievements={unlockedAchievements}
          />
        )}
      </Suspense>

      <SideNav 
        theme={theme} 
        toggleTheme={toggleTheme} 
        username={username}
        level={levelData.level}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="flex-1 ml-64 p-3 md:p-4 h-screen overflow-hidden flex items-center justify-center">
        <div className="max-w-[1400px] w-full h-full flex flex-col justify-center">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-glass-muted">Loading...</div>}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                overallProgress={overallProgress}
                completedQuestionsCount={completedQuestionsCount}
                totalQuestions={totalQuestions}
                currentStreak={currentStreak}
                levelData={levelData}
                timeStats={timeStats}
                monthlyCompleted={monthlyCompleted}
                pickRandomProblem={pickRandomProblem}
                addTrackedTime={addTrackedTime}
                dailyQuests={dailyQuests}
                completedData={completed}
                toggleCompletion={toggleCompletion}
                heatmapData={heatmapData}
              />
            )}
            
            {activeTab === 'skillTree' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Skill Tree</h1>
                  <p className="text-glass-muted">Unlock your path to mastery. Follow the flowing data.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <SkillTree 
                    patterns={patternsData} 
                    completed={completed} 
                    toggleCompletion={toggleCompletion} 
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'problemBoard' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Problem Board</h1>
                  <p className="text-glass-muted">Master patterns with our 3D challenge viewer.</p>
                </div>
                <div className="flex-1 min-h-[500px]">
                  <ProblemBoard
                    patterns={patternsData}
                    completed={completed}
                    toggleCompletion={toggleCompletion}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'analytics' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Performance Analytics</h1>
                  <p className="text-glass-muted">Deep dive into your solving speed, volume, and time logged.</p>
                </div>
                <Analytics 
                  completed={completed} 
                  trackedTime={trackedTime} 
                  questions={questions} 
                />
              </div>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
