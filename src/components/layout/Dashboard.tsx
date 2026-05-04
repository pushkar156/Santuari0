import { useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Clock } from '../widgets/Clock/Clock';
import { Greeting } from '../widgets/Greeting/Greeting';
import { SearchBar } from '../widgets/SearchBar';
import { QuickLinks } from '../widgets/QuickLinks';
import { Weather } from '../widgets/Weather';
import { Todo } from '../widgets/Todo';
import { StickyNotes } from '../widgets/StickyNotes';
import { DraggableWidget } from './DraggableWidget';
import { Settings } from './Settings';
import { Spotify } from '../widgets/Spotify';
import { useSpotify } from '../../hooks/useSpotify';
import { useWidgetStore } from '../../store/widgetStore';

export const Dashboard = () => {
  const { positions, updatePosition, isBlurred, toggleBlur } = useWidgetStore();
  
  // Initialize Spotify Polling
  useSpotify();
  
  // Privacy Blur Shortcut (Alt + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'b') {
        toggleBlur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleBlur]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    
    // We use the current position from state or fall back to (0,0)
    // The jump happened because we were inconsistent with fallbacks
    const currentPos = positions[id] || { x: 0, y: 0 };
    updatePosition(id, currentPos.x + delta.x, currentPos.y + delta.y);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col items-center justify-center min-h-screen relative z-10 w-full px-4 overflow-hidden">
        {/* Settings Menu */}
        <Settings />

        {/* Central focus area */}
        <main className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl space-y-6">
          <div className="space-y-2 flex flex-col items-center">
            <Clock />
            <Greeting />
          </div>
          <SearchBar />
          <QuickLinks />
        </main>
        
        {/* Draggable Widgets */}
        <DraggableWidget id="weather" initialPosition={positions['weather']}>
          <div className={`w-64 transition-all duration-500 overflow-hidden ${isBlurred ? 'privacy-blur' : ''}`}>
            <Weather />
          </div>
        </DraggableWidget>

        <DraggableWidget id="sticky-notes" initialPosition={positions['sticky-notes']}>
          <div className={`w-80 transition-all duration-500 overflow-hidden ${isBlurred ? 'privacy-blur' : ''}`}>
            <StickyNotes />
          </div>
        </DraggableWidget>

        <DraggableWidget id="todo" initialPosition={positions['todo']}>
          <div className={`w-80 transition-all duration-500 overflow-hidden ${isBlurred ? 'privacy-blur' : ''}`}>
            <Todo />
          </div>
        </DraggableWidget>

        <DraggableWidget id="spotify" initialPosition={positions['spotify'] || { x: 1000, y: 40 }}>
          <div className={`w-80 transition-all duration-500 overflow-hidden ${isBlurred ? 'privacy-blur' : ''}`}>
            <Spotify />
          </div>
        </DraggableWidget>
      </div>
    </DndContext>
  );
};
