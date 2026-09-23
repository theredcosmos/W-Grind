import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Target, Zap, Play, Square, Medal, Trophy, Star, CheckCircle2 } from 'lucide-react';
import { formatTime } from '../utils';

const MiniRing = ({ title, value, total, colorClass, gradient }) => {
  const [isMounted, setIsMounted] = useState(false);
  const percentage = Math.min(100, (value / total) * 100);
  
  const radius = 35;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => { setIsMounted(true); }, []);

  return (
    <div className="glass-card p-3 flex flex-col justify-between h-full relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity`}></div>
      
      <span className="text-[10px] font-semibold text-glass-muted uppercase tracking-wider mb-2">{title}</span>
      <div className="flex items-center gap-4 z-10">
        <div className="relative">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            <circle
              stroke="var(--glass-border)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="opacity-30"
            />
            <motion.circle
              stroke={`url(#${gradient})`}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: isMounted ? strokeDashoffset : circumference }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <defs>
              <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
            {Math.round(percentage)}%
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-2xl">{value} <span className="text-glass-muted text-sm font-normal">/ {total}</span></span>
          <span className="text-glass-muted text-xs mt-1">Problems Solved</span>
        </div>
      </div>
    </div>
  );
};

const TodaysGrind = ({ timeStats }) => {
  const { today, diff } = timeStats;
  const isPositive = diff >= 0;

  return (
    <div className="glass-card p-3 flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-success opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity"></div>
      <span className="text-[10px] font-semibold text-glass-muted uppercase tracking-wider mb-2">Today's Grind</span>
      <div className="flex flex-col justify-center h-full z-10">
        <div className="text-3xl font-bold tracking-tight text-glass-text mb-1">
          {formatTime(today)}
        </div>
        <div className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-accent-success' : 'text-accent-warning'}`}>
          {isPositive ? '↑' : '↓'} {formatTime(Math.abs(diff))} from yesterday
        </div>
      </div>
    </div>
  );
};

const QuestBoard = ({ quests, completedData, toggleCompletion }) => {
  return (
    <div className="glass-card p-3 flex flex-col gap-1.5 overflow-hidden relative h-full min-w-0">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
      <span className="text-[10px] font-semibold text-glass-muted uppercase tracking-wider mb-2 flex items-center gap-2">
        <Star size={14} className="text-yellow-400" /> Daily Quests
      </span>
      
      <div className="flex flex-col justify-center gap-1.5 z-10 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1">
        {quests.slice(0, 2).map((q, idx) => {
          const isCompleted = !!completedData[q.id];
          const xp = q.difficulty === 'Easy' ? 50 : q.difficulty === 'Medium' ? 100 : 200;
          const colorClass = q.difficulty === 'Easy' ? 'text-accent-success' : q.difficulty === 'Medium' ? 'text-accent-warning' : 'text-accent-danger';
          const bgClass = q.difficulty === 'Easy' ? 'bg-accent-success/10' : q.difficulty === 'Medium' ? 'bg-accent-warning/10' : 'bg-accent-danger/10';
          
          return (
            <div 
              key={`${q.id}-${idx}`} 
              className={`flex-none flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer hover:border-brand-primary/50 min-w-0 w-full ${isCompleted ? 'bg-glass-panel border-glass-border/30 shadow-sm' : 'bg-glass-panel border-glass-border/50 shadow-sm'}`}
              onClick={() => {
                if (!isCompleted) {
                  window.open(q.url, '_blank', 'noopener,noreferrer');
                  // We also toggle completion automatically for UX, though usually they'd do it manually.
                  // For this demo, clicking it opens it. Let them toggle it in the tree, or we can add a check button here.
                }
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleCompletion(q.id); }}
                  className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${isCompleted ? 'bg-brand-primary-light border-brand-primary-light text-white shadow-[0_0_10px_rgba(167,139,250,0.4)]' : 'border-glass-muted hover:border-brand-primary-light'}`}
                >
                  {isCompleted && <CheckCircle2 size={14} />}
                </button>
                <div className="truncate flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-glass-muted' : 'text-glass-text'}`}>
                    {q.title}
                  </div>
                  <div className="flex gap-2 items-center mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${bgClass} ${colorClass}`}>
                      {q.difficulty}
                    </span>
                    <span className="text-xs font-medium text-brand-primary">+{xp} XP</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SubMetrics = ({ timeStats, monthlyCompleted, pickRandomProblem, addTrackedTime, dailyQuests, completedData, toggleCompletion }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [dailyLink, setDailyLink] = useState('https://leetcode.com/problemset/');
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetch('https://alfa-leetcode-api.onrender.com/daily')
      .then(res => res.json())
      .then(data => {
        if (data && data.questionLink) setDailyLink(data.questionLink);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSessionSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isFocusMode]);

  const toggleFocusMode = () => {
    if (isFocusMode) {
      const finalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      addTrackedTime(finalSeconds);
      setSessionSeconds(0);
    }
    setIsFocusMode(!isFocusMode);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0 min-w-0"
    >
      <div className="flex flex-col gap-4 min-h-0 min-w-0">
        <TodaysGrind timeStats={timeStats} />
        <MiniRing 
          title="Monthly Progress" 
          value={monthlyCompleted} 
          total={40} 
          colorClass="bg-brand-primary" 
          gradient="grad-purple"
        />
      </div>
      
      <div className="grid grid-rows-2 gap-3 min-h-0 min-w-0">
        <div className="glass-card p-3 flex flex-col gap-2 relative overflow-hidden min-w-0">
          <span className="text-[10px] font-semibold text-glass-muted uppercase tracking-wider mb-0">Quick Actions</span>
          
          <AnimatePresence mode="wait">
            {isFocusMode ? (
              <motion.div 
                key="focusing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center flex-1 space-y-4"
              >
                <div className="text-3xl font-mono text-brand-primary font-bold tracking-widest">
                  {new Date(sessionSeconds * 1000).toISOString().substr(11, 8)}
                </div>
                <button 
                  onClick={toggleFocusMode}
                  className="bg-accent-danger/20 text-accent-danger border border-accent-danger/30 hover:bg-accent-danger/30 font-bold py-2 px-6 rounded-xl transition-all flex items-center gap-2 w-full justify-center"
                >
                  <Square size={16} fill="currentColor" /> Stop Focus
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="actions"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col justify-center gap-2 flex-1"
              >
                <button 
                  onClick={() => window.open(dailyLink, '_blank', 'noopener,noreferrer')}
                  className="premium-btn-primary flex justify-center items-center py-1.5 text-xs w-full relative"
                >
                  <Target size={14} className="absolute left-4" />
                  <span>Problem of the Day</span>
                </button>
                <button 
                  onClick={pickRandomProblem}
                  className="premium-btn flex justify-center items-center py-1.5 text-xs w-full relative"
                >
                  <Shuffle size={14} className="absolute left-4" />
                  <span>Pick Random Problem</span>
                </button>
                <button 
                  onClick={toggleFocusMode}
                  className="premium-btn flex justify-center items-center py-1.5 text-xs text-accent-success hover:border-accent-success/50 w-full relative"
                >
                  <Play size={14} fill="currentColor" className="absolute left-4" />
                  <span>Start Focus Mode</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <QuestBoard quests={dailyQuests} completedData={completedData} toggleCompletion={toggleCompletion} />
      </div>
    </motion.div>
  );
};

export default SubMetrics;
