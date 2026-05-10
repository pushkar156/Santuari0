import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  LogOut, 
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Menu,
  Search,
  Settings as SettingsIcon,
  ChevronDown,
  Trash2,
  StickyNote,
  Hash
} from 'lucide-react';
import { 
  format, 
  isToday, 
  parseISO, 
  startOfWeek, 
  addDays, 
  eachDayOfInterval, 
  isSameDay, 
  startOfMonth, 
  startOfToday,
  getHours,
  getMinutes,
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';

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
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (isAuthenticated && calendars.length === 0) {
      fetchCalendars();
    }
  }, [isAuthenticated, calendars.length, fetchCalendars]);

  useEffect(() => {
    if (isAuthenticated && activeCalendarId && !eventsByCalendar[activeCalendarId]) {
      useCalendarStore.getState().fetchEvents(activeCalendarId);
    }
  }, [isAuthenticated, activeCalendarId, eventsByCalendar]);

  const activeEvents = useMemo(() => {
    return eventsByCalendar[activeCalendarId] || [];
  }, [eventsByCalendar, activeCalendarId]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({
      start,
      end: addDays(start, 6)
    });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = addDays(start, 41); // 6 weeks always
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handlePrev = () => {
    setCurrentDate(prev => {
      if (viewType === 'month') return subMonths(prev, 1);
      if (viewType === 'week') return addDays(prev, -7);
      return addDays(prev, -1);
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      if (viewType === 'month') return addMonths(prev, 1);
      if (viewType === 'week') return addDays(prev, 7);
      return addDays(prev, 1);
    });
  };

  const handleToday = () => {
    setCurrentDate(startOfToday());
  };



  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-sm">
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
            <p className="text-theme-muted">Sync your Google Calendar to stay on top of your schedule with a premium grid view.</p>
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

  return (
    <div className="h-screen flex flex-col overflow-hidden relative z-10 select-none">
      {/* Google Style Top Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-theme-border/20 backdrop-blur-xl bg-theme-glass shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-theme-hover rounded-full text-theme-text transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 mr-6">
            <div className="w-10 h-10 bg-theme-bg-accent rounded-xl flex items-center justify-center shadow-lg">
              <CalendarIcon size={24} className="text-theme-contrast" />
            </div>
            <span className="text-xl font-medium text-theme-text tracking-tight">Calendar</span>
          </div>
          
          <button 
            onClick={handleToday}
            className="px-4 py-2 border border-theme-border/30 rounded-lg text-sm font-bold text-theme-text hover:bg-theme-hover transition-all"
          >
            Today
          </button>
          
          <div className="flex items-center ml-2">
            <button onClick={handlePrev} className="p-2 hover:bg-theme-hover rounded-full text-theme-text transition-all">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNext} className="p-2 hover:bg-theme-hover rounded-full text-theme-text transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <h2 className="text-xl font-medium text-theme-text ml-4">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-theme-hover rounded-full text-theme-muted transition-colors">
            <Search size={20} />
          </button>
          <div className="h-8 w-px bg-theme-border/20 mx-2" />
          
          {/* View Selector Dropdown Style */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-theme-hover rounded-lg text-sm font-bold text-theme-text border border-theme-border/30 transition-all uppercase tracking-wider">
              {viewType}
              <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 theme-glass p-1 hidden group-hover:block z-50 shadow-2xl overflow-hidden rounded-xl">
              {(['day', 'week', 'month', 'agenda'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    viewType === type 
                      ? 'bg-theme-bg-accent text-theme-contrast' 
                      : 'text-theme-text hover:bg-theme-hover'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button className="p-2 hover:bg-theme-hover rounded-full text-theme-muted transition-colors ml-2">
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 flex flex-col gap-6 p-4 overflow-hidden border-r border-theme-border/20 bg-theme-glass/60 backdrop-blur-xl shadow-2xl relative z-10"
            >
              {/* Create Button - Pill Style */}
              <div>
                <button 
                  onClick={() => {
                    const title = prompt('Event Title:');
                    if (title) addEvent({ summary: title, start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date(Date.now() + 3600000).toISOString() } });
                  }}
                  className="flex items-center gap-4 px-6 py-4 theme-glass hover:bg-theme-hover transition-all group rounded-full shadow-xl border-theme-border/50 bg-white/10"
                >
                  <Plus size={28} className="text-theme-bg-accent group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm text-theme-text uppercase tracking-widest">Create</span>
                </button>
              </div>

              {/* Mini Calendar Container */}
              <div className="rounded-2xl bg-theme-glass p-4 border border-theme-border/20 shadow-inner">
                <MiniCalendar currentDate={currentDate} onDateSelect={setCurrentDate} />
              </div>

              {/* Calendars List */}
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">My Calendars</h2>
                  <button 
                    onClick={() => sync()} 
                    className={`p-1.5 hover:bg-theme-hover rounded-lg transition-colors ${isLoading ? 'animate-spin' : ''}`}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  {calendars.map((cal) => (
                    <button
                      key={cal.id}
                      onClick={() => setActiveCalendar(cal.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                        activeCalendarId === cal.id 
                          ? 'bg-theme-bg-accent/10 text-theme-text' 
                          : 'text-theme-muted hover:bg-theme-hover'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-sm flex-shrink-0 flex items-center justify-center border border-white/10" 
                        style={{ backgroundColor: cal.backgroundColor || 'var(--theme-bg-accent)' }} 
                      >
                        {activeCalendarId === cal.id && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-xs font-semibold truncate">{cal.summary}</span>
                    </button>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-theme-border/20">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <LogOut size={14} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Grid View */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewType + currentDate.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {viewType === 'week' ? (
                <WeekGrid days={weekDays} events={activeEvents} calendarColor={calendars.find(c => c.id === activeCalendarId)?.backgroundColor} onSelectEvent={setSelectedEventId} />
              ) : viewType === 'day' ? (
                <WeekGrid days={[currentDate]} events={activeEvents} calendarColor={calendars.find(c => c.id === activeCalendarId)?.backgroundColor} onSelectEvent={setSelectedEventId} />
              ) : viewType === 'month' ? (
                <MonthGrid days={monthDays} events={activeEvents} calendarColor={calendars.find(c => c.id === activeCalendarId)?.backgroundColor} onSelectEvent={setSelectedEventId} />
              ) : (
                <AgendaView events={activeEvents} calendarColor={calendars.find(c => c.id === activeCalendarId)?.backgroundColor} onSelectEvent={setSelectedEventId} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Details Pane (HEAD) */}
        <AnimatePresence>
          {selectedEventId && selectedEvent && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-96 theme-glass p-8 flex flex-col gap-8 shadow-2xl relative z-10 border-l border-theme-border/20"
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
                  onClick={() => { if (confirm('Delete this event?')) { removeEvent(selectedEvent.id); setSelectedEventId(null); } }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-[10px] font-bold uppercase tracking-widest"
                >
                  <Trash2 size={14} /> Delete Event
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const MiniCalendar = ({ currentDate, onDateSelect }: { currentDate: Date, onDateSelect: (d: Date) => void }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const monthStart = startOfMonth(viewDate);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = addDays(start, 41); 

  const days = eachDayOfInterval({ start, end });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black text-theme-text uppercase tracking-widest">{format(viewDate, 'MMMM yyyy')}</span>
        <div className="flex gap-0.5">
          <button 
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="p-1 hover:bg-theme-hover rounded-lg text-theme-muted transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="p-1 hover:bg-theme-hover rounded-lg text-theme-muted transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[8px] font-black text-theme-muted/40 text-center h-5 flex items-center justify-center uppercase tracking-widest">{d}</div>
        ))}
        {days.map((day, i) => {
          const isSelected = isSameDay(day, currentDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={i}
              onClick={() => {
                onDateSelect(day);
                setViewDate(day);
              }}
              className={`text-[10px] h-7 w-7 rounded-full flex items-center justify-center transition-all font-bold ${
                isSelected 
                  ? 'bg-theme-bg-accent text-theme-contrast shadow-md scale-110' 
                  : isCurrentDay
                    ? 'text-theme-bg-accent border border-theme-bg-accent'
                    : isCurrentMonth 
                      ? 'text-theme-text hover:bg-theme-hover' 
                      : 'text-theme-muted/20'
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const WeekGrid = ({ days, events, calendarColor, onSelectEvent }: { days: Date[], events: any[], calendarColor?: string, onSelectEvent: (id: string) => void }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourHeight = 80;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="flex border-b border-theme-border/20 z-20">
        <div className="w-16 border-r border-theme-border/10" />
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
          {days.map((day, i) => (
            <div key={i} className={`py-4 flex flex-col items-center gap-1 border-r border-theme-border/10 last:border-r-0 ${isToday(day) ? 'bg-theme-bg-accent/5' : ''}`}>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${isToday(day) ? 'text-theme-bg-accent' : 'text-theme-muted/60'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`text-xl font-medium flex items-center justify-center w-10 h-10 rounded-full transition-all ${isToday(day) ? 'bg-theme-bg-accent text-theme-contrast shadow-lg' : 'text-theme-text'}`}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="flex min-h-full">
          <div className="w-16 flex-shrink-0 border-r border-theme-border/10">
            {hours.map(h => (
              <div key={h} className="h-[80px] flex justify-center relative">
                <span className="text-[10px] font-medium text-theme-muted/40 absolute -top-2 uppercase">
                  {h === 0 ? '' : format(new Date().setHours(h, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            <div className="absolute inset-0 pointer-events-none">
              {hours.map(h => (
                <div key={h} className="h-[80px] border-b border-theme-border/10" />
              ))}
            </div>

            <TimeIndicator days={days} hourHeight={hourHeight} />

            {days.map((day, i) => (
              <div key={i} className={`relative border-r border-theme-border/10 last:border-r-0 ${isToday(day) ? 'bg-theme-bg-accent/5' : ''}`}>
                <AnimatePresence>
                  {events
                    .filter(e => {
                      const eventStart = e.start.dateTime ? parseISO(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
                      return eventStart && isSameDay(eventStart, day);
                    })
                    .map(event => (
                      <EventChip 
                        key={event.id} 
                        event={event} 
                        hourHeight={hourHeight} 
                        color={calendarColor} 
                        onClick={() => onSelectEvent(event.id)}
                      />
                    ))
                  }
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthGrid = ({ days, events, calendarColor, onSelectEvent }: { days: Date[], events: any[], calendarColor?: string, onSelectEvent: (id: string) => void }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-7 border-b border-theme-border/20">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
          <div key={d} className="py-2 text-center text-[9px] font-black text-theme-muted/40 uppercase tracking-[0.3em]">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const dayEvents = events.filter(e => {
            const eventStart = e.start.dateTime ? parseISO(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
            return eventStart && isSameDay(eventStart, day);
          });

          return (
            <div 
              key={i} 
              className={`border-r border-b border-theme-border/10 p-1 flex flex-col gap-0.5 min-h-0 overflow-hidden group hover:bg-theme-hover/10 transition-colors ${
                !isSameMonth(day, days[15]) ? 'opacity-30' : ''
              } ${isToday(day) ? 'bg-theme-bg-accent/5' : ''}`}
            >
              <div className="flex justify-center mb-0.5">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                  isToday(day) ? 'bg-theme-bg-accent text-theme-contrast shadow-md' : 'text-theme-text/70'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onSelectEvent(event.id)}
                    className="text-[9px] px-2 py-0.5 rounded-sm bg-theme-bg-accent/10 border-l-2 truncate font-medium text-theme-text cursor-pointer hover:brightness-125 transition-all"
                    style={{ borderLeftColor: calendarColor || 'var(--theme-bg-accent)' }}
                    title={event.summary}
                  >
                    {event.summary}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeIndicator = ({ days, hourHeight }: { days: Date[], hourHeight: number }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const todayIndex = days.findIndex(d => isToday(d));
  if (todayIndex === -1) return null;

  const top = (getHours(now) * hourHeight) + (getMinutes(now) / 60 * hourHeight);

  return (
    <div 
      className="absolute z-30 pointer-events-none flex items-center"
      style={{ 
        top, 
        left: `${(todayIndex / days.length) * 100}%`, 
        width: `${(1 / days.length) * 100}%` 
      }}
    >
      <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
      <div className="flex-1 h-px bg-red-500" />
    </div>
  );
};

const EventChip = ({ event, hourHeight, color, onClick }: { event: any, hourHeight: number, color?: string, onClick: () => void }) => {
  const start = event.start.dateTime ? parseISO(event.start.dateTime) : (event.start.date ? parseISO(event.start.date) : null);
  const end = event.end.dateTime ? parseISO(event.end.dateTime) : (event.end.date ? parseISO(event.end.date) : null);

  if (!start || !end) return null;

  const isAllDay = !event.start.dateTime;
  const startHour = getHours(start) + getMinutes(start) / 60;
  const endHour = getHours(end) + getMinutes(end) / 60;
  const duration = Math.max(0.5, endHour - startHour);

  if (isAllDay) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="absolute left-1 right-1 rounded-md border-l-4 p-2 overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10 theme-glass border border-white/5 group shadow-lg"
      style={{
        top: startHour * hourHeight + 2,
        height: duration * hourHeight - 4,
        borderLeftColor: color || 'var(--theme-bg-accent)',
        backgroundColor: `${color}33` || 'rgba(255,255,255,0.1)'
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <h5 className="text-[11px] font-bold text-theme-text leading-tight truncate">{event.summary}</h5>
        {duration > 0.6 && (
          <div className="flex items-center gap-1 text-[9px] text-theme-muted mt-0.5">
            <Clock size={8} />
            <span>{format(start, 'h:mm a')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AgendaView = ({ events, calendarColor, onSelectEvent }: { events: any[], calendarColor?: string, onSelectEvent: (id: string) => void }) => {
  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof events> = {};
    events.forEach(event => {
      const dateStr = event.start.dateTime || event.start.date;
      if (!dateStr) return;
      const date = format(parseISO(dateStr), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 custom-scrollbar">
      {groupedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full opacity-30">
          <CalendarIcon size={64} className="mb-4" />
          <p className="text-xl font-bold">No upcoming events</p>
        </div>
      ) : (
        groupedEvents.map(([date, dayEvents]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-theme-text">{format(parseISO(date), 'd')}</span>
                <span className="text-xs font-bold text-theme-muted uppercase tracking-widest">{format(parseISO(date), 'EEE')}</span>
              </div>
              <div className="h-px flex-1 bg-theme-border/20" />
            </div>
            <div className="grid gap-3">
              {dayEvents.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => onSelectEvent(event.id)}
                  className="theme-glass p-4 border-l-4 group hover:bg-theme-hover/20 transition-all cursor-pointer" 
                  style={{ borderLeftColor: calendarColor || 'var(--theme-bg-accent)' }}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-theme-text">{event.summary}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-theme-muted mt-1 uppercase tracking-wider font-medium">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{event.start.dateTime ? format(parseISO(event.start.dateTime), 'h:mm a') : 'All Day'}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin size={12} />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <a href={event.htmlLink} target="_blank" rel="noreferrer" className="p-2 hover:bg-theme-hover rounded-lg text-theme-muted transition-all">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
