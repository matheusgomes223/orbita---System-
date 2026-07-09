import React from 'react';

export function OrbitaIcon({ className = "", spinning = false }: { className?: string, spinning?: boolean }) {
  return (
    <svg 
      viewBox="0 0 160 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>
        {`
          .rocket-tail {
            stroke-dasharray: 60 250;
            animation: orbit-anim 1.2s linear infinite;
          }
          .rocket-tail-2 {
            stroke-dasharray: 60 250;
            animation: orbit-anim 1.5s linear infinite;
            animation-direction: reverse;
          }
          @keyframes orbit-anim {
            0% { stroke-dashoffset: 310; }
            100% { stroke-dashoffset: 0; }
          }
        `}
      </style>
      <g transform="translate(10, 10)">
        {/* Core Element (Planet) */}
        <circle cx="70" cy="70" r="22" fill="#0C2340"/>
        
        {/* Orbit Background Tracks (visible when spinning) */}
        {spinning && (
          <>
            <ellipse cx="70" cy="70" rx="65" ry="25" transform="rotate(-35 70 70)" stroke="#0C2340" strokeWidth="2" opacity="0.15"/>
            <ellipse cx="70" cy="70" rx="65" ry="25" transform="rotate(35 70 70)" stroke="#00B4F1" strokeWidth="2" opacity="0.15"/>
          </>
        )}

        {/* Dark Navy Orbit / Rocket Tail */}
        <ellipse 
          cx="70" 
          cy="70" 
          rx="65" 
          ry="25" 
          transform="rotate(-35 70 70)" 
          stroke="#0C2340" 
          strokeWidth="6"
          className={spinning ? "rocket-tail" : ""}
          strokeLinecap={spinning ? "round" : "butt"}
        />
        
        {/* Light Blue Orbit / Rocket Tail */}
        <ellipse 
          cx="70" 
          cy="70" 
          rx="65" 
          ry="25" 
          transform="rotate(35 70 70)" 
          stroke="#00B4F1" 
          strokeWidth="6"
          className={spinning ? "rocket-tail-2" : ""}
          strokeLinecap={spinning ? "round" : "butt"}
        />
        
        {/* Static Electrons (hidden when spinning to focus on the rocket effect) */}
        {!spinning && (
          <>
            <circle cx="34" cy="45" r="7" fill="#F7A800"/>
            <circle cx="106" cy="45" r="5" fill="#00B4F1"/>
          </>
        )}
      </g>
    </svg>
  );
}
