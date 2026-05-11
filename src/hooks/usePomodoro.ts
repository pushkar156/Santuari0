import { useState, useEffect, useCallback, useRef } from 'react';

export type PomodoroMode = 'focus' | 'break';

export const usePomodoro = (focusTime = 25, breakTime = 5) => {
  const [timeLeft, setTimeLeft] = useState(focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const timerRef = useRef<number | null>(null);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? focusTime * 60 : breakTime * 60);
    setIsActive(false);
  }, [focusTime, breakTime]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? focusTime * 60 : breakTime * 60);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Alarm/Switch logic
      const nextMode = mode === 'focus' ? 'break' : 'focus';
      switchMode(nextMode);
      // Optional: Play sound or notification
      new Notification('Pomodoro Finished', {
        body: nextMode === 'break' ? 'Time for a break!' : 'Focus time!',
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, switchMode]);

  return {
    timeLeft,
    isActive,
    mode,
    toggleTimer,
    resetTimer,
    switchMode,
    progress: (timeLeft / (mode === 'focus' ? focusTime * 60 : breakTime * 60)) * 100
  };
};
