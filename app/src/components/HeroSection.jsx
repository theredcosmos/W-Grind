import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Target } from 'lucide-react';

const HeroSection = ({ progress, completed, total, streak, levelData }) => {
  const { level, currentLevelXP, xpForNextLevel, totalXP } = levelData || { level: 1, currentLevelXP: 0, xpForNextLevel: 100, totalXP: 0 };
  const xpPercentage = (currentLevelXP / xpForNextLevel) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card relative overflow-hidden flex flex-col h-full group p-4 lg:p-6"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-success opacity-5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 group-hover:opacity-10 transition-opacity"></div>
      
      <div className="z-10 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-brand-primary/10 text-brand-primary-light px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border border-brand-primary/20 backdrop-blur-sm">
              Level {level}
            </span>
            <span className="text-glass-muted text-xs font-semibold">{totalXP} Total XP</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-br from-glass-text to-glass-muted">
            Algorithm<br/>Mastery
          </h1>
          <p className="text-glass-muted font-medium text-sm max-w-sm mb-4">Track your journey through algorithmic patterns.</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-glass-text flex items-center gap-2"><Target size={16} className="text-brand-primary-light"/> XP to Level {level + 1}</span>
              <span className="text-glass-muted">{currentLevelXP} / {xpForNextLevel} XP</span>
            </div>
            <div className="h-2 w-full bg-glass-border/30 rounded-full overflow-hidden backdrop-blur-sm p-[2px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]"
              ></motion.div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-glass-text flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-success"/> Completion</span>
              <span className="text-glass-muted">{completed} / {total} Solved</span>
            </div>
            <div className="h-2 w-full bg-glass-border/30 rounded-full overflow-hidden backdrop-blur-sm p-[2px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                className="h-full bg-gradient-to-r from-accent-success to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              ></motion.div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-3 border-t border-glass-border/50">
            <div className="bg-orange-500/10 p-1.5 rounded-xl border border-orange-500/20 backdrop-blur-sm">
              <Flame size={20} className="text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-black text-glass-text">{streak} Day{streak !== 1 ? 's' : ''}</div>
              <div className="text-[10px] font-bold text-glass-muted uppercase tracking-wider">Current Streak</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroSection;
