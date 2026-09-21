import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const StreakActivity = ({ streak, heatmapData, completedCount, achievements = [], unlockedAchievements = [] }) => {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const count = heatmapData[dateStr] || 0;
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3) level = 3;
      
      result.push({
        date: dateStr,
        count,
        level,
        dayOfWeek: d.getDay(),
        monthYear: `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`,
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear()
      });
    }
    return result;
  }, [heatmapData]);

  const weeks = useMemo(() => {
    const wks = [];
    let currentWeek = [];
    
    if (days.length > 0 && days[0].dayOfWeek !== 0) {
      for (let i = 0; i < days[0].dayOfWeek; i++) {
        currentWeek.push(null);
      }
    }
    
    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        wks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      wks.push(currentWeek);
    }
    
    return wks;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonthYear = null;
    weeks.forEach((week, i) => {
      const firstValidDay = week.find(d => d !== null);
      if (firstValidDay && firstValidDay.monthYear !== lastMonthYear) {
        labels.push({ label: `${firstValidDay.month} '${firstValidDay.year.toString().slice(-2)}`, index: i });
        lastMonthYear = firstValidDay.monthYear;
      }
    });
    return labels;
  }, [weeks]);

  const stats = useMemo(() => {
    let totalSubmissions = 0;
    let activeDays = 0;
    let maxStreak = 0;
    let currentTempStreak = 0;

    const values = Object.values(heatmapData);
    values.forEach(count => {
      if (count > 0) {
        totalSubmissions += count;
        activeDays++;
      }
    });

    // Compute max streak roughly from the days array since it's sequential
    for (const d of days) {
      if (d.count > 0) {
        currentTempStreak++;
        if (currentTempStreak > maxStreak) maxStreak = currentTempStreak;
      } else {
        currentTempStreak = 0;
      }
    }

    return { totalSubmissions, activeDays, maxStreak: Math.max(maxStreak, streak) };
  }, [heatmapData, days, streak]);

  const getColorClass = (level) => {
    switch(level) {
      case 1: return 'bg-brand-primary/40 border-brand-primary/20';
      case 2: return 'bg-brand-primary/70 border-brand-primary/40';
      case 3: return 'bg-brand-primary border-brand-primary shadow-[0_0_8px_rgba(139,92,246,0.8)]';
      default: return 'bg-[var(--glass-border)] border-[var(--glass-border)] opacity-50';
    }
  };

  const getRarityClass = (rarity) => {
    switch (rarity) {
      case 'epic': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'rare': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
      
      {/* Heatmap */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6 overflow-hidden relative flex flex-col"
      >
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col flex-1">
          <div className="mb-6 flex flex-wrap gap-4 md:gap-8 text-sm">
            <div>
              <div className="text-glass-muted uppercase tracking-wider text-xs mb-1">Submissions in past year</div>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            </div>
            <div>
              <div className="text-glass-muted uppercase tracking-wider text-xs mb-1">Total active days</div>
              <div className="text-2xl font-bold">{stats.activeDays}</div>
            </div>
            <div>
              <div className="text-glass-muted uppercase tracking-wider text-xs mb-1">Max streak</div>
              <div className="text-2xl font-bold">{stats.maxStreak}</div>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-4 custom-scrollbar flex-1">
            <div className="min-w-[800px]">
              <div className="flex gap-1.5 relative mb-1">
                {weeks.map((week, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    {week.map((day, j) => {
                      if (!day) return <div key={`empty-${j}`} className="w-3 h-3"></div>;
                      return (
                        <div 
                          key={day.date}
                          title={`${day.count} problems on ${day.date}`}
                          className={`w-3 h-3 rounded-[3px] border transition-all duration-200 hover:scale-150 hover:z-10 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] cursor-pointer ${getColorClass(day.level)}`}
                        ></div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="relative h-6 mt-2 text-xs text-glass-muted font-medium w-full">
                {monthLabels.map(({ label, index }) => (
                  <span 
                    key={`${label}-${index}`} 
                    className="absolute" 
                    style={{ left: `${index * 1.05}rem` }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-xs font-medium text-glass-muted mt-2">
            <span>Less</span>
            <div className={`w-3 h-3 rounded-sm border ${getColorClass(0)}`}></div>
            <div className={`w-3 h-3 rounded-sm border ${getColorClass(1)}`}></div>
            <div className={`w-3 h-3 rounded-sm border ${getColorClass(2)}`}></div>
            <div className={`w-3 h-3 rounded-sm border ${getColorClass(3)}`}></div>
            <span>More</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StreakActivity;
