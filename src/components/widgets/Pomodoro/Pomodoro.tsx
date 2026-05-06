import React from 'react';
import { usePomodoro } from '../../../hooks/usePomodoro';
import { WidgetContainer } from '../../layout/WidgetContainer';
import { Play, Pause, RotateCcw, Coffee, Target } from 'lucide-react';

export const Pomodoro: React.FC = () => {
  const { timeLeft, isActive, mode, toggleTimer, resetTimer, switchMode, progress } = usePomodoro();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <WidgetContainer className="flex flex-col items-center p-6 space-y-6">
      <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full w-full">
        <button 
          onClick={() => switchMode('focus')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full transition-all ${mode === 'focus' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          <Target size={16} /> <span className="text-sm font-medium">Focus</span>
        </button>
        <button 
          onClick={() => switchMode('break')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full transition-all ${mode === 'break' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          <Coffee size={16} /> <span className="text-sm font-medium">Break</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Progress Circle (Simplified) */}
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-white/5"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={440}
            strokeDashoffset={440 - (440 * progress) / 100}
            className={`transition-all duration-1000 ${mode === 'focus' ? 'text-blue-400' : 'text-green-400'}`}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold tracking-tight text-white font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">
            {mode}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={resetTimer}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <RotateCcw size={20} />
        </button>
        
        <button 
          onClick={toggleTimer}
          className={`p-4 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-xl ${isActive ? 'bg-white/10 text-white' : 'bg-white text-black'}`}
        >
          {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>

        <div className="w-11" /> {/* Spacer */}
      </div>
    </WidgetContainer>
  );
};
