import React from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { StickyNote } from 'lucide-react';
import { WidgetContainer } from '../../layout/WidgetContainer';

export const StickyNotes: React.FC = () => {
  const { notes, updateNotes } = useWidgetStore();

  return (
    <WidgetContainer className="w-full h-full flex flex-col min-h-[300px]">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <StickyNote size={20} /> Sticky Notes
      </h3>
      
      <textarea
        value={notes}
        onChange={(e) => updateNotes(e.target.value)}
        placeholder="Type your notes here... They'll save automatically."
        className="flex-1 w-full bg-transparent resize-none outline-none text-sm text-theme-text placeholder-theme-muted custom-scrollbar pr-1 leading-relaxed"
      />
      
      <div className="mt-4 pt-4 border-t border-theme-border text-[10px] text-theme-muted text-right italic">
        Autosaved locally
      </div>
    </WidgetContainer>
  );
};
