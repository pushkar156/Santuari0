import { useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Clock } from '../widgets/Clock/Clock';
import { Greeting } from '../widgets/Greeting/Greeting';
import { SearchBar } from '../widgets/SearchBar';
import { QuickLinks } from '../widgets/QuickLinks';
import { Weather } from '../widgets/Weather';
import { DraggableWidget } from './DraggableWidget';
import { Settings } from './Settings';
import { Spotify } from '../widgets/Spotify';
import { useSpotify } from '../../hooks/useSpotify';
import { useWidgetStore } from '../../store/widgetStore';
import { useViewStore } from '../../store/viewStore';
import { NavigationRail } from './NavigationRail';
import PlaceholderView from '../views/PlaceholderView';
import { CheckSquare, Calendar, Bookmark, HardDrive } from 'lucide-react';

export const Dashboard = () => {
  const { positions, updatePosition, isBlurred, toggleBlur } = useWidgetStore();
  const { activeView } = useViewStore();
  
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
    const currentPos = positions[id] || { x: 0, y: 0 };
    updatePosition(id, currentPos.x + delta.x, currentPos.y + delta.y);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'settings':
        return <Settings />;
      case 'tasks':
        return <PlaceholderView title="Google Tasks" icon={<CheckSquare size={32} />} />;
      case 'calendar':
        return <PlaceholderView title="Google Calendar" icon={<Calendar size={32} />} />;
      case 'bookmarks':
        return <PlaceholderView title="Bookmarks Organizer" icon={<Bookmark size={32} />} />;
      case 'drive':
        return <PlaceholderView title="Local Drive" icon={<HardDrive size={32} />} />;
      case 'home':
      default:
        return (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col items-center justify-center min-h-screen relative z-10 w-full px-4 overflow-hidden">
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

              <DraggableWidget id="spotify" initialPosition={positions['spotify'] || { x: 1000, y: 40 }}>
                <div className={`w-80 transition-all duration-500 overflow-hidden ${isBlurred ? 'privacy-blur' : ''}`}>
                  <Spotify />
                </div>
              </DraggableWidget>
            </div>
          </DndContext>
        );
    }
  };

  return (
    <>
      <NavigationRail />
      <div className="pr-24">
        {renderActiveView()}
      </div>
    </>
  );
};
