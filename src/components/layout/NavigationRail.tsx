import React from 'react';
import { Home, CheckSquare, Calendar, Bookmark, HardDrive, Settings, Sun, Moon, Bot, Image as ImageIcon } from 'lucide-react';
import { useViewStore, ViewType } from '../../store/viewStore';
import { useWidgetStore } from '../../store/widgetStore';
import GooeyNav, { GooeyNavItem } from '../ui/GooeyNav';

const navItems: GooeyNavItem[] = [
  { id: 'home', icon: <Home size={22} />, label: 'Home' },
  { id: 'tasks', icon: <CheckSquare size={22} />, label: 'Tasks' },
  { id: 'calendar', icon: <Calendar size={22} />, label: 'Calendar' },
  { id: 'bookmarks', icon: <Bookmark size={22} />, label: 'Bookmarks' },
  { type: 'separator' },
  { id: 'drive', icon: <HardDrive size={22} />, label: 'Drive' },
  { id: 'ovi', icon: <Bot size={22} />, label: 'OVI' },
];

export const NavigationRail: React.FC = () => {
  const { activeView, lastMainView, setActiveView } = useViewStore();
  const { mode, setMode } = useWidgetStore();

  const activeIndex = navItems.findIndex(item => 'id' in item && item.id === lastMainView);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 p-2 bg-theme-glass backdrop-blur-md border border-theme-border rounded-full z-50 shadow-2xl flex flex-col items-center gap-2">
      <GooeyNav
        items={navItems as any}
        vertical={true}
        particleCount={15}
        particleDistances={[90, 10]}
        particleR={100}
        initialActiveIndex={activeIndex === -1 ? 0 : activeIndex}
        animationTime={600}
        timeVariance={300}
        colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        onItemClick={(id) => setActiveView(id as ViewType)}
      />
      <div className="w-8 h-px bg-theme-border my-1 rounded-full" />
      <div className="flex flex-col items-center gap-2 pb-2">
        <button
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          className="p-3 rounded-full text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors duration-300 relative group"
          title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mode === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        <button
          onClick={() => setActiveView('background')}
          className={`p-3 rounded-full transition-colors duration-300 relative group ${
            activeView === 'background' ? 'text-theme-text bg-theme-hover' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title="Background Settings"
        >
          <ImageIcon size={22} />
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className={`p-3 rounded-full transition-colors duration-300 relative group ${
            activeView === 'settings' ? 'text-theme-text bg-theme-hover' : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
          }`}
          title="Settings"
        >
          <Settings size={22} />
        </button>
      </div>
    </div>
  );
};
