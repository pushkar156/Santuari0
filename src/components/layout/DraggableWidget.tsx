import { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface DraggableWidgetProps {
  id: string;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
}

export const DraggableWidget = ({ id, children, initialPosition }: DraggableWidgetProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    left: initialPosition?.x ?? 0,
    top: initialPosition?.y ?? 0,
    zIndex: transform ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group relative">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-theme-glass backdrop-blur-sm border border-theme-border hover:bg-theme-hover text-theme-muted hover:text-theme-text rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold z-50"
        >
          ⠿ Drag
        </div>
        {children}
      </div>
    </div>
  );
};
