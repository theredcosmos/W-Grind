import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Filter } from 'lucide-react';

const PatternDetailModal = ({ pattern, completed, toggleCompletion, onClose }) => {
  const { name, questions } = pattern;
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  
  const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };

  const subpatterns = useMemo(() => {
    const groups = {};
    
    // Filter and group
    const filteredQuestions = questions.filter(q => 
      difficultyFilter === 'All' || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase()
    );

    // Sort by difficulty
    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
      return (difficultyOrder[a.difficulty.toLowerCase()] || 4) - (difficultyOrder[b.difficulty.toLowerCase()] || 4);
    });

    sortedQuestions.forEach(q => {
      const sp = q.subpattern || 'General';
      if (!groups[sp]) groups[sp] = [];
      groups[sp].push(q);
    });
    return groups;
  }, [questions, difficultyFilter]);

  const getDifficultyClass = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'text-accent-success bg-accent-success/10 border-accent-success/20';
      case 'medium': return 'text-accent-warning bg-accent-warning/10 border-accent-warning/20';
      case 'hard': return 'text-accent-danger bg-accent-danger/10 border-accent-danger/20';
      default: return 'text-glass-muted bg-black/5 dark:bg-white/5 border-[var(--glass-border)]';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden bg-[var(--glass-bg)] shadow-2xl rounded-2xl border border-[var(--glass-border)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--glass-border)] bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold tracking-tight text-glass-text">{name}</h2>
            <div className="flex items-center gap-2 bg-black/10 dark:bg-white/5 rounded-lg p-1.5 border border-glass-border">
              <Filter size={16} className="text-glass-muted ml-2" />
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-glass-text focus:outline-none cursor-pointer pr-2"
              >
                <option value="All" className="bg-black text-white">All Difficulties</option>
                <option value="Easy" className="bg-black text-white">Easy</option>
                <option value="Medium" className="bg-black text-white">Medium</option>
                <option value="Hard" className="bg-black text-white">Hard</option>
              </select>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-glass-muted hover:text-glass-text hover:bg-white/10 transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          {Object.entries(subpatterns).map(([sp, qs]) => (
            <div key={sp} className="space-y-4">
              <h3 className="text-lg font-semibold tracking-wide text-brand-primary-light flex items-center gap-3">
                {sp}
                <div className="h-[1px] flex-1 bg-gradient-to-r from-brand-primary/30 to-transparent"></div>
              </h3>
              
              <div className="rounded-xl overflow-hidden border border-[var(--glass-border)] bg-black/5 dark:bg-white/5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)] bg-black/5 dark:bg-white/5 text-xs font-semibold tracking-wider text-glass-muted uppercase">
                      <th className="p-4 w-16 text-center">Status</th>
                      <th className="p-4">Problem</th>
                      <th className="p-4 w-32">Difficulty</th>
                      <th className="p-4">Companies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qs.map(q => {
                      const isCompleted = !!completed[q.id];
                      return (
                        <tr 
                          key={q.id} 
                          className={`border-b border-[var(--glass-border)] last:border-b-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${isCompleted ? 'opacity-50 hover:opacity-80' : ''}`}
                        >
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => toggleCompletion(q.id)}
                              className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                                isCompleted 
                                  ? 'bg-brand-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]' 
                                  : 'bg-black/10 dark:bg-white/10 border border-[var(--glass-border)] hover:border-brand-primary/50'
                              }`}
                            >
                              <AnimatePresence>
                                {isCompleted && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                  >
                                    <Check size={16} strokeWidth={3} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                          </td>
                          <td className="p-4">
                            <a 
                              href={q.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`font-medium text-[15px] hover:text-brand-primary-light transition-colors ${isCompleted ? 'line-through' : 'text-glass-text'}`}
                            >
                              {q.title}
                            </a>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${getDifficultyClass(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1.5">
                              {q.companies && q.companies.map((c, i) => (
                                <span key={i} className="text-[11px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-[var(--glass-border)] text-glass-muted font-medium">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default PatternDetailModal;
