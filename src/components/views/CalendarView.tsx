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
  Hash,
  CheckCircle2,
  Layers,
  X
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
  subMonths,
  setHours as setDateHours,
  setMinutes as setDateMinutes
} from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';
import { useTasksStore } from '../../store/tasksStore';

export const CalendarView: React.FC = () => {
  const { 
    calendars, 
    eventsByCalendar, 
    visibleCalendarIds, 
    isLoading, 
    isAuthenticated,
    fetchCalendars,
    toggleCalendarVisibility,
    sync,
    logout,
    updateEvent,
    removeEvent,
    addEvent
  } = useCalendarStore();

  const { tasksByList } = useTasksStore();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  
  // Quick Add State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState<{ day: Date; hour: number; title: string }>({ day: new Date(), hour: 0, title: '' });

  useEffect(() => {
    if (isAuthenticated && calendars.length === 0) {
      fetchCalendars();
    }
  }, [isAuthenticated, calendars.length, fetchCalendars]);

  // Combine all visible events
  const visibleEvents = useMemo(() => {
    const combined: any[] = [];
    visibleCalendarIds.forEach(id => {
      const cal = calendars.find(c => c.id === id);
      const events = eventsByCalendar[id] || [];
      events.forEach(e => {
        combined.push({ ...e, calendarColor: cal?.backgroundColor });
      });
    });
    return combined;
  }, [eventsByCalendar, visibleCalendarIds, calendars]);

  // Map Tasks to Calendar format
  const taskEvents = useMemo(() => {
    // Flatten all tasks from all lists
    const allTasksFlat = Object.values(tasksByList).flat();
    return allTasksFlat
      .filter(t => t.due && t.status !== 'completed')
      .map(t => ({
        id: `task-${t.id}`,
        summary: t.title,
        description: t.notes,
        start: { dateTime: t.due },
        end: { dateTime: new Date(new Date(t.due!).getTime() + 1800000).toISOString() }, // 30 min duration
        isTask: true,
        calendarColor: 'var(--theme-bg-accent)',
        htmlLink: '#'
      }));
  }, [tasksByList]);

  const allVisibleItems = useMemo(() => [...visibleEvents, ...taskEvents], [visibleEvents, taskEvents]);

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

  const handleGridClick = (day: Date, hour: number) => {
    setQuickAddData({ day, hour, title: '' });
    setShowQuickAdd(true);
  };

  const submitQuickAdd = () => {
    if (!quickAddData.title.trim()) return;
    
    const startTime = setDateMinutes(setDateHours(quickAddData.day, quickAddData.hour), 0);
    addEvent({
      summary: quickAddData.title,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: new Date(startTime.getTime() + 3600000).toISOString() }
    });
    setShowQuickAdd(false);
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

  const selectedEvent = selectedEventId ? allVisibleItems.find(e => e.id === selectedEventId) : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden relative z-10 select-none">
      {/* Premium Top Header */}
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-theme-border/20 backdrop-blur-3xl bg-theme-glass/80 shadow-2xl relative z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-text transition-all group"
          >
            <Menu size={22} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <div className="flex items-center gap-3 mr-6">
            <div className="w-12 h-12 bg-theme-bg-accent rounded-[18px] flex items-center justify-center shadow-lg shadow-theme-bg-accent/20">
              <CalendarIcon size={26} className="text-theme-contrast" />
            </div>
            <span className="text-2xl font-black text-theme-text tracking-tighter">Santuario</span>
          </div>
          
          <button 
            onClick={handleToday}
            className="px-6 py-2.5 bg-theme-bg-accent/5 border border-theme-border/20 rounded-xl text-sm font-black text-theme-text hover:bg-theme-bg-accent hover:text-theme-contrast transition-all shadow-sm"
          >
            TODAY
          </button>
          
          <div className="flex items-center gap-1 ml-2">
            <button onClick={handlePrev} className="p-2.5 hover:bg-theme-bg-accent/10 rounded-xl text-theme-text transition-all active:scale-90">
              <ChevronLeft size={22} />
            </button>
            <button onClick={handleNext} className="p-2.5 hover:bg-theme-bg-accent/10 rounded-xl text-theme-text transition-all active:scale-90">
              <ChevronRight size={22} />
            </button>
          </div>
          
          <h2 className="text-2xl font-black text-theme-text ml-6 tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-bg-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search events..."
              className="bg-theme-bg-accent/5 border border-theme-border/30 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/20 w-64 transition-all"
            />
          </div>

          <div className="h-8 w-px bg-theme-border/20 mx-2" />
          
          <div className="relative">
            <button 
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center gap-3 px-5 py-2.5 bg-theme-bg-accent/5 hover:bg-theme-bg-accent/10 rounded-xl text-xs font-black text-theme-text border border-theme-border/30 transition-all uppercase tracking-[0.2em]"
            >
              {viewType}
              <ChevronDown size={14} className={`transition-transform duration-300 ${isViewDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isViewDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsViewDropdownOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-48 theme-glass p-2 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden rounded-2xl border border-theme-border/50 backdrop-blur-3xl"
                  >
                    {(['day', 'week', 'month', 'agenda'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setViewType(type);
                          setIsViewDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                          viewType === type 
                            ? 'bg-theme-bg-accent text-theme-contrast' 
                            : 'text-theme-text hover:bg-theme-bg-accent/5'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="p-3 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-muted transition-all">
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
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 flex flex-col gap-8 p-6 overflow-hidden border-r border-theme-border/20 bg-theme-glass/40 backdrop-blur-3xl shadow-2xl relative z-20"
            >
              <div>
                <button 
                  onClick={() => {
                    const title = prompt('Event Title:');
                    if (title) addEvent({ summary: title, start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date(Date.now() + 3600000).toISOString() } });
                  }}
                  className="flex items-center gap-4 px-8 py-5 bg-theme-bg-accent hover:scale-[1.02] active:scale-95 transition-all group rounded-[22px] shadow-2xl shadow-theme-bg-accent/30 w-full"
                >
                  <Plus size={24} className="text-theme-contrast group-hover:rotate-90 transition-transform duration-500" />
                  <span className="font-black text-xs text-theme-contrast uppercase tracking-[0.2em]">Create Event</span>
                </button>
              </div>

              <div className="rounded-[32px] bg-theme-bg-accent/5 p-6 border border-theme-border/30 shadow-inner">
                <MiniCalendar currentDate={currentDate} onDateSelect={setCurrentDate} />
              </div>

              <div className="flex-1 flex flex-col gap-6 min-h-0">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] flex items-center gap-2">
                    <Layers size={14} /> My Calendars
                  </h2>
                  <button 
                    onClick={() => sync()} 
                    className={`p-2 hover:bg-theme-bg-accent/10 rounded-xl transition-all ${isLoading ? 'animate-spin' : ''}`}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                
                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                  {calendars.map((cal) => (
                    <button
                      key={cal.id}
                      onClick={() => toggleCalendarVisibility(cal.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[18px] transition-all duration-300 group ${
                        visibleCalendarIds.includes(cal.id) 
                          ? 'bg-theme-bg-accent/10 ring-1 ring-theme-bg-accent/20 shadow-lg' 
                          : 'opacity-50 hover:opacity-100 hover:bg-theme-bg-accent/5'
                      }`}
                    >
                      <div 
                        className={`w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                          visibleCalendarIds.includes(cal.id) ? 'border-transparent' : 'border-theme-border'
                        }`} 
                        style={{ backgroundColor: visibleCalendarIds.includes(cal.id) ? (cal.backgroundColor || 'var(--theme-bg-accent)') : 'transparent' }} 
                      >
                        {visibleCalendarIds.includes(cal.id) && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest truncate flex-1 text-left">{cal.summary}</span>
                    </button>
                  ))}
                </div>
                
                <div className="pt-6 border-t border-theme-border/20">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    <LogOut size={16} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Grid View */}
        <main className="flex-1 overflow-hidden relative bg-theme-bg/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewType + currentDate.toISOString() + visibleCalendarIds.join(',')}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="h-full w-full"
            >
              {viewType === 'week' ? (
                <WeekGrid days={weekDays} items={allVisibleItems} onSelectEvent={setSelectedEventId} onGridClick={handleGridClick} />
              ) : viewType === 'day' ? (
                <WeekGrid days={[currentDate]} items={allVisibleItems} onSelectEvent={setSelectedEventId} onGridClick={handleGridClick} />
              ) : viewType === 'month' ? (
                <MonthGrid days={monthDays} items={allVisibleItems} onSelectEvent={setSelectedEventId} />
              ) : (
                <AgendaView items={allVisibleItems} onSelectEvent={setSelectedEventId} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Details Pane */}
        <AnimatePresence>
          {selectedEventId && selectedEvent && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-[420px] theme-glass p-8 flex flex-col gap-8 shadow-2xl relative z-40 border-l border-theme-border/20 backdrop-blur-3xl"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-theme-bg-accent/10 rounded-2xl flex items-center justify-center text-theme-bg-accent">
                    <StickyNote size={20} />
                  </div>
                  <h2 className="text-xs font-black text-theme-muted uppercase tracking-[0.2em]">Details</h2>
                </div>
                <button onClick={() => setSelectedEventId(null)} className="p-2.5 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-muted transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8 overflow-y-auto custom-scrollbar pr-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-[0.2em]">
                     <Hash size={14} /> Title
                  </label>
                  <textarea
                    className="w-full bg-theme-bg-accent/5 rounded-2xl p-6 text-theme-text text-xl font-black resize-none outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all"
                    value={selectedEvent.summary}
                    rows={2}
                    readOnly={selectedEvent.isTask}
                    onChange={(e) => updateEvent(selectedEvent.id, { summary: e.target.value })}
                  />
                </div>

                {!selectedEvent.isTask && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-[0.2em]">
                      <StickyNote size={14} /> Notes
                    </label>
                    <textarea
                      className="w-full bg-theme-bg-accent/5 rounded-2xl p-6 text-theme-text text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all min-h-[160px]"
                      placeholder="Add event description..."
                      value={selectedEvent.description || ''}
                      onChange={(e) => updateEvent(selectedEvent.id, { description: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-[0.2em]">
                      <Clock size={14} /> Start
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full bg-theme-bg-accent/5 rounded-[18px] p-4 text-theme-text text-xs font-bold outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all"
                      value={selectedEvent.start.dateTime ? selectedEvent.start.dateTime.slice(0, 16) : ''}
                      readOnly={selectedEvent.isTask}
                      onChange={(e) => updateEvent(selectedEvent.id, { start: { dateTime: new Date(e.target.value).toISOString() } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-[0.2em]">
                      <Clock size={14} /> End
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full bg-theme-bg-accent/5 rounded-[18px] p-4 text-theme-text text-xs font-bold outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all"
                      value={selectedEvent.end.dateTime ? selectedEvent.end.dateTime.slice(0, 16) : ''}
                      readOnly={selectedEvent.isTask}
                      onChange={(e) => updateEvent(selectedEvent.id, { end: { dateTime: new Date(e.target.value).toISOString() } })}
                    />
                  </div>
                </div>

                {!selectedEvent.isTask && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted ml-1 flex items-center gap-2 uppercase tracking-[0.2em]">
                      <MapPin size={14} /> Location
                    </label>
                    <input
                      className="w-full bg-theme-bg-accent/5 rounded-[18px] p-5 text-theme-text text-sm font-bold outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all"
                      placeholder="Add location..."
                      value={selectedEvent.location || ''}
                      onChange={(e) => updateEvent(selectedEvent.id, { location: e.target.value })}
                    />
                  </div>
                )}

                <div className="pt-6">
                  <a 
                    href={selectedEvent.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 rounded-[22px] border-2 border-dashed border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-text transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] bg-theme-bg-accent/5 hover:bg-theme-bg-accent/10"
                  >
                    <ExternalLink size={18} /> Sync with Google
                  </a>
                </div>
              </div>

              {!selectedEvent.isTask && (
                <div className="mt-auto pt-10 border-t border-theme-border/20 flex items-center justify-between">
                  <button 
                    onClick={() => { if (confirm('Delete this event?')) { removeEvent(selectedEvent.id); setSelectedEventId(null); } }}
                    className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-all text-[10px] font-black uppercase tracking-[0.3em] group"
                  >
                    <Trash2 size={16} className="group-hover:rotate-12 transition-transform" /> Delete Permanent
                  </button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickAdd(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md theme-glass p-8 rounded-[32px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-theme-bg-accent rounded-2xl flex items-center justify-center text-theme-contrast">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-theme-muted uppercase tracking-[0.2em]">Quick Add Event</h2>
                  <p className="text-theme-text font-black text-xs">
                    {format(quickAddData.day, 'EEEE, MMM do')} @ {format(setDateHours(new Date(), quickAddData.hour), 'h a')}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <input 
                  autoFocus
                  placeholder="What's happening?"
                  className="w-full bg-theme-bg-accent/5 border border-theme-border/30 rounded-2xl py-5 px-6 text-lg font-black text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all"
                  value={quickAddData.title}
                  onChange={(e) => setQuickAddData({ ...quickAddData, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && submitQuickAdd()}
                />

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowQuickAdd(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-theme-muted hover:bg-theme-bg-accent/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitQuickAdd}
                    className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-theme-bg-accent text-theme-contrast shadow-xl shadow-theme-bg-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black text-theme-text uppercase tracking-[0.2em]">{format(viewDate, 'MMMM yyyy')}</span>
        <div className="flex gap-1">
          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 hover:bg-theme-bg-accent/10 rounded-lg text-theme-muted transition-all"><ChevronLeft size={16} /></button>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 hover:bg-theme-bg-accent/10 rounded-lg text-theme-muted transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[9px] font-black text-theme-muted/40 text-center h-6 flex items-center justify-center uppercase tracking-widest">{d}</div>
        ))}
        {days.map((day, i) => {
          const isSelected = isSameDay(day, currentDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={i}
              onClick={() => { onDateSelect(day); setViewDate(day); }}
              className={`text-[10px] h-8 w-8 rounded-[10px] flex items-center justify-center transition-all font-black ${
                isSelected 
                  ? 'bg-theme-bg-accent text-theme-contrast shadow-xl scale-110 rotate-3' 
                  : isCurrentDay
                    ? 'text-theme-bg-accent ring-2 ring-theme-bg-accent/30'
                    : isCurrentMonth 
                      ? 'text-theme-text/80 hover:bg-theme-bg-accent/10 hover:scale-105' 
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

const WeekGrid = ({ days, items, onSelectEvent, onGridClick }: { days: Date[], items: any[], onSelectEvent: (id: string) => void, onGridClick: (day: Date, h: number) => void }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourHeight = 100;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="flex border-b border-theme-border/20 z-20 bg-theme-glass backdrop-blur-3xl shadow-sm">
        <div className="w-20 border-r border-theme-border/10" />
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
          {days.map((day, i) => (
            <div key={i} className={`py-6 flex flex-col items-center gap-2 border-r border-theme-border/10 last:border-r-0 ${isToday(day) ? 'bg-theme-bg-accent/5' : ''}`}>
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isToday(day) ? 'text-theme-bg-accent' : 'text-theme-muted/40'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`text-2xl font-black flex items-center justify-center w-12 h-12 rounded-[18px] transition-all ${isToday(day) ? 'bg-theme-bg-accent text-theme-contrast shadow-2xl shadow-theme-bg-accent/40' : 'text-theme-text'}`}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-theme-bg/5">
        {/* All-Day Events Section */}
        <div className="flex border-b border-theme-border/10 bg-theme-glass/20">
          <div className="w-20 flex-shrink-0 flex items-center justify-center border-r border-theme-border/10">
            <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em]">All Day</span>
          </div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map((day, i) => {
              const dayAllDay = items.filter(e => {
                const start = e.start.date ? parseISO(e.start.date) : (e.start.dateTime ? parseISO(e.start.dateTime) : null);
                return start && isSameDay(start, day) && !e.start.dateTime;
              });

              return (
                <div key={i} className="min-h-[40px] p-1 flex flex-col gap-1 border-r border-theme-border/10 last:border-r-0">
                  {dayAllDay.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => onSelectEvent(item.id)}
                      className="text-[9px] px-2.5 py-1.5 rounded-lg border-l-2 truncate font-black tracking-tight cursor-pointer hover:scale-[1.02] transition-all bg-theme-bg-accent/10 border-theme-bg-accent text-theme-text"
                      style={{ borderLeftColor: item.calendarColor }}
                    >
                      {item.summary}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-full">
          <div className="w-20 flex-shrink-0 border-r border-theme-border/10">
            {hours.map(h => (
              <div key={h} className="h-[100px] flex justify-center relative">
                <span className="text-[10px] font-black text-theme-muted/40 absolute -top-2 uppercase tracking-widest">
                  {h === 0 ? '' : format(setDateHours(new Date(), h), 'h a')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            <div className="absolute inset-0 pointer-events-none">
              {hours.map(h => (
                <div key={h} className="h-[100px] border-b border-theme-border/5" />
              ))}
            </div>

            <TimeIndicator days={days} hourHeight={hourHeight} />

            {days.map((day, i) => (
              <div 
                key={i} 
                className={`relative border-r border-theme-border/10 last:border-r-0 group/day ${isToday(day) ? 'bg-theme-bg-accent/5' : ''}`}
              >
                {/* Clickable Slots */}
                {hours.map(h => (
                  <div 
                    key={h} 
                    onClick={() => onGridClick(day, h)}
                    className="h-[100px] hover:bg-theme-bg-accent/5 transition-colors cursor-crosshair group-hover/day:opacity-100 opacity-0"
                  />
                ))}

                <div className="absolute inset-0 pointer-events-none">
                  <AnimatePresence>
                    {items
                      .filter(e => {
                        const start = e.start.dateTime ? parseISO(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
                        // Only show non-all-day events in the timed grid
                        return start && isSameDay(start, day) && e.start.dateTime;
                      })
                      .map(item => (
                        <EventChip 
                          key={item.id} 
                          item={item} 
                          hourHeight={hourHeight} 
                          onClick={() => onSelectEvent(item.id)}
                        />
                      ))
                    }
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthGrid = ({ days, items, onSelectEvent }: { days: Date[], items: any[], onSelectEvent: (id: string) => void }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-7 border-b border-theme-border/20 bg-theme-glass backdrop-blur-2xl">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
          <div key={d} className="py-4 text-center text-[9px] font-black text-theme-muted/40 uppercase tracking-[0.4em]">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const dayItems = items.filter(e => {
            const start = e.start.dateTime ? parseISO(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
            return start && isSameDay(start, day);
          });

          return (
            <div 
              key={i} 
              className={`border-r border-b border-theme-border/10 p-2 flex flex-col gap-1 min-h-0 overflow-hidden group hover:bg-theme-bg-accent/5 transition-all duration-300 ${
                !isSameMonth(day, days[15]) ? 'opacity-20' : ''
              } ${isToday(day) ? 'bg-theme-bg-accent/5' : ''}`}
            >
              <div className="flex justify-center mb-1">
                <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-[12px] transition-all group-hover:scale-110 ${
                  isToday(day) ? 'bg-theme-bg-accent text-theme-contrast shadow-xl' : 'text-theme-text/60'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                {dayItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => onSelectEvent(item.id)}
                    className={`text-[9px] px-2.5 py-1.5 rounded-lg border-l-2 truncate font-black tracking-tight cursor-pointer hover:scale-[1.02] active:scale-98 transition-all ${item.isTask ? 'bg-theme-bg-accent/10 border-theme-bg-accent text-theme-text' : 'bg-white/5 border-theme-border text-theme-text/80'}`}
                    style={{ borderLeftColor: item.calendarColor }}
                  >
                    {item.isTask && <CheckCircle2 size={8} className="inline mr-1 text-theme-bg-accent" />}
                    {item.summary}
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
      <div className="w-4 h-4 rounded-full bg-red-500 -ml-2 shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-white" />
      <div className="flex-1 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
    </div>
  );
};

const EventChip = ({ item, hourHeight, onClick }: { item: any, hourHeight: number, onClick: () => void }) => {
  const start = item.start.dateTime ? parseISO(item.start.dateTime) : (item.start.date ? parseISO(item.start.date) : null);
  const end = item.end.dateTime ? parseISO(item.end.dateTime) : (item.end.date ? parseISO(item.end.date) : null);

  if (!start || !end) return null;

  const isAllDay = !item.start.dateTime;
  const startHour = getHours(start) + getMinutes(start) / 60;
  const endHour = getHours(end) + getMinutes(end) / 60;
  const duration = Math.max(0.5, endHour - startHour);

  if (isAllDay) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      whileHover={{ x: 4, scale: 1.02 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`absolute left-1 right-2 rounded-2xl border-l-4 p-3 overflow-hidden cursor-pointer transition-all z-10 theme-glass border border-white/10 group shadow-2xl backdrop-blur-2xl ${item.isTask ? 'ring-1 ring-theme-bg-accent/30' : ''}`}
      style={{
        top: startHour * hourHeight + 4,
        height: duration * hourHeight - 8,
        borderLeftColor: item.calendarColor || 'var(--theme-bg-accent)',
        backgroundColor: item.isTask ? 'var(--theme-bg-accent-10)' : `${item.calendarColor}22`
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-xs font-black text-theme-text leading-tight line-clamp-2 uppercase tracking-tight">
            {item.isTask && <CheckCircle2 size={10} className="inline mr-1 text-theme-bg-accent mb-0.5" />}
            {item.summary}
          </h5>
        </div>
        {duration > 0.4 && (
          <div className="flex items-center gap-2 text-[9px] font-black text-theme-muted mt-auto uppercase tracking-widest">
            <Clock size={10} />
            <span>{format(start, 'h:mm a')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AgendaView = ({ items, onSelectEvent }: { items: any[], onSelectEvent: (id: string) => void }) => {
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    items.forEach(item => {
      const dateStr = item.start.dateTime || item.start.date;
      if (!dateStr) return;
      const date = format(parseISO(dateStr), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <div className="h-full overflow-y-auto p-12 space-y-12 custom-scrollbar max-w-5xl mx-auto">
      {groupedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full opacity-20 py-32">
          <CalendarIcon size={120} className="mb-8" />
          <p className="text-4xl font-black uppercase tracking-[0.2em]">Void</p>
        </div>
      ) : (
        groupedItems.map(([date, dayItems]) => (
          <div key={date} className="space-y-6">
            <div className="flex items-center gap-8">
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black text-theme-text tabular-nums">{format(parseISO(date), 'd')}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-theme-bg-accent uppercase tracking-[0.4em]">{format(parseISO(date), 'EEEE')}</span>
                  <span className="text-xs font-bold text-theme-muted uppercase tracking-[0.2em]">{format(parseISO(date), 'MMMM yyyy')}</span>
                </div>
              </div>
              <div className="h-px flex-1 bg-theme-border/20" />
            </div>
            <div className="grid gap-4">
              {dayItems.map((item) => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ x: 10 }}
                  onClick={() => onSelectEvent(item.id)}
                  className={`theme-glass p-6 rounded-[32px] border-l-4 group hover:bg-theme-bg-accent/5 transition-all cursor-pointer flex justify-between items-center shadow-lg border-theme-border/20 ${item.isTask ? 'ring-1 ring-theme-bg-accent/20' : ''}`} 
                  style={{ borderLeftColor: item.calendarColor }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {item.isTask && <CheckCircle2 size={16} className="text-theme-bg-accent" />}
                      <h4 className="text-lg font-black text-theme-text tracking-tight uppercase">{item.summary}</h4>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{item.start.dateTime ? format(parseISO(item.start.dateTime), 'h:mm a') : 'All Day'}</span>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-2 truncate max-w-[300px]">
                          <MapPin size={14} />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <a href={item.htmlLink} target="_blank" rel="noreferrer" className="p-3 bg-theme-bg-accent/5 hover:bg-theme-bg-accent text-theme-muted hover:text-theme-contrast rounded-2xl transition-all shadow-sm">
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
