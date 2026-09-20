import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PatternDetailModal from './PatternDetailModal';

const NATURE_IMAGES = [
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1447752809811-92572b947f63?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1475924156734-497f1f9e28f1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1426604966841-8eb837be7f3e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1418065460487-3e414ee1a9f3?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1470071131384-001b85755b36?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1421081395995-17d1217e5842?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1437651025703-2858c944e353?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=400&q=80'
];

const PatternCard = ({ pattern, onClick, delay, index }) => {
  const { name, completed, total, progress } = pattern;
  
  let status = 'Learning';
  let colorClass = 'brand-primary';
  let gradient = 'from-brand-primary/20 to-transparent';
  
  if (progress >= 90) {
    status = 'Mastered';
    colorClass = 'accent-success';
    gradient = 'from-accent-success/20 to-transparent';
  } else if (progress >= 50) {
    status = 'Practicing';
    colorClass = 'accent-warning';
    gradient = 'from-accent-warning/20 to-transparent';
  }

  // Pick a nature image based on index without repeating (until index > 14)
  const bgImage = NATURE_IMAGES[index % NATURE_IMAGES.length];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-card flex flex-col justify-between h-[240px] relative overflow-hidden cursor-pointer group`}
      onClick={onClick}
    >
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 bg-cover bg-center"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      
      {/* Glass Overlay Layer to maintain text readability */}
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />
      
      {/* Existing Gradient Layer */}
      <div className={`absolute top-0 right-0 w-full h-32 bg-gradient-to-bl ${gradient} opacity-80 z-0`}></div>
      
      {/* Content */}
      <div className="p-6 flex flex-col h-full z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold leading-tight max-w-[80%] text-white drop-shadow-md">{name}</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex justify-between items-end mb-2">
            <div className="text-sm font-medium text-glass-muted">
              <span className={`text-${colorClass} font-bold drop-shadow-sm`}>{status}</span>
            </div>
            <div className="text-sm font-bold text-white drop-shadow-sm">{Math.round(progress)}%</div>
          </div>
          
          <div className="w-full h-1.5 bg-black/40 backdrop-blur-md rounded-full overflow-hidden mb-3 border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
              className={`h-full bg-${colorClass}`} 
            ></motion.div>
          </div>
          
          <div className="text-xs font-medium text-white/70 drop-shadow-sm">
            {completed} of {total} completed
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AlgorithmMastery = ({ patterns, completed, toggleCompletion }) => {
  const [selectedPattern, setSelectedPattern] = useState(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {patterns.map((pattern, idx) => (
          <PatternCard 
            key={idx} 
            index={idx}
            pattern={pattern} 
            delay={idx * 0.05}
            onClick={() => setSelectedPattern(pattern)}
          />
        ))}
      </div>
      
      {selectedPattern && (
        <PatternDetailModal 
          pattern={selectedPattern} 
          completed={completed} 
          toggleCompletion={toggleCompletion} 
          onClose={() => setSelectedPattern(null)}
        />
      )}
    </>
  );
};

export default AlgorithmMastery;
