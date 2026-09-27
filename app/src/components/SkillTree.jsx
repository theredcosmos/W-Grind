import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Symmetrical top-to-bottom layout (ViewBox 0 0 1200 1000)
const NODE_LAYOUT = [
  { id: 'Array', label: 'Arrays', x: 450, y: 150 },
  { id: 'String', label: 'Strings', x: 750, y: 150 },
  
  { id: 'Two Pointer', label: 'Two Pointers', x: 300, y: 300 },
  { id: 'Linked List', label: 'Linked List', x: 600, y: 300 },
  { id: 'Stack', label: 'Stacks', x: 900, y: 300 },
  
  { id: 'Sliding Window', label: 'Sliding Window', x: 150, y: 450 },
  { id: 'Binary Search', label: 'Binary Search', x: 450, y: 450 },
  { id: 'Tree', label: 'Trees', x: 750, y: 450 },
  { id: 'Bit', label: 'Bit Manipulation', x: 1050, y: 450 },
  
  { id: 'Greedy', label: 'Greedy', x: 300, y: 600 },
  { id: 'Heap', label: 'Heaps', x: 600, y: 600 },
  { id: 'Graph', label: 'Graphs', x: 900, y: 600 },
  
  { id: 'Backtracking', label: 'Backtracking', x: 450, y: 750 },
  { id: 'Dynamic Programming', label: 'DP', x: 750, y: 750 },
  
  { id: 'Design', label: 'Design', x: 600, y: 900 },
];

