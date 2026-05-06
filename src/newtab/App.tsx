import { Dashboard } from '../components/layout/Dashboard';
import { useBackground } from '../hooks/useBackground';
import TargetCursor from '../components/ui/TargetCursor';

const App = () => {
  const bgUrl = useBackground();

  return (
    <div 
      className="relative min-h-screen w-full bg-slate-900 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out font-sans"
      style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
    >
      {/* Overlay to ensure text readability over the image */}
      <div className="absolute inset-0 bg-black/40 mix-blend-multiply z-0 pointer-events-none" />
      
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
