import React, { useState } from 'react';
import SolutionModal from './SolutionModal';

const getDifficultyClass = (difficulty) => {
  switch(difficulty.toLowerCase()) {
    case 'easy': return 'difficulty-easy';
    case 'medium': return 'difficulty-medium';
    case 'hard': return 'difficulty-hard';
    default: return '';
  }
};

const Table = ({ questions, completed, toggleCompletion, solutions, saveSolution }) => {
  const [activeSolutionModal, setActiveSolutionModal] = useState(null);

  return (
    <div className="table-container glass-panel">
      <table className="questions-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Title</th>
            <th>Pattern</th>
            <th>Subpattern</th>
            <th>Difficulty</th>
            <th>Companies</th>
            <th>Solution</th>
          </tr>
        </thead>
        <tbody>
          {questions.length > 0 ? questions.map(q => {
            const isCompleted = completed.includes(q.id);
            return (
              <tr key={q.id} className={isCompleted ? 'row-completed' : ''}>
                <td className="status-cell">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={isCompleted}
                      onChange={() => toggleCompletion(q.id)}
                    />
                    <span className="checkmark"></span>
                  </label>
                </td>
                <td>
                  <a href={q.url} target="_blank" rel="noopener noreferrer" className="question-link">
                    {q.title}
                  </a>
                </td>
                <td><span className="badge pattern-badge">{q.pattern}</span></td>
                <td><span className="badge pattern-badge" style={{backgroundColor: 'var(--bg-gradient-1)'}}>{q.subpattern}</span></td>
                <td><span className={`badge ${getDifficultyClass(q.difficulty)}`}>{q.difficulty}</span></td>
                <td className="companies-cell">
                  {q.companies.map((c, i) => (
                    <span key={i} className="company-tag">{c}</span>
                  ))}
                </td>
                <td>
                  <button 
                    className={`notes-button ${solutions[q.url] && (solutions[q.url].notes || solutions[q.url].videoUrl) ? 'has-notes' : ''}`}
                    onClick={() => setActiveSolutionModal(q)}
                  >
                    📝 Notes
                  </button>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="7" className="empty-state">No questions found matching your criteria.</td>
            </tr>
          )}
        </tbody>
      </table>

      {activeSolutionModal && (
        <SolutionModal 
          question={activeSolutionModal}
          initialData={solutions[activeSolutionModal.url]}
          onClose={() => setActiveSolutionModal(null)}
          onSave={saveSolution}
        />
      )}
    </div>
  );
};

export default Table;
