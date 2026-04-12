import React from 'react';

export const EnergyIcon = ({ type, className = "w-6 h-6" }: { type: string, className?: string }) => {
  const colors: Record<string, string> = {
    grass: '#7ab700',
    fire: '#ff3100',
    water: '#00c3ff',
    lightning: '#f6ff00',
    psychic: '#b347ff',
    fighting: '#ff8a00',
    darkness: '#3e3e3e',
    metal: '#999999',
    dragon: '#bfa000',
    colorless: '#e0e0e0',
    fairy: '#ff85d0',
  };

  const color = colors[type] || '#ccc';

  // Simplified SVG representations for the 11 types
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="5" />
      <circle cx="50" cy="50" r="25" fill={color} />
    </svg>
  );
};
