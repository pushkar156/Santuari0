import { useTime } from '../../../hooks/useTime';
import { useGreeting } from '../../../hooks/useGreeting';
import { useWidgetStore } from '../../../store/widgetStore';

export const Greeting = () => {
  const time = useTime();
  const greeting = useGreeting(time);
  const { userName } = useWidgetStore();

  return (
    <div className="mt-4 flex flex-col items-start justify-start select-none opacity-90">
      <h2 className="text-3xl md:text-5xl font-medium tracking-wide text-white drop-shadow-md">
        {greeting}, {userName}.
      </h2>
    </div>
  );
};
