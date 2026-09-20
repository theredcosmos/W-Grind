import React from 'react';

const ProgressBar = ({ completedCount, totalCount }) => {
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="progress-container glass-panel">
      <div className="progress-header">
        <h2>Your Progress</h2>
        <span>{completedCount} / {totalCount} ({percentage}%)</span>
      </div>
      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
