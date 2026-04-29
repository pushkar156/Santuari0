import { Clock } from '../widgets/Clock/Clock';
import { Greeting } from '../widgets/Greeting/Greeting';

export const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative z-10 w-full px-4">
      {/* Central focus area */}
      <main className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl space-y-2">
        <Clock />
        <Greeting />
      </main>
      
      {/* Future widget areas can go here (bottom, corners, etc.) */}
    </div>
  );
};
