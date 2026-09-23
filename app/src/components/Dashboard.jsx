import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from './HeroSection';
import SubMetrics from './SubMetrics';
import StreakActivity from './StreakActivity';

const Dashboard = ({
  overallProgress,
  completedQuestionsCount,
  totalQuestions,
  currentStreak,
  levelData,
  timeStats,
  monthlyCompleted,
  pickRandomProblem,
  addTrackedTime,
  dailyQuests,
  completedData,
  toggleCompletion,
  heatmapData
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col gap-3 pb-0 min-w-0 w-full"
    >
      <div className="flex-none">
        <h1 className="text-xl font-bold tracking-tight mb-0.5">Dashboard</h1>
        <p className="text-glass-muted text-[10px]">Welcome back. Here's your algorithmic journey at a glance.</p>
      </div>

      <div className="flex-1 min-h-0 min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 h-full min-h-0 min-w-0">
          <HeroSection 
            progress={overallProgress} 
            completed={completedQuestionsCount} 
            total={totalQuestions} 
            streak={currentStreak}
            levelData={levelData}
          />
        </div>
        <div className="lg:col-span-7 h-full min-h-0 min-w-0">
          <SubMetrics 
            timeStats={timeStats}
            monthlyCompleted={monthlyCompleted}
            pickRandomProblem={pickRandomProblem}
            addTrackedTime={addTrackedTime}
            dailyQuests={dailyQuests}
            completedData={completedData}
            toggleCompletion={toggleCompletion}
          />
        </div>
      </div>

      <div className="flex-none h-[110px] flex flex-col">
        <div className="flex items-center gap-3 mb-1.5 flex-none">
          <h2 className="text-lg font-bold tracking-tight">Activity Log</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-glass-border to-transparent"></div>
        </div>
        <div className="flex-1 min-h-0 min-w-0">
          <StreakActivity 
            streak={currentStreak} 
            heatmapData={heatmapData} 
            completedCount={completedQuestionsCount}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
