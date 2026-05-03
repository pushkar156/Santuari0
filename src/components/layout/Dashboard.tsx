import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Clock } from '../widgets/Clock/Clock';
import { Greeting } from '../widgets/Greeting/Greeting';
import { SearchBar } from '../widgets/SearchBar';
import { QuickLinks } from '../widgets/QuickLinks';
import { Weather } from '../widgets/Weather';
import { Todo } from '../widgets/Todo';
import { StickyNotes } from '../widgets/StickyNotes';
import { DraggableWidget } from './DraggableWidget';
import { useWidgetStore } from '../../store/widgetStore';

export const Dashboard = () => {
  const { positions, updatePosition } = useWidgetStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    
    const currentPos = positions[id] || { x: 0, y: 0 };
    updatePosition(id, currentPos.x + delta.x, currentPos.y + delta.y);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col items-center justify-center min-h-screen relative z-10 w-full px-4 overflow-hidden">
        {/* Central focus area (kept centered by default, but could be made draggable too) */}
        <main className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl space-y-6">
          <div className="space-y-2 flex flex-col items-center">
            <Clock />
            <Greeting />
          </div>
          <SearchBar />
          <QuickLinks />
        </main>
        
        {/* Draggable Widgets */}
        <DraggableWidget id="weather" initialPosition={positions['weather'] || { x: 20, y: 20 }}>
          <div className="w-64">
            <Weather />
          </div>
        </DraggableWidget>

        <DraggableWidget id="sticky-notes" initialPosition={positions['sticky-notes'] || { x: 20, y: 500 }}>
          <div className="w-80">
            <StickyNotes />
          </div>
        </DraggableWidget>

        <DraggableWidget id="todo" initialPosition={positions['todo'] || { x: 1000, y: 500 }}>
          <div className="w-80">
            <Todo />
          </div>
        </DraggableWidget>
      </div>
    </DndContext>
  );
};
