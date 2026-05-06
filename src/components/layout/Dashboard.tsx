import { useEffect } from 'react';
import { Clock } from '../widgets/Clock/Clock';
import { Greeting } from '../widgets/Greeting/Greeting';
import { SearchBar } from '../widgets/SearchBar';
import { QuickLinks } from '../widgets/QuickLinks';
import { Weather } from '../widgets/Weather';
import { Settings } from './Settings';
import { Spotify } from '../widgets/Spotify';
import { useSpotify } from '../../hooks/useSpotify';
import { useWidgetStore } from '../../store/widgetStore';
import { useViewStore } from '../../store/viewStore';
import { NavigationRail } from './NavigationRail';
import PlaceholderView from '../views/PlaceholderView';
import { CheckSquare, Calendar, Bookmark, HardDrive } from 'lucide-react';

export const Dashboard = () => {
  const { isBlurred, toggleBlur } = useWidgetStore();
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
          <div className="min-h-screen w-full flex flex-col justify-center px-8 relative z-10 overflow-hidden py-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-7xl mx-auto items-stretch min-h-[70vh]">
              
              {/* Left Column (Weather & Spotify) */}
              <div className="col-span-12 md:col-span-3 flex flex-col justify-between">
                <div className={`w-full max-w-[280px] transition-all duration-500 ${isBlurred ? 'privacy-blur' : ''}`}>
                  <Weather />
                </div>

                <div className={`w-full max-w-[320px] transition-all duration-500 mt-12 ${isBlurred ? 'privacy-blur' : ''}`}>
                  <Spotify />
                </div>
              </div>

              {/* Main Content Column (Clock, Search, Links) */}
              <div className="col-span-12 md:col-span-7 md:col-start-6 flex flex-col items-start space-y-12 mt-4 md:mt-0 pt-8 lg:pr-12">
                <div className="space-y-4 flex flex-col items-start text-left w-full">
                  <Clock />
                  <div className="pl-1"><Greeting /></div>
                </div>
                <div className="w-full max-w-2xl">
                  <SearchBar />
                </div>
                <div className="w-full max-w-2xl">
                  <QuickLinks />
                </div>
              </div>

              {/* Right Column (Empty spacer for balance) */}
              <div className="hidden md:block md:col-span-3"></div>

            </div>
          </div>
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
