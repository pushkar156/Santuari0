import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  LogOut, 
  Loader2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Layout,
  Plus,
  Trash2,
  StickyNote,
  Hash
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';
import { CalendarEvent } from '../../services/googleCalendar';

export const CalendarView: React.FC = () => {
  const { 
    calendars, 
    eventsByCalendar, 
    activeCalendarId, 
    isLoading, 
    isAuthenticated,
    fetchCalendars,
    setActiveCalendar,
    sync,
    logout,
    updateEvent,
    removeEvent,
    addEvent
  } = useCalendarStore();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');

  useEffect(() => {
    if (isAuthenticated && calendars.length === 0) {
      fetchCalendars();
    }
  }, [isAuthenticated, calendars.length, fetchCalendars]);

  const activeEvents = useMemo(() => {
    return eventsByCalendar[activeCalendarId] || [];
  }, [eventsByCalendar, activeCalendarId]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    activeEvents.forEach(event => {
      const dateStr = event.start.dateTime || event.start.date;
      if (!dateStr) return;
      const date = format(parseISO(dateStr), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeEvents]);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM do');
  };

  const handleAddQuickEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    await addEvent({
      summary: newEventTitle,
      start: { dateTime: new Date().toISOString() },
      end: { dateTime: new Date(Date.now() + 3600000).toISOString() } // 1 hour later
    });
    setNewEventTitle('');
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="theme-glass p-12 max-w-md w-full text-center space-y-8"
        >
          <div className="w-20 h-20 bg-theme-bg-accent rounded-3xl mx-auto flex items-center justify-center shadow-lg">
            <CalendarIcon size={40} className="text-theme-contrast" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-theme-text">Calendar Workspace</h1>
            <p className="text-theme-muted">Sync your Google Calendar to stay on top of your schedule.</p>
          </div>
          
          <div className="space-y-4 pt-4">
            <button 
              onClick={() => sync()}
              className="w-full bg-theme-bg-accent text-theme-contrast py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <RefreshCw size={20} />
              Connect Google Calendar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedEvent = selectedEventId ? activeEvents.find(e => e.id === selectedEventId) : null;
  const activeCalendar = calendars.find(c => c.id === activeCalendarId);

  return (
    <div className="h-screen w-full flex overflow-hidden p-6 gap-6 bg-theme-bg">
      {/* Sidebar - Calendars */}
      <aside className="w-72 flex flex-col gap-6">
        <div className="theme-glass p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-xl font-bold text-theme-text flex items-center gap-2">
              <Layout size={20} /> Calendars
            </h2>
            <button 
              onClick={() => sync()} 
              className={`text-theme-muted hover:text-theme-text transition-colors ${isLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            {calendars.map((cal) => (
              <button
                key={cal.id}
                onClick={() => setActiveCalendar(cal.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeCalendarId === cal.id 
                    ? 'bg-theme-bg-accent text-theme-contrast shadow-lg' 
                    : 'text-theme-muted hover:bg-theme-hover'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: cal.backgroundColor || 'currentColor' }} 
                />
                <span className="font-medium truncate">{cal.summary}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all">
              <LogOut size={18} />
              <span className="font-medium">Disconnect</span>
            </button>
          </div>
        </div>

        <div className="theme-glass p-6 flex flex-col justify-end">
          <div className="space-y-4">
            <p className="text-xs text-theme-muted uppercase tracking-wider font-bold mb-1">Upcoming Events</p>
            <h4 className="text-2xl font-bold text-theme-text">
              {activeEvents.length}
            </h4>
            <div className="h-2 w-full bg-theme-border rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-theme-bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((activeEvents.length / 10) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Agenda Area */}
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        <header className="theme-glass p-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-theme-text">
              {activeCalendar?.summary || 'Schedule'}
            </h1>
            <p className="text-theme-muted">{format(new Date(), 'EEEE, MMMM do')}</p>
          </div>
          {isLoading && <Loader2 className="text-theme-bg-accent animate-spin" size={24} />}
        </header>

        <section className="flex-1 theme-glass overflow-hidden flex flex-col">
          <div className="p-8 border-b border-theme-border">
            <form onSubmit={handleAddQuickEvent} className="relative group">
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-bg-accent transition-colors" size={24} />
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Press Enter to add quick event today..."
                className="w-full bg-theme-hover rounded-2xl py-4 pl-14 pr-6 text-lg text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/30 transition-all"
              />
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {groupedEvents.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 select-none py-20">
                <CalendarIcon size={64} className="mb-4" />
                <p className="text-xl font-medium">Clear schedule!</p>
              </div>
            ) : (
              groupedEvents.map(([date, events]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-4 sticky top-0 bg-theme-bg/50 backdrop-blur-sm py-2 z-10">
                    <h3 className="text-sm font-bold text-theme-bg-accent uppercase tracking-widest">
                      {getDateLabel(date)}
                    </h3>
                    <div className="h-px flex-1 bg-theme-border" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {events.map((event) => (
                      <EventItem 
                        key={event.id}
                        event={event}
                        calendarColor={activeCalendar?.backgroundColor || 'var(--theme-bg-accent)'}
                        onSelect={() => setSelectedEventId(event.id)}
                        isSelected={selectedEventId === event.id}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Details Pane */}
      <AnimatePresence>
        {selectedEventId && selectedEvent && (
          <motion.aside
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-96 theme-glass p-8 flex flex-col gap-8 shadow-2xl relative z-10"
          >
            <div className="flex justify-between items-start">
              <h2 className="text-sm font-bold text-theme-muted uppercase tracking-widest">Event Details</h2>
              <button onClick={() => setSelectedEventId(null)} className="p-2 hover:bg-theme-hover rounded-xl text-theme-muted">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-wider">
                   <Hash size={12} /> Title
                </label>
                <textarea
                  className="w-full bg-theme-hover rounded-xl p-4 text-theme-text font-bold resize-none outline-none focus:ring-1 focus:ring-theme-bg-accent/30"
                  value={selectedEvent.summary}
                  rows={2}
                  onChange={(e) => updateEvent(selectedEvent.id, { summary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-wider">
                  <StickyNote size={12} /> Description
                </label>
                <textarea
                  className="w-full bg-theme-hover rounded-xl p-4 text-theme-text text-sm resize-none outline-none focus:ring-1 focus:ring-theme-bg-accent/30 min-h-[120px]"
                  placeholder="Add details..."
                  value={selectedEvent.description || ''}
                  onChange={(e) => updateEvent(selectedEvent.id, { description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-wider">
                    <Clock size={12} /> Start
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full bg-theme-hover rounded-xl p-3 text-theme-text text-xs outline-none focus:ring-1 focus:ring-theme-bg-accent/30"
                    value={selectedEvent.start.dateTime ? selectedEvent.start.dateTime.slice(0, 16) : ''}
                    onChange={(e) => updateEvent(selectedEvent.id, { start: { dateTime: new Date(e.target.value).toISOString() } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-wider">
                    <Clock size={12} /> End
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full bg-theme-hover rounded-xl p-3 text-theme-text text-xs outline-none focus:ring-1 focus:ring-theme-bg-accent/30"
                    value={selectedEvent.end.dateTime ? selectedEvent.end.dateTime.slice(0, 16) : ''}
                    onChange={(e) => updateEvent(selectedEvent.id, { end: { dateTime: new Date(e.target.value).toISOString() } })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-wider">
                  <MapPin size={12} /> Location
                </label>
                <input
                  className="w-full bg-theme-hover rounded-xl p-4 text-theme-text text-sm outline-none focus:ring-1 focus:ring-theme-bg-accent/30"
                  placeholder="Add location..."
                  value={selectedEvent.location || ''}
                  onChange={(e) => updateEvent(selectedEvent.id, { location: e.target.value })}
                />
              </div>

              <div className="pt-4">
                <a 
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl border border-dashed border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-text transition-all flex items-center justify-center gap-2 text-sm font-bold bg-theme-hover/50 hover:bg-theme-hover"
                >
                  <ExternalLink size={16} /> Open in Google Calendar
                </a>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-theme-border flex items-center justify-between">
              <button 
                onClick={() => { removeEvent(selectedEvent.id); setSelectedEventId(null); }}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <Trash2 size={14} /> Delete Event
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

const EventItem: React.FC<{ 
  event: CalendarEvent;
  calendarColor: string;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ event, calendarColor, onSelect, isSelected }) => {
  const startTime = event.start.dateTime ? format(parseISO(event.start.dateTime), 'h:mm a') : 'All Day';
  const endTime = event.end.dateTime ? format(parseISO(event.end.dateTime), 'h:mm a') : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
        isSelected 
          ? 'bg-theme-bg-accent/10 border-theme-bg-accent/40 shadow-lg' 
          : 'bg-theme-glass border-theme-border hover:border-theme-bg-accent/20 hover:bg-theme-hover'
      }`}
    >
      <div 
        className="w-1.5 h-10 rounded-full flex-shrink-0" 
        style={{ backgroundColor: calendarColor }} 
      />
      
      <div className="flex-1 min-w-0">
        <h4 className={`text-lg font-bold transition-all ${isSelected ? 'text-theme-bg-accent' : 'text-theme-text'}`}>
          {event.summary}
        </h4>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-theme-muted uppercase tracking-widest font-extrabold">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {startTime} {endTime && ` - ${endTime}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <MapPin size={10} /> {event.location}
            </span>
          )}
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={18} className="text-theme-muted" />
      </div>
    </motion.div>
  );
};
