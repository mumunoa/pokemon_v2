import React from 'react';

export const EnergyIcon = ({ type, className = "w-6 h-6" }: { type: string, className?: string }) => {
  const images: Record<string, string> = {
    grass: '/assets/symbols/grass.png',
    fire: '/assets/symbols/fire.png',
    water: '/assets/symbols/water.png',
    lightning: '/assets/symbols/lightning.png',
    psychic: '/assets/symbols/psychic.png',
    fighting: '/assets/symbols/fighting.png',
    darkness: '/assets/symbols/darkness.png',
    metal: '/assets/symbols/metal.png',
    dragon: '/assets/symbols/dragon.png',
    colorless: '/assets/symbols/colorless.png',
    fairy: '/assets/symbols/fairy.png',
  };

  const src = images[type];

  if (!src) return null;

  return (
    <img src={src} alt={type} className={`${className} object-contain`} />
  );
};
