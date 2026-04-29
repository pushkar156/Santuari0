import { useState, useEffect } from 'react';

// Curated list of high-quality Unsplash backgrounds to ensure a premium look
// without needing an API key for the initial prototype.
const PREMIUM_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1506744626753-dba37c19e951?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop',
];

export const useBackground = () => {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    // Select a random premium image on mount
    const randomImage = PREMIUM_BACKGROUNDS[Math.floor(Math.random() * PREMIUM_BACKGROUNDS.length)];
    setBackgroundUrl(randomImage);
  }, []);

  return backgroundUrl;
};
