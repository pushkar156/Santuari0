import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};
