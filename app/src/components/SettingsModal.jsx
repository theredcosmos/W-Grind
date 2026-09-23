import React from 'react';
import { motion } from 'framer-motion';
import './SolutionModal.css'; // We can reuse the modal styles

const SettingsModal = ({ onClose, achievements = [], unlockedAchievements = [] }) => {
  const getRarityClass = (rarity) => {
    switch (rarity) {
      case 'epic': return 'text-brand-primary bg-brand-primary/10 border-brand-primary/30';
      case 'rare': return 'text-brand-secondary bg-brand-secondary/10 border-brand-secondary/30';
      default: return 'text-glass-muted bg-glass-muted/10 border-glass-muted/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-glass-bg border border-glass-border shadow-2xl rounded-2xl max-w-2xl w-full m-4 max-h-[85vh] flex flex-col relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-glass-border flex justify-between items-center z-10 sticky top-0 bg-glass-bg">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-glass-text">Settings & Achievements</h2>
            <p className="text-sm text-glass-muted mt-1">Unlocked {unlockedAchievements.length} of {achievements.length} achievements</p>
          </div>
          <button
            className="w-10 h-10 rounded-full hover:bg-glass-panel flex items-center justify-center transition-colors text-glass-muted hover:text-glass-text"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-6 flex-1 space-y-4 z-10">
          <h3 className="font-semibold text-lg text-glass-text mb-4">Your Achievements</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(ach => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border flex gap-4 transition-all ${isUnlocked ? 'bg-glass-panel border-brand-primary/30 shadow-sm' : 'bg-glass-panel border-glass-border/50 opacity-60 grayscale'}`}
                >
                  <div className={`w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center text-3xl ${isUnlocked ? 'bg-glass-bg border border-glass-border shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-glass-panel border border-glass-border/50'}`}>
                    {ach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm truncate">{ach.name}</h4>
                    </div>
                    <div className="mb-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getRarityClass(ach.rarity)}`}>
                        {ach.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-glass-muted line-clamp-2 leading-snug">{ach.description}</p>
                    <div className="mt-2 text-xs font-semibold text-brand-primary">+{ach.xp} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
