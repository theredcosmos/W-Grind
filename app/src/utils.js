export const calculateStreak = (completionData) => {
  if (!completionData) return 0;
  
  const dates = Object.values(completionData)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));
    
  if (dates.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  const dateSet = new Set(dates.map(d => new Date(d).toISOString().split('T')[0]));
  
  const todayStr = checkDate.toISOString().split('T')[0];
  if (dateSet.has(todayStr)) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(yesterdayStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      return 0;
    }
  }
  
  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return currentStreak;
};

export const getDailyCounts = (completionData, days = 365) => {
  const counts = {};
  if (!completionData) return counts;
  
  Object.values(completionData).forEach(dateStr => {
    if (!dateStr) return;
    const d = new Date(dateStr).toISOString().split('T')[0];
    counts[d] = (counts[d] || 0) + 1;
  });
  
  return counts;
};

export const getPeriodicStats = (completionData) => {
  let weeklyCompleted = 0;
  let monthlyCompleted = 0;
  
  if (!completionData) return { weeklyCompleted, monthlyCompleted };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  Object.values(completionData).forEach(dateStr => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    
    if (d >= startOfWeek && d <= today) {
      weeklyCompleted++;
    }
    if (d >= startOfMonth && d <= today) {
      monthlyCompleted++;
    }
  });

  return { weeklyCompleted, monthlyCompleted };
};

export const getTimeStats = (trackedTime) => {
  if (!trackedTime) return { today: 0, yesterday: 0, diff: 0 };
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const timeToday = trackedTime[todayStr] || 0;
  const timeYesterday = trackedTime[yesterdayStr] || 0;
  
  return {
    today: timeToday,
    yesterday: timeYesterday,
    diff: timeToday - timeYesterday
  };
};

export const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mRemain = m % 60;
  return `${h}h ${mRemain}m`;
};
export const calculateXP = (completedData, questionsList) => {
  if (!completedData || !questionsList) return 0;
  
  let totalXP = 0;
  const completedIds = Object.keys(completedData);
  
  completedIds.forEach(id => {
    // completedData id keys are strings from the UI, but JSON ids might be numbers.
    const q = questionsList.find(q => q.id.toString() === id.toString());
    if (q) {
      if (q.difficulty === 'Easy') totalXP += 50;
      else if (q.difficulty === 'Medium') totalXP += 100;
      else if (q.difficulty === 'Hard') totalXP += 200;
    }
  });
  
  return totalXP;
};

// Returns { currentLevel, currentLevelXP, xpForNextLevel, totalXP }
export const calculateLevel = (totalXP) => {
  let level = 1;
  let accumulatedXP = 0;
  
  while (true) {
    const xpNeededForThisLevel = level * 100;
    if (totalXP >= accumulatedXP + xpNeededForThisLevel) {
      accumulatedXP += xpNeededForThisLevel;
      level++;
    } else {
      break;
    }
  }
  
  return {
    level,
    currentLevelXP: totalXP - accumulatedXP,
    xpForNextLevel: level * 100,
    totalXP
  };
};

// Deterministic random number generator based on a seed string
const seedRandom = (seed) => {
  let h = 0xdeadbeef;
  for(let i = 0; i < seed.length; i++)
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
};

export const getDailyQuests = (questionsList, completedData = {}) => {
  if (!questionsList || questionsList.length === 0) return [];
  
  const today = new Date().toISOString().split('T')[0];
  
  const easy = questionsList.filter(q => q.difficulty === 'Easy');
  const med = questionsList.filter(q => q.difficulty === 'Medium');
  const hard = questionsList.filter(q => q.difficulty === 'Hard');
  
  const pickUnsolved = (arr, seedSuffix) => {
    if (arr.length === 0) return null;
    const rand = seedRandom(today + seedSuffix);
    
    // Try up to 50 times to find a question not completed before today
    for (let i = 0; i < 50; i++) {
      const index = rand() % arr.length;
      const q = arr[index];
      // If not completed, or completed TODAY, it's valid for today's board
      if (!completedData[q.id] || completedData[q.id] === today) {
        return q;
      }
    }
    // Fallback to random if all recent attempts failed
    return arr[seedRandom(today + seedSuffix)() % arr.length];
  };

  return [
    pickUnsolved(easy, '-easy') || pickUnsolved(questionsList, '-easy'),
    pickUnsolved(med, '-med') || pickUnsolved(questionsList, '-med'),
    pickUnsolved(hard, '-hard') || pickUnsolved(questionsList, '-hard')
  ].filter(Boolean);
};

export const getUnlockedAchievements = (completedData, questionsList, currentStreak) => {
  if (!completedData || !questionsList) return [];

  const completedIds = Object.keys(completedData);
  const totalCompleted = completedIds.length;
  if (totalCompleted === 0) return [];

  const unlocked = new Set();
  
  // Completed problem references
  const completedQuestions = completedIds.map(id => questionsList.find(q => q.id.toString() === id.toString())).filter(Boolean);
  
  const countsByDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  const countsByPattern = {};
  
  completedQuestions.forEach(q => {
    if (q.difficulty) countsByDifficulty[q.difficulty]++;
    if (q.pattern) {
      countsByPattern[q.pattern] = (countsByPattern[q.pattern] || 0) + 1;
    }
  });

  // Streaks
  if (totalCompleted >= 1) unlocked.add('first_flame');
  if (currentStreak >= 3) unlocked.add('spark_dedication');
  if (currentStreak >= 5) unlocked.add('daily_warrior');
  if (currentStreak >= 7) unlocked.add('lucky_seven');
  if (currentStreak >= 14) unlocked.add('infernal_focus');
  if (currentStreak >= 30) unlocked.add('stellar_commitment');

  // Quantities
  if (totalCompleted >= 25) unlocked.add('rocket_launch');
  if (totalCompleted >= 50) unlocked.add('dimension_hopper');
  if (totalCompleted >= 100) unlocked.add('flawless_execution');

  // Difficulties
  if (countsByDifficulty.Easy >= 1 && countsByDifficulty.Medium >= 1 && countsByDifficulty.Hard >= 1) {
    unlocked.add('difficulty_climber');
  }
  if (countsByDifficulty.Hard >= 5) unlocked.add('competitive_spirit');
  if (countsByDifficulty.Hard >= 15) unlocked.add('system_architect');

  // Patterns
  const arrays = countsByPattern['Array'] || countsByPattern['Arrays'] || 0;
  if (arrays >= 10) unlocked.add('array_alchemist');

  const graphs = countsByPattern['Graph'] || countsByPattern['Graphs'] || 0;
  if (graphs >= 10) unlocked.add('graph_master');

  const trees = countsByPattern['Tree'] || countsByPattern['Trees'] || 0;
  if (trees >= 10) unlocked.add('tree_master');

  const dp = countsByPattern['Dynamic Programming'] || countsByPattern['DP'] || 0;
  if (dp >= 10) unlocked.add('dynamic_programmer');

  const uniquePatterns = Object.keys(countsByPattern).length;
  if (uniquePatterns >= 10) unlocked.add('pattern_discoverer');

  // Resurrection (Inactivity > 10 days)
  const dates = Object.values(completedData).filter(Boolean).sort((a, b) => new Date(a) - new Date(b));
  let hadLongBreak = false;
  for (let i = 1; i < dates.length; i++) {
    const diffTime = Math.abs(new Date(dates[i]) - new Date(dates[i-1]));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 10) {
      hadLongBreak = true;
      break;
    }
  }
  if (hadLongBreak) unlocked.add('resurrection');

  return Array.from(unlocked);
};

