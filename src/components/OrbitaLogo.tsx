import React from 'react';

export function OrbitaLogo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 500 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(10, 10)">
        {/* Core Element */}
        <circle cx="70" cy="70" r="22" fill="#0C2340"/>
        
        {/* Dark Navy Orbit (tilted positively) */}
        <ellipse 
          cx="70" 
          cy="70" 
          rx="65" 
          ry="25" 
          transform="rotate(-35 70 70)" 
          stroke="#0C2340" 
          strokeWidth="6"
        />
        
        {/* Light Blue Orbit (tilted negatively) */}
        <ellipse 
          cx="70" 
          cy="70" 
          rx="65" 
          ry="25" 
          transform="rotate(35 70 70)" 
          stroke="#00B4F1" 
          strokeWidth="6"
        />
        
        {/* Amber Electron */}
        <circle cx="34" cy="45" r="7" fill="#F7A800"/>
        
        {/* Light Blue Electron */}
        <circle cx="106" cy="45" r="5" fill="#00B4F1"/>
        
        {/* Logo Text */}
        <text 
          x="160" 
          y="90" 
          fontFamily="Inter, system-ui, sans-serif" 
          fontWeight="600" 
          fontSize="72" 
          letterSpacing="-0.02em" 
          fill="#0C2340"
        >
          Órbita
        </text>
        
        {/* Subtitle */}
        <text 
          x="165" 
          y="125" 
          fontFamily="Inter, system-ui, sans-serif" 
          fontWeight="600" 
          fontSize="18" 
          letterSpacing="0.25em" 
          fill="#0C2340"
        >
          MATERIAIS E PROJETOS
        </text>
      </g>
    </svg>
  );
}
