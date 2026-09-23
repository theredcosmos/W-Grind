import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

const StreakActivity = ({ streak, heatmapData }) => {
  // Generate the last 14 days
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // We want days from left to right (oldest to newest)
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = heatmapData[dateStr] || 0;
      
      result.push({
        date: dateStr,
        count,
        label: d.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return result;
  }, [heatmapData]);

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

    const sortedDates = Object.keys(heatmapData).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (heatmapData[sortedDates[i]] > 0) {
        if (i === 0) {
          currentTempStreak = 1;
        } else {
          const curr = new Date(sortedDates[i]);
          const prev = new Date(sortedDates[i-1]);
          const diffDays = Math.round(Math.abs(curr - prev) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentTempStreak++;
          } else {
            currentTempStreak = 1;
          }
        }
        if (currentTempStreak > maxStreak) maxStreak = currentTempStreak;
      }
    }

    return { totalSubmissions, activeDays, maxStreak: Math.max(maxStreak, streak) };
  }, [heatmapData, streak]);

  return (
    <div className="w-full h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-2 px-4 overflow-hidden relative flex flex-col h-full"
      >
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col flex-1 h-full">
          {/* Header & Stats */}
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-glass-muted uppercase tracking-widest text-[9px] font-bold">Momentum Engine</h3>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-[9px] uppercase text-glass-muted tracking-wider">Total</div>
                <div className="text-sm font-bold text-glass-text leading-tight">{stats.totalSubmissions}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-glass-muted tracking-wider">Max Streak</div>
                <div className="text-sm font-bold text-glass-text leading-tight">{stats.maxStreak}</div>
              </div>
            </div>
          </div>
          
          {/* Main Momentum Display */}
          <div className="flex-1 flex items-center gap-6 md:gap-10">
            
            {/* The Fire (Current Streak) */}
            <div className="flex flex-col items-center justify-center min-w-[70px]">
              <div className="relative">
                {streak > 0 && <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full animate-pulse"></div>}
                <Flame size={24} className={`relative z-10 transition-colors duration-500 ${streak > 0 ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-glass-border'}`} />
              </div>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-none mt-1">
                {streak}
              </div>
              <div className="text-[8px] font-bold uppercase text-orange-500/80 tracking-widest mt-0.5">Day Streak</div>
            </div>

            {/* The Power Cells (Last 14 Days) */}
            <div className="flex-1 flex items-end gap-1.5 md:gap-2 h-12 relative">
              {days.map((day, idx) => {
                const isActive = day.count > 0;
                const isToday = idx === 13;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-crosshair">
                    
                    {/* Hover Tooltip */}
                    <div className="absolute -top-6 bg-black/80 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg border border-white/10">
                      {day.count} {day.count === 1 ? 'Submission' : 'Submissions'} on {day.label}
                    </div>

                    {/* Power Cell Block */}
                    <div 
                      className={`w-full transition-all duration-300 rounded-sm relative ${
                        isActive 
                          ? 'bg-brand-primary h-full shadow-[0_0_12px_rgba(139,92,246,0.5)]' 
                          : 'bg-glass-border/30 h-1/4 group-hover:h-1/3 group-hover:bg-glass-border/50'
                      } ${isToday ? 'ring-1 ring-white/30 ring-offset-1 ring-offset-transparent' : ''}`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-white/20 blur-[2px] rounded-sm animate-pulse-slow"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
};

export default StreakActivity;
