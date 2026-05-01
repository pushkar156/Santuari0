import { useTime } from '../../../hooks/useTime';

export const Clock = () => {
  const time = useTime();

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // or false based on preference, 12h is common
  }).replace(/^0/, ''); // Remove leading zero from hour if present

  return (
    <div className="flex flex-col items-center justify-center select-none animate-pulse">
      <h1 className="text-8xl md:text-[10rem] font-bold tracking-tighter text-white drop-shadow-lg transition-transform duration-700 hover:scale-105">
        {formattedTime}
      </h1>
    </div>
  );
};
