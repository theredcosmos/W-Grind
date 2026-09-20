import React, { useState, useEffect } from 'react';
import './SolutionModal.css';

const SolutionModal = ({ question, initialData, onClose, onSave }) => {
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (initialData) {
      setNotes(initialData.notes || '');
      setVideoUrl(initialData.videoUrl || '');
    } else {
      setNotes('');
      setVideoUrl('');
    }
  }, [initialData]);

  const handleSave = () => {
    onSave(question.url, { notes, videoUrl });
    onClose();
  };

  if (!question) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Solution: {question.title}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Video Solution URL</label>
            <input 
              type="text" 
              placeholder="https://www.youtube.com/watch?v=..." 
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            {videoUrl && (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="video-link">
                Watch Video 🎥
              </a>
            )}
          </div>
          <div className="form-group">
            <label>Personal Notes</label>
            <textarea 
              placeholder="Write your solution approach, time/space complexity, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={handleSave}>Save Solution</button>
        </div>
      </div>
    </div>
  );
};

export default SolutionModal;
