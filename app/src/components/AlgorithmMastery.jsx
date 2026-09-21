import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PatternDetailModal from './PatternDetailModal';

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
  'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1573155993874-d5d48af29775?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=600&q=80'
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

  // Pick an abstract image based on index without repeating (until index > 14)
  const bgImage = ABSTRACT_IMAGES[index % ABSTRACT_IMAGES.length];

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
      
      {/* Dark Overlay Layer to maintain text readability without expensive nested blurs */}
      <div className="absolute inset-0 z-0 bg-black/60" />
      
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
          
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-3 border border-white/10">
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
