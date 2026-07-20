import React from 'react';

export default function NasCloudLogo({ size = 28, className, style, usePinkGradient = false, cColor = 'currentColor' }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      width={size} 
      height={size} 
      className={className}
      style={{ 
        display: 'inline-block', 
        verticalAlign: 'middle',
        overflow: 'visible',
        ...style 
      }}
    >
      <defs>
        {/* Glow effect for the N chevron */}
        <filter id="nGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="0 0 0 0 0.66
                    0 0 0 0 0.85
                    0 0 0 0 0.31
                    0 0 0 0 0.5 0" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Pink Gradient for the C Arc */}
        <linearGradient id="cPinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>

        {/* Glow effect for the C arc when pink gradient is used */}
        <filter id="cGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="0 0 0 0 0.93
                    0 0 0 0 0.28
                    0 0 0 0 0.60
                    0 0 0 0 0.45 0" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* N Chevron - Bright Lime Green with Glow */}
      <polyline points="65,400 170,130 280,400 330,100"
                fill="none"
                stroke="#A8D84E"
                strokeWidth="64"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#nGlow)"/>
                
      {/* C Arc */}
      <path d="M 415,145 A 148,148 0 1,0 415,395"
            fill="none"
            stroke={usePinkGradient ? "url(#cPinkGradient)" : cColor}
            strokeWidth="64"
            strokeLinecap="round"
            filter={usePinkGradient ? "url(#cGlow)" : undefined}/>
    </svg>
  );
}
