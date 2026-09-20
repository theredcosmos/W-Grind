import React, { useState, useEffect, useMemo, useCallback } from 'react';
import questionsData from './data/questions.json';
import TopNav from './components/TopNav';
import HeroSection from './components/HeroSection';
import SubMetrics from './components/SubMetrics';
import SkillTree from './components/SkillTree';
import AlgorithmMastery from './components/AlgorithmMastery';
import StreakActivity from './components/StreakActivity';
import Login from './components/Login';
import SettingsModal from './components/SettingsModal';
import './index.css';
import achievementsData from './data/achievements.json';
import { calculateStreak, getDailyCounts, getPeriodicStats, getTimeStats, calculateXP, calculateLevel, getDailyQuests, getUnlockedAchievements } from './utils';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [questions] = useState(questionsData);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [forgeView, setForgeView] = useState('tree'); // 'tree' or 'cards'
  
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
    <div className="min-h-screen bg-glass-bg text-glass-text p-4 md:p-8 font-sans selection:bg-brand-primary/30 relative">
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
          achievements={achievementsData}
          unlockedAchievements={unlockedAchievements}
        />
      )}
      
      <div className="max-w-[1400px] mx-auto space-y-8">
        <TopNav 
          theme={theme} 
          toggleTheme={toggleTheme} 
          username={username}
          level={levelData.level}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSignOut={handleSignOut}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-full">
            <HeroSection 
              progress={overallProgress} 
              completed={completedQuestionsCount} 
              total={totalQuestions} 
              streak={currentStreak}
              levelData={levelData}
            />
          </div>
          <div className="lg:col-span-7 h-full">
            <SubMetrics 
              timeStats={timeStats}
              monthlyCompleted={monthlyCompleted}
              pickRandomProblem={pickRandomProblem}
              addTrackedTime={addTrackedTime}
              dailyQuests={dailyQuests}
              completedData={completed}
              toggleCompletion={toggleCompletion}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">The Forge</h2>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-glass-border to-transparent hidden md:block"></div>
            </div>
            <div className="flex items-center bg-black/20 dark:bg-white/5 rounded-lg p-1 border border-glass-border">
              <button 
                onClick={() => setForgeView('cards')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${forgeView === 'cards' ? 'bg-brand-primary text-white shadow-md' : 'text-glass-muted hover:text-glass-text'}`}
              >
                Cards
              </button>
              <button 
                onClick={() => setForgeView('tree')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${forgeView === 'tree' ? 'bg-brand-primary text-white shadow-md' : 'text-glass-muted hover:text-glass-text'}`}
              >
                Tree
              </button>
            </div>
          </div>
          
          {forgeView === 'tree' ? (
            <SkillTree 
              patterns={patternsData} 
              completed={completed} 
              toggleCompletion={toggleCompletion} 
            />
          ) : (
            <AlgorithmMastery
              patterns={patternsData}
              completed={completed}
              toggleCompletion={toggleCompletion}
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Activity Log</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-glass-border to-transparent"></div>
          </div>
          <StreakActivity 
            streak={currentStreak} 
            heatmapData={heatmapData} 
            completedCount={completedQuestionsCount}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
