import React, { useState } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { WidgetContainer } from '../../layout/WidgetContainer';
import { Plus, Check, Trash2, Flame } from 'lucide-react';

export const HabitTracker: React.FC = () => {
  const { habits, addHabit, removeHabit, toggleHabit } = useWidgetStore();
  const [newHabit, setNewHabit] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const calculateStreak = (completedDates: string[]) => {
    if (completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    // Check if streak is still alive (completed today or yesterday)
    const lastDate = new Date(sorted[0]);
    lastDate.setHours(0, 0, 0, 0);
    const diff = (current.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diff > 1) return 0;

    for (let i = 0; i < sorted.length; i++) {
      const date = new Date(sorted[i]);
      date.setHours(0, 0, 0, 0);
      const expected = new Date(current);
      expected.setDate(current.getDate() - i);
      
      if (date.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabit.trim()) {
      addHabit(newHabit.trim());
      setNewHabit('');
    }
  };

  return (
    <WidgetContainer className="flex flex-col p-6 space-y-6 min-w-[320px]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          Habits <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/40">{habits.length}</span>
        </h3>
      </div>

      <form onSubmit={handleAdd} className="relative group">
        <input 
          type="text" 
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="New habit..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 p-1.5 bg-white text-black rounded-lg hover:scale-105 transition-all"
        >
          <Plus size={18} />
        </button>
      </form>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {habits.map((habit) => {
          const isCompleted = habit.completedDates.includes(today);
          const streak = calculateStreak(habit.completedDates);
          
          return (
            <div key={habit.id} className="group flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <button 
                  onClick={() => toggleHabit(habit.id, today)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'border-white/20 text-transparent hover:border-white/40'}`}
                >
                  <Check size={14} strokeWidth={4} />
                </button>
                
                <div className="min-w-0">
                  <span className={`text-sm font-medium truncate block ${isCompleted ? 'text-white/40 line-through' : 'text-white'}`}>
                    {habit.name}
                  </span>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
                      <Flame size={10} fill="currentColor" /> {streak} DAY STREAK
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => removeHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {habits.length === 0 && (
          <div className="text-center py-8 text-white/20 text-sm">
            Add a habit to start tracking
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};
