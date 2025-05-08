import React, { createContext, useState, useContext, useEffect } from 'react';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  // Check localStorage for saved preference, default to true if not found
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const savedSoundPreference = localStorage.getItem('soundEnabled');
    return savedSoundPreference === null ? true : savedSoundPreference === 'true';
  });

  // Update localStorage when preference changes
  useEffect(() => {
    localStorage.setItem('soundEnabled', isSoundEnabled);
  }, [isSoundEnabled]);

  const toggleSound = () => {
    setIsSoundEnabled(prevState => !prevState);
  };

  return (
    <SoundContext.Provider value={{ isSoundEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext); 