import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '../utils';

const Analytics = ({ completed, trackedTime, questions }) => {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    let todayTime = trackedTime[todayStr] || 0;
    let weekTime = 0;
    let monthTime = 0;

    // Calculate times
    Object.entries(trackedTime).forEach(([dateStr, time]) => {
      const date = new Date(dateStr);
      if (date >= weekAgo) weekTime += time;
      if (date >= monthAgo) monthTime += time;
    });

    // Calculate solved questions
    const solvedHistory = [];
    Object.entries(completed).forEach(([qId, dateStr]) => {
      const date = new Date(dateStr);
      if (dateStr === todayStr) todayCount++;
      if (date >= weekAgo) weekCount++;
      if (date >= monthAgo) monthCount++;

      const question = questions.find(q => q.id.toString() === qId.toString());
      if (question) {
        solvedHistory.push({
          ...question,
          dateSolved: dateStr,
          timestamp: date.getTime()
        });
      }
    });

    solvedHistory.sort((a, b) => b.timestamp - a.timestamp);

    const avgQuestionsPerDay = (weekCount / 7).toFixed(1);

    return {
      todayCount, weekCount, monthCount,
      todayTime, weekTime, monthTime,
      solvedHistory,
      avgQuestionsPerDay
    };
  }, [completed, trackedTime, questions]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 md:space-y-6 flex-1 flex flex-col min-h-0 w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-accent-success shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs font-semibold text-glass-muted uppercase tracking-wider">Today</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-glass-muted font-medium mb-1">Questions Solved</div>
              <div className="text-4xl font-bold">{stats.todayCount}</div>
            </div>
            <div>
              <div className="text-sm text-glass-muted font-medium mb-1">Time Logged</div>
              <div className="text-2xl font-bold text-brand-primary-light">{formatTime(stats.todayTime)}</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-brand-secondary shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>
            <span className="text-xs font-semibold text-glass-muted uppercase tracking-wider">This Week</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-glass-muted font-medium mb-1">Questions Solved</div>
              <div className="text-4xl font-bold">{stats.weekCount}</div>
            </div>
            <div>
              <div className="text-sm text-glass-muted font-medium mb-1">Time Logged</div>
              <div className="text-2xl font-bold text-brand-primary-light">{formatTime(stats.weekTime)}</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
            <span className="text-xs font-semibold text-glass-muted uppercase tracking-wider">This Month</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-glass-muted font-medium mb-1">Questions Solved</div>
              <div className="text-4xl font-bold">{stats.monthCount}</div>
            </div>
            <div>
              <div className="text-sm text-glass-muted font-medium mb-1">Time Logged</div>
              <div className="text-2xl font-bold text-brand-primary-light">{formatTime(stats.monthTime)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-none">
          <h3 className="text-xl font-bold">Solving History</h3>
          <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-glass-muted">
            Avg: {stats.avgQuestionsPerDay} questions / day
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-black/40 dark:bg-[#0f172a] backdrop-blur-xl z-10">
              <tr className="border-b border-glass-border text-xs uppercase tracking-wider text-glass-muted">
                <th className="p-4 font-semibold">Problem Name</th>
                <th className="p-4 font-semibold">Difficulty</th>
                <th className="p-4 font-semibold">Date Solved</th>
              </tr>
            </thead>
            <tbody>
              {stats.solvedHistory.length > 0 ? (
                stats.solvedHistory.slice(0, 50).map((problem, i) => {
                  const diffColor = problem.difficulty === 'Easy' ? 'text-accent-success bg-accent-success/10' : 
                                    problem.difficulty === 'Medium' ? 'text-accent-warning bg-accent-warning/10' : 
                                    'text-accent-danger bg-accent-danger/10';
                  
                  return (
                    <tr key={i} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium">
                        <a href={problem.url} target="_blank" rel="noreferrer" className="hover:text-brand-primary-light transition-colors">
                          {problem.title}
                        </a>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${diffColor}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="p-4 text-glass-muted">{problem.dateSolved}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-glass-muted">No problems solved yet. Start grinding!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
