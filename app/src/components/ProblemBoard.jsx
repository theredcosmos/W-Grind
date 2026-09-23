import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PatternDetailModal from './PatternDetailModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ABSTRACT_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505909182942-e2f09aee3e89?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=600&q=80',
];

const ProblemBoard = ({ patterns, completed, toggleCompletion }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState(null);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % patterns.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + patterns.length) % patterns.length);
  };

  const getVisiblePatterns = () => {
    const visible = [];
    // We want 5 visible cards: center, 2 left, 2 right
    for (let i = -2; i <= 2; i++) {
      let idx = (currentIndex + i + patterns.length) % patterns.length;
      if (patterns[idx]) {
        visible.push({
          pattern: patterns[idx],
          offset: i,
          idx: idx
        });
      }
    }
    return visible;
  };

  const handleCardClick = (index, pattern) => {
    if (index === currentIndex) {
      setSelectedPattern(pattern);
    } else {
      setCurrentIndex(index);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center perspective-[1000px] overflow-hidden">
      
      {/* Navigation Buttons */}
      <button 
        onClick={handlePrev}
        className="absolute left-2 md:left-6 z-[200] p-3 md:p-4 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        onClick={handleNext}
        className="absolute right-2 md:right-6 z-[200] p-3 md:p-4 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
      >
        <ChevronRight size={24} />
      </button>

      {/* Carousel */}
      <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
        <AnimatePresence initial={false} mode="popLayout">
          {getVisiblePatterns().map(({ pattern, offset, idx }) => {
            const isCenter = offset === 0;
            const bgImage = ABSTRACT_IMAGES[idx % ABSTRACT_IMAGES.length];
            const { name, completed: compCount, total, progress } = pattern;
            
            let status = 'Learning';
            let colorClass = 'brand-primary';
            
            if (progress >= 90) {
              status = 'Mastered';
              colorClass = 'accent-success';
            } else if (progress >= 50) {
              status = 'Practicing';
              colorClass = 'accent-warning';
            }

            // Calculate transforms
            const scale = isCenter ? 1 : 0.85;
            const translateX = offset * 220; 
            const rotateY = isCenter ? 0 : (offset < 0 ? 30 : -30);
            const opacity = isCenter ? 1 : Math.max(0, 1 - Math.abs(offset) * 0.4);
            const zIndex = 100 - Math.abs(offset);
            const brightness = isCenter ? 1 : 0.5;

            return (
              <motion.div
                key={pattern.name}
                layout
                initial={{ 
                  scale: 0.7, 
                  opacity: 0,
                  zIndex: 0
                }}
                animate={{
                  translateX: `${translateX}px`,
                  rotateY: `${rotateY}deg`,
                  scale: scale,
                  opacity: opacity,
                  zIndex: zIndex,
                  filter: `brightness(${brightness})`
                }}
                exit={{ 
                  scale: 0.7, 
                  opacity: 0,
                  zIndex: 0
                }}
                transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                className={`absolute w-72 md:w-80 h-[420px] rounded-3xl cursor-pointer ${isCenter ? 'hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]' : ''}`}
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: isCenter ? '0 20px 40px -10px rgba(0,0,0,0.5)' : 'none',
                }}
                onClick={() => handleCardClick(idx, pattern)}
              >
                <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/10 bg-glass-panel">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-110"
                    style={{ backgroundImage: `url('${bgImage}')`, opacity: isCenter ? 0.6 : 0.3 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <h3 className="text-2xl font-bold text-white drop-shadow-md mb-2">{name}</h3>
                    
                    <div className="flex justify-between items-end mb-2">
                      <span className={`text-${colorClass} font-bold text-sm drop-shadow-sm`}>{status}</span>
                      <span className="text-white font-bold">{Math.round(progress)}%</span>
                    </div>
                    
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden mb-3 border border-white/10">
                      <div 
                        className={`h-full bg-${colorClass} transition-all duration-1000`} 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="text-xs text-white/70">
                      {compCount} of {total} completed
                    </div>
                    
                    {isCenter && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 pt-4 border-t border-white/20 text-center text-sm font-medium text-brand-primary-light flex items-center justify-center gap-2"
                      >
                        Click to view problems <ChevronRight size={16} />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {selectedPattern && (
        <PatternDetailModal 
          pattern={selectedPattern} 
          completed={completed} 
          toggleCompletion={toggleCompletion} 
          onClose={() => setSelectedPattern(null)}
        />
      )}
    </div>
  );
};

export default ProblemBoard;
