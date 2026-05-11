import { Dashboard } from '../components/layout/Dashboard';
import { useBackground } from '../hooks/useBackground';
import { useWidgetStore } from '../store/widgetStore';

const App = () => {
  const bgUrl = useBackground();
  const mode = useWidgetStore((state) => state.mode);

  return (
    <div 
      className={`relative min-h-screen w-full ${mode === 'light' ? 'bg-slate-100 light-mode' : 'bg-slate-950'} bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out font-sans text-theme-text`}
      style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
    >
      {/* Overlay to ensure text readability over the image */}
      <div className={`absolute inset-0 ${mode === 'light' ? 'bg-white/15 backdrop-blur-[1px]' : 'bg-black/40'} z-0 pointer-events-none transition-all duration-700`} />
      
      {/* Main Layout container */}
      <Dashboard />
    </div>
  );
};

export default App;
