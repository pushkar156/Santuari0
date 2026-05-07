import { useEffect } from 'react';
import { Clock } from '../widgets/Clock/Clock';
import { SearchBar } from '../widgets/SearchBar';
import { QuickLinks } from '../widgets/QuickLinks';
import { Weather } from '../widgets/Weather';
import { Settings } from './Settings';
import { BackgroundSettings } from './BackgroundSettings';
import { Spotify } from '../widgets/Spotify';
import { useSpotify } from '../../hooks/useSpotify';
import { useWidgetStore } from '../../store/widgetStore';
import { useViewStore, ViewType } from '../../store/viewStore';
import { NavigationRail } from './NavigationRail';
import PlaceholderView from '../views/PlaceholderView';
import { TasksView } from '../views/TasksView';
import { Calendar, Bookmark, HardDrive, Bot } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export const Dashboard = () => {
  const { isBlurred, toggleBlur } = useWidgetStore();
  const { activeView, lastMainView, setActiveView } = useViewStore();

  // Initialize Spotify Polling
  useSpotify(true);
  
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

  const renderViewContent = (view: ViewType) => {
    switch (view) {
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <PlaceholderView title="Google Calendar" icon={<Calendar size={32} />} />;
      case 'bookmarks':
        return <PlaceholderView title="Bookmarks Organizer" icon={<Bookmark size={32} />} />;
      case 'drive':
        return <PlaceholderView title="Local Drive" icon={<HardDrive size={32} />} />;
      case 'ovi':
        return <PlaceholderView title="OVI AI Assistant" icon={<Bot size={32} />} />;
      case 'home':
      default:
        return (
          <div className="h-screen w-full flex flex-col justify-center px-8 relative z-10 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-7xl mx-auto items-center h-full max-h-[90vh]">
              
              {/* Left Column (Weather & Spotify) */}
              <div className="col-span-12 md:col-span-3 flex flex-col justify-center space-y-12 h-full">
                <div className={`w-full max-w-[280px] transition-all duration-500 ${isBlurred ? 'privacy-blur' : ''}`}>
                  <Weather />
                </div>

                <div className={`w-full max-w-[320px] transition-all duration-500 ${isBlurred ? 'privacy-blur' : ''}`}>
                  <Spotify />
                </div>
              </div>

              {/* Main Content Column (Clock, Search, Links) */}
              <div className="col-span-12 md:col-span-8 md:col-start-5 flex flex-col items-center space-y-10 py-4">
                <div className="flex flex-col items-center w-full">
                  <Clock />
                </div>
                <div className="w-full max-w-2xl">
                  <SearchBar />
                </div>
                <div className="w-full max-w-4xl px-4">
                  <QuickLinks />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <NavigationRail />
      <div className="pr-24">
        {renderViewContent(lastMainView)}
      </div>
      
      <AnimatePresence>
        {/* Settings Modal */}
        {activeView === 'settings' && (
          <Settings key="settings-modal" onClose={() => setActiveView(lastMainView)} />
        )}

        {/* Background Settings Modal */}
        {activeView === 'background' && (
          <BackgroundSettings key="background-modal" onClose={() => setActiveView(lastMainView)} />
        )}
      </AnimatePresence>
    </>
  );
};
