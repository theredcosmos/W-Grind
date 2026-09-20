import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PatternDetailModal from './PatternDetailModal';

// Hardcoded coordinates for the Forge/Skill Tree layout (ViewBox 0 0 1000 600)
const NODE_LAYOUT = [
  { id: 'Array', label: 'Arrays', x: 150, y: 300 },
  { id: 'Two Pointer', label: 'Two Pointers', x: 350, y: 300 },
  { id: 'Sliding Window', label: 'Sliding Window', x: 550, y: 300 },
  { id: 'String', label: 'Strings', x: 250, y: 150 },
  { id: 'Binary Search', label: 'Binary Search', x: 250, y: 450 },
  { id: 'Linked List', label: 'Linked List', x: 150, y: 450 },
  { id: 'Tree', label: 'Trees', x: 450, y: 150 },
  { id: 'Graph', label: 'Graphs', x: 650, y: 150 },
  { id: 'Backtracking', label: 'Backtracking', x: 800, y: 220 },
  { id: 'Dynamic Programming', label: 'DP', x: 850, y: 350 },
  { id: 'Stack', label: 'Stacks', x: 450, y: 450 },
  { id: 'Heap', label: 'Heaps', x: 650, y: 450 },
  { id: 'Greedy', label: 'Greedy', x: 800, y: 480 },
  { id: 'Design', label: 'Design', x: 920, y: 450 },
  { id: 'Bit', label: 'Bit Manipulation', x: 920, y: 250 },
];

const EDGES = [
  { source: 'Array', target: 'Two Pointer' },
  { source: 'Two Pointer', target: 'Sliding Window' },
  { source: 'Array', target: 'String' },
  { source: 'Array', target: 'Binary Search' },
  { source: 'Array', target: 'Linked List' },
  { source: 'String', target: 'Tree' },
  { source: 'Tree', target: 'Graph' },
  { source: 'Graph', target: 'Backtracking' },
  { source: 'Backtracking', target: 'Dynamic Programming' },
  { source: 'Linked List', target: 'Stack' },
  { source: 'Stack', target: 'Heap' },
  { source: 'Heap', target: 'Greedy' },
  { source: 'Greedy', target: 'Design' },
  { source: 'Sliding Window', target: 'Dynamic Programming' },
  { source: 'Graph', target: 'Dynamic Programming' },
];

const SkillNode = ({ node, data, onClick, isHovered, onHover }) => {
  const radius = 30;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Data resolution
  const progress = data ? data.progress : 0;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  let colorClass = 'brand-primary-light';
  let colorValue = 'var(--brand-primary-light)';
  let glowColor = 'rgba(167, 139, 250, 0.4)';
  
  if (progress >= 90) {
    colorClass = 'accent-success';
    colorValue = 'var(--accent-success)';
    glowColor = 'rgba(16, 185, 129, 0.4)';
  } else if (progress >= 50) {
    colorClass = 'accent-warning';
    colorValue = 'var(--accent-warning)';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else if (progress === 0) {
    colorValue = 'var(--glass-muted)';
    glowColor = 'transparent';
  }

  const getInitials = (label) => {
    const words = label.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return label.slice(0, 2).toUpperCase();
  };

  return (
    <g 
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(data)}
      style={{ cursor: data ? 'pointer' : 'not-allowed' }}
    >
      {/* Background glow */}
      <circle r={radius + 15} fill={glowColor} className="transition-all duration-300" opacity={isHovered ? 0.8 : 0.3} filter="blur(8px)" />
      
      {/* Node Background */}
      <circle r={radius} fill="var(--glass-bg)" stroke="var(--glass-muted)" strokeOpacity={0.3} strokeWidth={3} />
      
      {/* Initials */}
      <text
        y={6}
        textAnchor="middle"
        fill="var(--glass-text)"
        className="text-lg font-black font-sans opacity-40"
      >
        {getInitials(node.label)}
      </text>
      
      {/* Progress Ring */}
      <circle
        stroke={colorValue}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
        strokeLinecap="round"
        r={normalizedRadius}
        transform="rotate(-90)"
      />
      
      {/* Label */}
      <text 
        y={radius + 24} 
        textAnchor="middle" 
        fill="var(--glass-text)" 
        className="text-sm font-bold font-sans drop-shadow-md"
        opacity={isHovered ? 1 : 0.8}
      >
        {node.label}
      </text>

      {/* Hover Info Tooltip (SVG rendered) */}
      <AnimatePresence>
        {isHovered && data && (
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <rect x={-50} y={-radius - 50} width={100} height={40} rx={8} fill="var(--glass-panel)" stroke="var(--glass-border)" />
            <text x={0} y={-radius - 35} textAnchor="middle" fill="var(--glass-text)" className="text-[10px] font-bold">{data.completed} / {data.total} Solved</text>
            <text x={0} y={-radius - 20} textAnchor="middle" fill={colorValue} className="text-[10px] font-bold">{Math.round(progress)}% Mastery</text>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
};

const SkillTree = ({ patterns, completed, toggleCompletion }) => {
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Drag-to-scroll state
  const scrollRef = React.useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Map patternsData to nodes
  const resolveData = (nodeId) => {
    return patterns.find(p => p.name.includes(nodeId));
  };

  return (
    <div 
      className={`glass-card overflow-x-auto relative w-full hide-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>
      
      <div className="min-w-[1000px] h-[600px] relative">
        <svg viewBox="0 0 1000 600" className="w-full h-full">
          {/* Draw Edges */}
          {EDGES.map((edge, idx) => {
            const source = NODE_LAYOUT.find(n => n.id === edge.source);
            const target = NODE_LAYOUT.find(n => n.id === edge.target);
            
            // Check if source node has any progress
            const sData = resolveData(source.id);
            const isActive = sData && sData.progress > 0;
            
            return (
              <line 
                key={idx}
                x1={source.x} 
                y1={source.y} 
                x2={target.x} 
                y2={target.y} 
                stroke={isActive ? 'var(--brand-primary-light)' : 'var(--glass-muted)'}
                strokeWidth={isActive ? 3 : 2}
                opacity={isActive ? 0.6 : 0.15}
                className="transition-all duration-500"
              />
            );
          })}
          
          {/* Draw Nodes */}
          {NODE_LAYOUT.map(node => (
            <SkillNode 
              key={node.id} 
              node={node} 
              data={resolveData(node.id)}
              onClick={(data) => {
                if (data) setSelectedPattern(data);
              }}
              isHovered={hoveredNode === node.id}
              onHover={setHoveredNode}
            />
          ))}
        </svg>
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

export default SkillTree;
