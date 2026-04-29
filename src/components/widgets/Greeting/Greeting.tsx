import { useTime } from '../../../hooks/useTime';
import { useGreeting } from '../../../hooks/useGreeting';

export const Greeting = () => {
  const time = useTime();
  const greeting = useGreeting(time);

  return (
    <div className="mt-4 flex flex-col items-center justify-center select-none opacity-90">
      <h2 className="text-3xl md:text-5xl font-medium tracking-wide text-white drop-shadow-md">
        {greeting}, Pushkar.
      </h2>
    </div>
  );
};
