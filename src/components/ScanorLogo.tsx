import React from 'react';
import { motion } from 'motion/react';

interface ScanorLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function ScanorLogo({ className = '', size = 'md' }: ScanorLogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: '12',
    md: '18',
    lg: '24',
    xl: '36'
  };

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center ${className}`}>
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
      
      {/* Main Shape */}
      <motion.div 
        whileHover={{ scale: 1.05, rotate: 5 }}
        className="relative w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 overflow-hidden"
      >
        {/* Subtle texture/lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:4px_4px]" />
        
        {/* The 'S' Logo Design */}
        <svg 
          viewBox="0 0 24 24" 
          width={iconSizes[size]} 
          height={iconSizes[size]} 
          fill="none" 
          stroke="black" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="relative z-10 drop-shadow-sm"
        >
          <path d="M16 4.5a3.5 3.5 0 0 0-3.5-3.5H10A3.5 3.5 0 0 0 6.5 4.5v3A3.5 3.5 0 0 0 10 11h4a3.5 3.5 0 0 1 3.5 3.5v3a3.5 3.5 0 0 1-3.5 3.5H11.5a3.5 3.5 0 0 1-3.5-3.5" />
          {/* Inner Light Path */}
          <path 
            d="M16 4.5a3.5 3.5 0 0 0-3.5-3.5H10" 
            stroke="white" 
            strokeWidth="1" 
            className="opacity-50"
          />
        </svg>

        {/* Shine Effect */}
        <motion.div 
          animate={{
            x: ['-140%', '140%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
        />
      </motion.div>
    </div>
  );
}
