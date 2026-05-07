import { Dashboard } from '../components/layout/Dashboard';
import { useBackground } from '../hooks/useBackground';
import TargetCursor from '../components/ui/TargetCursor';

import { useWidgetStore } from '../store/widgetStore';

const App = () => {
  const bgUrl = useBackground();
  const mode = useWidgetStore((state) => state.mode);

  return (
    <div 
      className={`relative min-h-screen w-full ${mode === 'light' ? 'bg-slate-50 light-mode' : 'bg-slate-950'} bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out font-sans text-theme-text`}
      style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
    >
      {/* Overlay to ensure text readability over the image */}
      <div className={`absolute inset-0 ${mode === 'light' ? 'bg-white/20' : 'bg-black/40'} mix-blend-multiply z-0 pointer-events-none transition-colors duration-1000`} />
      
      {/* Global Cursor Animation */}
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />

      {/* Main Layout container */}
      <Dashboard />
    </div>
  );
};

export default App;