const SkillNode = ({ node, data, isHovered, onHover }) => {
  const radius = 38; 
  const stroke = 8; 
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const progress = data ? data.progress : 0;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  let colorValue = 'var(--brand-primary-light)';
  let glowColor = 'rgba(167, 139, 250, 0.5)';
  
  if (progress >= 90) {
    colorValue = 'var(--accent-success)';
    glowColor = 'rgba(16, 185, 129, 0.5)';
  } else if (progress >= 50) {
    colorValue = 'var(--accent-warning)';
    glowColor = 'rgba(245, 158, 11, 0.5)';
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
      className="cursor-pointer"
    >
      <motion.g
        animate={{ scale: isHovered ? 1.25 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {progress > 0 && (
          <motion.circle 
            r={radius + 15} 
            fill={glowColor} 
            initial={{ opacity: 0.1, scale: 0.8 }}
            animate={{ 
              opacity: isHovered ? 0.4 : [0.1, 0.35, 0.1],
              scale: isHovered ? 1.1 : [0.85, 1.05, 0.85]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        <circle 
          r={radius} 
          fill="var(--glass-panel)" 
          stroke={isHovered || progress > 0 ? colorValue : "var(--glass-border)"} 
          strokeOpacity={isHovered || progress > 0 ? 0.7 : 0.3} 
          strokeWidth={3} 
          style={{ filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.5))" }}
        />
        
        <text
          y={7}
          textAnchor="middle"
          fill={progress > 0 ? "var(--glass-text)" : "var(--glass-muted)"}
          className="text-[20px] font-black font-sans"
          opacity={progress > 0 ? 0.95 : 0.4}
        >
          {getInitials(node.label)}
        </text>
        
        <circle
          stroke="rgba(255, 255, 255, 0.05)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
        />
        
        <motion.circle
          stroke={colorValue}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
          r={normalizedRadius}
          transform="rotate(-90)"
          style={{ filter: progress > 0 ? `drop-shadow(0 0 8px ${colorValue})` : "none" }}
        />
        
        <text 
          y={radius + 30} 
          textAnchor="middle" 
          fill={progress > 0 ? "var(--glass-text)" : "var(--glass-text)"} 
          className="text-[14px] font-bold font-sans tracking-wide"
          opacity={isHovered ? 1 : (progress > 0 ? 0.9 : 0.5)}
          style={{ filter: isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.2))" : "none" }}
        >
          {node.label}
        </text>
      </motion.g>

      <AnimatePresence>
        {isHovered && data && (
          <motion.g
            initial={{ opacity: 0, y: -25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <rect x={-65} y={-radius - 75} width={130} height={52} rx={14} fill="var(--glass-panel)" stroke="var(--brand-primary-light)" strokeWidth={1} style={{ filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.6)) backdrop-filter: blur(12px)" }} />
            <text x={0} y={-radius - 50} textAnchor="middle" fill="var(--glass-text)" className="text-[12px] font-bold">{data.completed} / {data.total} Solved</text>
            <text x={0} y={-radius - 32} textAnchor="middle" fill={colorValue} className="text-[12px] font-black">{Math.round(progress)}% Mastery</text>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
};

const SkillTree = ({ patterns, completed }) => {
  const [hoveredNode, setHoveredNode] = useState(null);

  const resolveData = (nodeId) => {
    return patterns.find(p => p.name.includes(nodeId));
  };

  // Dynamically calculate edges using Minimum Spanning Tree (Kruskal's)
  // This guarantees a clean, un-messy layout connecting ONLY unlocked nodes perfectly.
  const dynamicEdges = useMemo(() => {
    const unlockedNodes = NODE_LAYOUT.filter(n => {
      const d = resolveData(n.id);
      return d && d.progress > 0;
    });

    if (unlockedNodes.length <= 1) return [];

    const possibleEdges = [];
    for (let i = 0; i < unlockedNodes.length; i++) {
      for (let j = i + 1; j < unlockedNodes.length; j++) {
        const n1 = unlockedNodes[i];
        const n2 = unlockedNodes[j];
        const dist = Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
        possibleEdges.push({ source: n1, target: n2, dist });
      }
    }
    
    // Sort edges by distance (closest nodes first)
    possibleEdges.sort((a, b) => a.dist - b.dist);
    
    const parent = {};
    unlockedNodes.forEach(n => parent[n.id] = n.id);
    
    const find = (i) => {
      if (parent[i] === i) return i;
      return parent[i] = find(parent[i]);
    };
    
    const union = (i, j) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
        return true;
      }
      return false;
    };
    
    const mst = [];
    for (const edge of possibleEdges) {
      if (union(edge.source.id, edge.target.id)) {
        mst.push(edge);
      }
    }
    return mst;
  }, [patterns]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card relative w-full h-full flex items-center justify-center p-4 lg:p-8 overflow-hidden"
    >
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--glass-text) 1px, transparent 1px), linear-gradient(90deg, var(--glass-text) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      <div className="w-full h-full max-w-6xl relative flex items-center justify-center z-10">
        <svg viewBox="0 0 1200 1000" className="w-full h-auto max-h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="flameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            
            {/* SVG Turbulence for premium purple flame energy effect */}
            <filter id="flameEffect" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise">
                <animate attributeName="baseFrequency" values="0.015;0.025;0.015" dur="3s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />
              <feGaussianBlur in="displaced" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Draw Dynamic Minimum Spanning Tree Edges */}
          {dynamicEdges.map((edge, idx) => {
            const isHoveringConnection = hoveredNode === edge.source.id || hoveredNode === edge.target.id;
            
            return (
              <g key={idx}>
                {/* Solid base structural line to ensure visibility in Light Mode */}
                <motion.line 
                  x1={edge.source.x} 
                  y1={edge.source.y} 
                  x2={edge.target.x} 
                  y2={edge.target.y} 
                  stroke="var(--glass-text)"
                  strokeWidth={2}
                  opacity={isHoveringConnection ? 0.3 : 0.15}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.15 }}
                />

                {/* Core energy beam */}
                <motion.line 
                  x1={edge.source.x} 
                  y1={edge.source.y} 
                  x2={edge.target.x} 
                  y2={edge.target.y} 
                  stroke="url(#flameGradient)"
                  strokeWidth={isHoveringConnection ? 10 : 6}
                  opacity={isHoveringConnection ? 1 : 0.75}
                  strokeLinecap="round"
                  style={{ filter: "url(#flameEffect)", transition: "stroke-width 0.4s, opacity 0.4s" }}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: isHoveringConnection ? 1 : 0.75 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.15 }}
                />
                
                {/* Intense central laser core */}
                <motion.line 
                  x1={edge.source.x} 
                  y1={edge.source.y} 
                  x2={edge.target.x} 
                  y2={edge.target.y} 
                  stroke="var(--glass-text)"
                  strokeWidth={isHoveringConnection ? 3 : 1.5}
                  opacity={isHoveringConnection ? 1 : 0.7}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 6px var(--glass-text))", transition: "stroke-width 0.3s" }}
                  strokeDasharray="10 30"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: -edge.dist }}
                  transition={{ duration: edge.dist / 60, ease: "linear", repeat: Infinity }}
                />
              </g>
            );
          })}
          
          {/* Draw Nodes */}
          {NODE_LAYOUT.map((node, idx) => (
            <motion.g 
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: idx * 0.05, type: "spring", stiffness: 200 }}
            >
              <SkillNode 
                node={node} 
                data={resolveData(node.id)}
                isHovered={hoveredNode === node.id}
                onHover={setHoveredNode}
              />
            </motion.g>
          ))}
        </svg>
      </div>
    </motion.div>
  );
};

export default SkillTree;
