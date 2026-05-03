import { Clock } from '../widgets/Clock/Clock';
import { Greeting } from '../widgets/Greeting/Greeting';
import { SearchBar } from '../widgets/SearchBar';
import { QuickLinks } from '../widgets/QuickLinks';
import { Weather } from '../widgets/Weather';
import { Todo } from '../widgets/Todo';
import { StickyNotes } from '../widgets/StickyNotes';

export const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative z-10 w-full px-4">
      {/* Top right corner widgets */}
      <div className="absolute top-8 right-8 w-64">
        <Weather />
      </div>

      {/* Central focus area */}
      <main className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl space-y-6">
        <div className="space-y-2 flex flex-col items-center">
          <Clock />
          <Greeting />
        </div>
        <SearchBar />
        <QuickLinks />
      </main>
      
      {/* Bottom widgets area */}
      <div className="absolute bottom-8 left-8 w-80">
        <StickyNotes />
      </div>
      <div className="absolute bottom-8 right-8 w-80">
        <Todo />
      </div>
    </div>
  );
};
