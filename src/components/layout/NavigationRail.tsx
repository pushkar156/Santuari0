import React from 'react';
import { Home, CheckSquare, Calendar, Bookmark, HardDrive, Settings } from 'lucide-react';
import { useViewStore, ViewType } from '../../store/viewStore';

const navItems: { id: ViewType; icon: React.FC<any>; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { id: 'drive', icon: HardDrive, label: 'Drive' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export const NavigationRail: React.FC = () => {
  const { activeView, setActiveView } = useViewStore();

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl z-50 shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            title={item.label}
            className={`p-3 rounded-2xl transition-all duration-300 group relative ${
              isActive 
                ? 'bg-white/20 text-white shadow-lg scale-110' 
                : 'text-white/40 hover:text-white hover:bg-white/10 hover:scale-105'
            }`}
          >
            <Icon size={22} className={isActive ? 'drop-shadow-md' : ''} />
            
            {/* Tooltip */}
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
