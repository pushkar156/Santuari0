import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  LogOut, 
  AlertCircle, 
  Loader2,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';

export const CalendarView: React.FC = () => {
  const { 
    calendars, 
    eventsByCalendar, 
    activeCalendarId, 
    isLoading, 
    error, 
    isAuthenticated,
    fetchCalendars,
    setActiveCalendar,
    sync,
    logout
  } = useCalendarStore();

  useEffect(() => {
    if (isAuthenticated && calendars.length === 0) {
      fetchCalendars();
    }
  }, [isAuthenticated]);

  const activeEvents = useMemo(() => {
    return eventsByCalendar[activeCalendarId] || [];
  }, [eventsByCalendar, activeCalendarId]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof activeEvents> = {};
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

  return (
    <div className="h-screen w-full flex overflow-hidden p-6 gap-6">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col gap-6">
        <div className="theme-glass p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-xl font-bold text-theme-text">My Calendars</h2>
            <button 
              onClick={() => sync()} 
              className={`text-theme-muted hover:text-theme-text transition-colors ${isLoading ? 'animate-spin' : ''}`}
              title="Sync now"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            {calendars.map((cal) => (
              <button
                key={cal.id}
                onClick={() => setActiveCalendar(cal.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeCalendarId === cal.id 
                    ? 'bg-theme-bg-accent text-theme-contrast shadow-lg scale-[1.02]' 
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
          
          <div className="h-px bg-theme-border my-2 mx-4" />
          
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="theme-glass p-6 flex-1 flex flex-col justify-end">
          <div className="space-y-4">
            <p className="text-xs text-theme-muted uppercase tracking-wider font-bold">Upcoming</p>
            <h4 className="text-2xl font-bold text-theme-text">
              {activeEvents.length} Events
            </h4>
            <p className="text-sm text-theme-muted">Showing events from your {calendars.find(c => c.id === activeCalendarId)?.summary || 'primary'} calendar.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        <header className="theme-glass p-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-theme-bg-accent/20 text-theme-bg-accent text-[10px] font-bold rounded-md uppercase tracking-wider">Sync Active</span>
              <h1 className="text-3xl font-bold text-theme-text">
                {calendars.find(c => c.id === activeCalendarId)?.summary || 'Schedule'}
              </h1>
            </div>
            <p className="text-theme-muted">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            {error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-400/10 text-red-400 rounded-xl text-sm border border-red-400/20">
                <AlertCircle size={16} />
                <span>API Error</span>
              </div>
            )}
            {isLoading && <Loader2 className="animate-spin text-theme-bg-accent" size={24} />}
          </div>
        </header>

        <section className="flex-1 theme-glass overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {groupedEvents.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-40 select-none">
                <CalendarIcon size={64} className="mb-4" />
                <p className="text-xl font-medium">No upcoming events found</p>
              </div>
            ) : (
              groupedEvents.map(([date, events]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-theme-text whitespace-nowrap">
                      {getDateLabel(date)}
                    </h3>
                    <div className="h-px w-full bg-theme-border" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {events.map((event) => {
                      const startTime = event.start.dateTime ? format(parseISO(event.start.dateTime), 'h:mm a') : 'All Day';
                      const endTime = event.end.dateTime ? format(parseISO(event.end.dateTime), 'h:mm a') : '';
                      
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group flex flex-col gap-2 p-5 rounded-2xl bg-theme-glass hover:bg-theme-hover border border-theme-border hover:border-theme-bg-accent/30 transition-all shadow-sm relative overflow-hidden"
                        >
                          {/* Color bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1.5" 
                            style={{ backgroundColor: calendars.find(c => c.id === activeCalendarId)?.backgroundColor || 'var(--theme-bg-accent)' }}
                          />
                          
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h4 className="text-xl font-bold text-theme-text group-hover:text-theme-bg-accent transition-colors">
                                {event.summary}
                              </h4>
                              <div className="flex flex-wrap gap-4 text-theme-muted text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={14} />
                                  <span>{startTime} {endTime && ` - ${endTime}`}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    <span className="truncate max-w-[200px]">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <a 
                              href={event.htmlLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-theme-muted hover:text-theme-bg-accent hover:bg-theme-bg-accent/10 rounded-xl transition-all"
                            >
                              <ExternalLink size={18} />
                            </a>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-theme-muted line-clamp-1 mt-1">
                              {event.description}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
