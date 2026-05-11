import React, { useState } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { WidgetContainer } from '../../layout/WidgetContainer';
import { Plus, Trash2, Calendar, AlarmClock } from 'lucide-react';

export const Countdown: React.FC = () => {
  const { countdowns, addCountdown, removeCountdown } = useWidgetStore();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const calculateRemaining = (target: string) => {
    const diff = new Date(target).getTime() - new Date().getTime();
    if (diff <= 0) return 'Passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h remaining`;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && date) {
      addCountdown(name.trim(), date);
      setName('');
      setDate('');
    }
  };

  return (
    <WidgetContainer className="flex flex-col p-6 space-y-6 min-w-[320px]">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <AlarmClock size={20} className="text-blue-400" /> Countdowns
      </h3>

      <form onSubmit={handleAdd} className="space-y-3">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event name..."
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
          />
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm [color-scheme:dark]"
          />
        </div>
        <button 
          type="submit"
          className="w-full py-2 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Countdown
        </button>
      </form>

      <div className="space-y-3">
        {countdowns.map((item) => (
          <div key={item.id} className="group flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
            <div className="min-w-0">
              <span className="text-sm font-medium text-white block truncate">{item.name}</span>
              <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1 uppercase tracking-wider font-bold">
                <Calendar size={10} /> {new Date(item.targetDate).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-lg font-bold text-blue-400 font-mono">
                  {calculateRemaining(item.targetDate)}
                </span>
              </div>
              <button 
                onClick={() => removeCountdown(item.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {countdowns.length === 0 && (
          <div className="text-center py-8 text-white/20 text-sm">
            Track your next big milestone
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};
