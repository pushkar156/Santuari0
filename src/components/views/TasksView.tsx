import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Loader2, Menu, StickyNote, Star, ChevronRight, ChevronDown, X, MoreVertical, Edit2, Check, LayoutGrid, Clock, CheckCheck, Plus, Trash2, ListTodo, Search, Command, Zap, Calendar, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewStore } from '../../store/viewStore';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors
} from '@dnd-kit/core';
import { GoogleTask, GoogleTaskList } from '../../services/googleTasks';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasksStore } from '../../store/tasksStore';

interface TaskNode extends GoogleTask { children: TaskNode[]; }

// ─── helpers ────────────────────────────────────────────────────────────────
function buildTree(flat: GoogleTask[]): TaskNode[] {
  const map: Record<string, TaskNode> = {};
  const roots: TaskNode[] = [];
  flat.forEach(t => { map[t.id] = { ...t, children: [] }; });
  flat.forEach(t => {
    if (t.parent && map[t.parent]) map[t.parent].children.push(map[t.id]);
    else roots.push(map[t.id]);
  });
  return roots;
}

// ─── Celebration Component ──────────────────────────────────────────────────
const ConfettiBurst: React.FC<{ x: number, y: number, onComplete: () => void }> = ({ x, y, onComplete }) => {
  const particles = Array.from({ length: 12 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[999]">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ x, y, scale: 0, opacity: 1 }}
          animate={{
            x: x + (Math.random() - 0.5) * 200,
            y: y + (Math.random() - 0.5) * 200,
            scale: [0, 1, 0.5, 0],
            opacity: [1, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          onAnimationComplete={i === 0 ? onComplete : undefined}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: [
              'var(--theme-bg-accent)',
              '#fbbf24',
              '#f472b6',
              '#34d399',
              '#60a5fa'
            ][i % 5]
          }}
        />
      ))}
    </div>
  );
};

// ─── Command Palette Component ──────────────────────────────────────────────
const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lists: GoogleTaskList[];
  tasks: GoogleTask[];
  onSelectTask: (id: string) => void;
  onSelectList: (id: string) => void;
}> = ({ isOpen, onClose, lists, tasks, onSelectTask, onSelectList }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    const results: { type: 'task' | 'list', id: string, title: string, listTitle?: string }[] = [];
    
    // Search Tasks
    tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 5).forEach(t => {
      results.push({ type: 'task', id: t.id, title: t.title });
    });

    // Search Lists
    lists.filter(l => l.title.toLowerCase().includes(q)).slice(0, 3).forEach(l => {
      results.push({ type: 'list', id: l.id, title: l.title });
    });

    return results;
  }, [query, tasks, lists]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          if (item.type === 'task') onSelectTask(item.id);
          else onSelectList(item.id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onSelectTask, onSelectList, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl bg-theme-glass/95 backdrop-blur-2xl border border-theme-border rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex items-center px-6 py-4 border-b border-theme-border/20">
              <Search size={20} className="text-theme-muted" />
              <input
                autoFocus
                placeholder="Search tasks, lists, or commands..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-4 text-theme-text font-bold text-lg placeholder:text-theme-muted/30"
              />
              <div className="flex items-center gap-1.5 bg-theme-bg-accent/10 px-2 py-1 rounded-lg">
                <Command size={12} className="text-theme-bg-accent" />
                <span className="text-[10px] font-black text-theme-bg-accent">K</span>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-3 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-theme-muted">No results found for "{query}"</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (item.type === 'task') onSelectTask(item.id);
                      else onSelectList(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                      idx === selectedIndex ? 'bg-theme-bg-accent text-theme-contrast' : 'hover:bg-theme-bg-accent/5 text-theme-text'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${idx === selectedIndex ? 'bg-theme-contrast/20' : 'bg-theme-bg-accent/10'}`}>
                        {item.type === 'task' ? <Check size={14} /> : <LayoutGrid size={14} />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold tracking-tight">{item.title}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${idx === selectedIndex ? 'text-theme-contrast/60' : 'text-theme-muted'}`}>
                          {item.type}
                        </p>
                      </div>
                    </div>
                    {idx === selectedIndex && <Zap size={14} className="animate-pulse" />}
                  </button>
                ))
              )}
            </div>

            <div className="px-6 py-4 bg-theme-bg-accent/5 border-t border-theme-border/20 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-theme-bg rounded text-[10px] font-black text-theme-muted border border-theme-border/50">↑↓</kbd>
                  <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-theme-bg rounded text-[10px] font-black text-theme-muted border border-theme-border/50">↵</kbd>
                  <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Select</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-theme-bg-accent uppercase tracking-widest">Santuario Intelligence</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Auth gate ───────────────────────────────────────────────────────────────
const AuthGate: React.FC<{ onSettings: () => void }> = ({ onSettings }) => (
  <div className="relative z-10 flex flex-col items-center justify-center">
    {/* Premium Background Elements */}
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-theme-bg-accent/10 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-theme-bg-accent/10 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
    </div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-md w-full text-center space-y-10 theme-glass relative">
      <div className="space-y-6">
        <div className="w-20 h-20 bg-theme-bg-accent/10 backdrop-blur-3xl rounded-[32px] border border-theme-border flex items-center justify-center mx-auto shadow-2xl relative group">
          <ListTodo size={40} className="text-theme-bg-accent relative z-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-theme-text tracking-tighter">Santuario Tasks</h1>
          <p className="text-theme-muted font-medium text-sm tracking-wide">Secure. Private. Professional.</p>
        </div>
      </div>
      
      <button onClick={onSettings}
        className="w-full bg-theme-bg-accent text-theme-contrast py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 group relative overflow-hidden">
        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" /> 
        Connect Google Tasks
      </button>
      
      <div className="flex items-center justify-center gap-2">
        <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
        <p className="text-[10px] font-black text-theme-muted/40 uppercase tracking-[0.4em]">Synced with Google API</p>
      </div>
    </motion.div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export const TasksView: React.FC = () => {
  const {
    fetchLists, setActiveList, fetchTasks, addTask, toggleTask, updateTaskDetail: updateTask,
    moveTask, removeTask: deleteTask, updateList, deleteList, createList,
    clearCompleted,
    visibleListIds, toggleListVisibility,
    showTodayColumn, setShowTodayColumn,
    showStarredColumn, setShowStarredColumn,
    listOrder, setListOrder, error: storeError,
    isAuthenticated, lists, tasksByList, isLoading,
    focusedTaskId, setFocusedTaskId
  } = useTasksStore();
  const { setActiveView } = useViewStore();


  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [bursts, setBursts] = useState<{ id: number, x: number, y: number }[]>([]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleWithCelebration = (taskId: string, x?: number, y?: number) => {
    const task = allTasks.find(t => t.id === taskId);
    if (task && task.status !== 'completed' && x !== undefined && y !== undefined) {
      setBursts(prev => [...prev, { id: Date.now(), x, y }]);
    }
    toggleTask(taskId);
  };

  // Initial Sync Logic
  useEffect(() => {
    if (isAuthenticated && lists.length === 0) fetchLists();
  }, [isAuthenticated, lists.length, fetchLists]);

  // Auto-fetch tasks for each list
  useEffect(() => {
    if (isAuthenticated && lists.length > 0) {
      lists.forEach(list => {
        if (!tasksByList[list.id]) fetchTasks(list.id);
      });
    }
  }, [lists, isAuthenticated, tasksByList, setActiveList]);

  const allTasks = useMemo(() => Object.values(tasksByList).flat(), [tasksByList]);
  const selectedTask = selectedTaskId ? allTasks.find(t => t.id === selectedTaskId) : null;
  // Find which list the selected task lives in
  const selectedTaskListId = selectedTask
    ? Object.entries(tasksByList).find(([, tasks]) => tasks.some(t => t.id === selectedTask.id))?.[0] ?? null
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );




  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      await createList(newListTitle.trim());
      setNewListTitle('');
      setIsCreatingList(false);
    }
  };

  if (!isAuthenticated) {
    return <AuthGate onSettings={() => setActiveView('settings')} />;
  }

  const starredTasks = allTasks.filter((t: GoogleTask) => t.starred && t.status !== 'completed');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = allTasks.filter((t: GoogleTask) => {
    if (t.status === 'completed') return false;
    if (!t.due) return false;
    return t.due.split('T')[0] <= todayStr;
  });

  const displayLists = lists;
  const displayTasksByList = tasksByList as Record<string, GoogleTask[]>;

  return (
    <div className="h-screen w-full bg-theme-bg/10 flex overflow-hidden relative selection:bg-theme-bg-accent/30 font-sans text-theme-text">
      {/* Celebration Bursts */}
      {bursts.map(burst => (
        <ConfettiBurst
          key={burst.id}
          x={burst.x}
          y={burst.y}
          onComplete={() => setBursts(prev => prev.filter(b => b.id !== burst.id))}
        />
      ))}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        lists={lists}
        tasks={allTasks}
        onSelectTask={(id) => {
          setSelectedTaskId(id);
          const listId = Object.entries(tasksByList).find(([, tasks]) => tasks.some(t => t.id === id))?.[0];
          if (listId) toggleListVisibility(listId);
        }}
        onSelectList={(id) => toggleListVisibility(id)}
      />

      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated Mesh Gradients */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[100%] h-[100%] bg-gradient-to-br from-theme-bg-accent/30 to-theme-bg-accent/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -45, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[90%] h-[90%] bg-gradient-to-tr from-theme-bg-accent/20 to-theme-bg-accent/10 blur-[120px] rounded-full" 
        />
        
        {/* Grain Overlay for Texture */}
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-theme-bg/40 pointer-events-none" />
      </div>

      <aside className={`flex-shrink-0 bg-theme-glass/20 backdrop-blur-3xl border-r border-theme-border transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col overflow-hidden z-20 ${sidebarOpen ? 'w-[320px]' : 'w-0'}`}>
        <div className="p-8 flex flex-col h-full gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-theme-muted uppercase tracking-[0.2em] flex items-center gap-2">
              <LayoutGrid size={14} /> Workspace
            </h2>
            <button onClick={() => setIsCreatingList(true)} className="p-1.5 hover:bg-theme-bg-accent/10 rounded-lg text-theme-bg-accent transition-all">
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
            <div className="space-y-1 mb-6">
              <button
                onClick={() => setShowTodayColumn(!showTodayColumn)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-[18px] transition-all group ${showTodayColumn ? 'bg-theme-bg-accent/10 text-theme-bg-accent' : 'text-theme-text hover:bg-theme-bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${showTodayColumn ? 'bg-theme-bg-accent border-theme-bg-accent' : 'border-theme-border'}`}>
                    {showTodayColumn && <Check size={12} className="text-theme-contrast" />}
                  </div>
                  <Clock size={16} className={showTodayColumn ? 'text-theme-bg-accent' : 'text-theme-muted'} />
                  <span className="text-sm font-bold">My Day</span>
                </div>
                <span className="text-[10px] font-black opacity-40">{todayTasks.length}</span>
              </button>
              <button
                onClick={() => setShowStarredColumn(!showStarredColumn)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-[18px] transition-all group ${showStarredColumn ? 'bg-theme-bg-accent/10 text-theme-bg-accent' : 'text-theme-text hover:bg-theme-bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${showStarredColumn ? 'bg-theme-bg-accent border-theme-bg-accent' : 'border-theme-border'}`}>
                    {showStarredColumn && <Check size={12} className="text-theme-contrast" />}
                  </div>
                  <Star size={16} className={showStarredColumn ? 'text-theme-bg-accent' : 'text-theme-muted'} />
                  <span className="text-sm font-bold">Starred</span>
                </div>
                <span className="text-[10px] font-black opacity-40">{starredTasks.length}</span>
              </button>
            </div>

            <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest px-4 mb-3">Lists</p>
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={(e) => {
                const { active, over } = e;
                if (over && active.id !== over.id) {
                  const oldIndex = listOrder.indexOf(active.id as string);
                  const newIndex = listOrder.indexOf(over.id as string);
                  const newOrder = [...listOrder];
                  newOrder.splice(oldIndex, 1);
                  newOrder.splice(newIndex, 0, active.id as string);
                  setListOrder(newOrder);
                }
              }}
            >
              <SortableContext items={listOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {listOrder.map(listId => {
                    const list = lists.find(l => l.id === listId);
                    if (!list) return null;
                    return (
                      <SidebarListItem 
                        key={list.id}
                        list={list}
                        isVisible={visibleListIds.includes(list.id)}
                        onToggle={() => toggleListVisibility(list.id)}
                        onRename={(t) => updateList(list.id, t)}
                        onDelete={() => deleteList(list.id)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {isCreatingList && (
              <form onSubmit={handleCreateList} className="mt-2 px-2">
                <input
                  autoFocus
                  placeholder="New list title..."
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  onBlur={() => !newListTitle && setIsCreatingList(false)}
                  className="w-full bg-theme-bg-accent/5 border border-theme-bg-accent/30 rounded-xl px-4 py-2.5 text-sm font-bold text-theme-text outline-none focus:ring-1 focus:ring-theme-bg-accent/50"
                />
              </form>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative">
        <header className="flex-shrink-0 h-24 flex items-center justify-between px-10 border-b border-theme-border/20 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-theme-bg-accent/5 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-bg-accent transition-all">
              <Menu size={20} />
            </button>
            <h1 className="text-2xl font-black text-theme-text tracking-tight flex items-center gap-3">
              Santuario Tasks
              {isLoading && <Loader2 size={18} className="animate-spin text-theme-bg-accent" />}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {storeError && (
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-red-500 text-xs font-bold animate-pulse">
                {storeError}
              </div>
            )}
            <button 
              onClick={() => {
                fetchLists();
                lists.forEach(l => fetchTasks(l.id));
              }}
              disabled={isLoading}
              className="p-3 bg-theme-bg-accent/5 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Refresh Tasks"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-row gap-8 p-10 overflow-x-auto overflow-y-hidden custom-scrollbar bg-theme-glass/10 rounded-t-[48px] border-t border-x border-theme-border/50 backdrop-blur-2xl shadow-[0_-20px_80px_rgba(0,0,0,0.3)] mx-6">
          <AnimatePresence mode="popLayout">
            {showTodayColumn && (
              <motion.div layout key="column-today" className="flex-shrink-0 h-full">
                <TaskColumn
                  listId="__today"
                  title="My Day"
                  tasks={todayTasks}
                  sensors={sensors}
                  selectedTaskId={selectedTaskId}
                  focusedTaskId={focusedTaskId}
                  setFocusedTaskId={setFocusedTaskId}
                  onSelect={setSelectedTaskId}
                  onToggle={handleToggleWithCelebration}
                  onRemove={deleteTask}
                  onUpdate={updateTask}
                  onAddTask={(text, parent, prev) => addTask(text, lists[0]?.id, parent, prev, { due: new Date().toISOString() })}
                  onMoveTask={moveTask}
                  onClearCompleted={() => {}}
                  onRenameList={async () => {}}
                  onDeleteList={() => setShowTodayColumn(false)}
                />
              </motion.div>
            )}
            {showStarredColumn && (
              <motion.div layout key="column-starred" className="flex-shrink-0 h-full">
                <TaskColumn
                  listId="__starred"
                  title="Starred"
                  tasks={starredTasks}
                  sensors={sensors}
                  selectedTaskId={selectedTaskId}
                  focusedTaskId={focusedTaskId}
                  setFocusedTaskId={setFocusedTaskId}
                  onSelect={setSelectedTaskId}
                  onToggle={handleToggleWithCelebration}
                  onRemove={deleteTask}
                  onUpdate={updateTask}
                  onAddTask={(text, parent, prev) => addTask(text, lists[0]?.id, parent, prev, { starred: true })}
                  onMoveTask={moveTask}
                  onClearCompleted={() => {}}
                  onRenameList={async () => {}}
                  onDeleteList={() => setShowStarredColumn(false)}
                />
              </motion.div>
            )}
            {listOrder.filter(id => visibleListIds.includes(id)).map(listId => {
              const list = displayLists.find(l => l.id === listId);
              if (!list) return null;
              return (
                <motion.div layout key={`column-${listId}`} className="flex-shrink-0 h-full">
                  <TaskColumn
                    listId={listId}
                    title={list.title}
                    tasks={displayTasksByList[listId] || []}
                    sensors={sensors}
                    selectedTaskId={selectedTaskId}
                    focusedTaskId={focusedTaskId}
                    setFocusedTaskId={setFocusedTaskId}
                    onSelect={setSelectedTaskId}
                    onToggle={handleToggleWithCelebration}
                    onRemove={deleteTask}
                    onUpdate={updateTask}
                    onAddTask={(text, parent, prev) => addTask(text, listId, parent, prev)}
                    onClearCompleted={() => clearCompleted(listId)}
                    onRenameList={(t) => updateList(listId, t)}
                    onDeleteList={(id) => deleteList(id)}
                    onMoveTask={moveTask}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Details Pane - Strategy: Overlay from right */}
        <AnimatePresence mode="wait">
          {selectedTask && (
            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[420px] bg-theme-glass/90 backdrop-blur-3xl border-l border-theme-border/20 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.1)] z-[100] overflow-y-auto custom-scrollbar"
            >
              <div className="flex flex-col gap-1.5 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-theme-bg-accent/10 flex items-center justify-center">
                      <StickyNote size={18} className="text-theme-bg-accent" />
                    </div>
                    <h2 className="text-xl font-black text-theme-text tracking-tight">Task Details</h2>
                  </div>
                  <button onClick={() => setSelectedTaskId(null)} className="p-2 hover:bg-theme-hover rounded-xl text-theme-muted hover:text-theme-text transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8 px-2">
                  {/* Title Section */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted/50 ml-1">Title</label>
                    <textarea
                      value={selectedTask.title}
                      onChange={e => updateTask(selectedTask.id, { title: e.target.value })}
                      className="w-full bg-transparent border-none px-1 py-1 text-theme-text font-black text-2xl focus:outline-none transition-all resize-none placeholder:text-theme-muted/20"
                      rows={2}
                      placeholder="What needs to be done?"
                    />
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted/50 ml-1">Deadline</label>
                      <div className="relative group/field">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-theme-bg-accent/5 flex items-center justify-center text-theme-muted group-hover/field:text-theme-bg-accent transition-all">
                          <Calendar size={14} />
                        </div>
                        <input
                          type="date"
                          value={selectedTask.due ? selectedTask.due.split('T')[0] : ''}
                          onChange={e => updateTask(selectedTask.id, { due: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                          className="w-full bg-transparent border-none pl-10 pr-2 py-2 text-theme-text text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted/50 ml-1">List</label>
                      <div className="relative group/field">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-theme-bg-accent/5 flex items-center justify-center text-theme-muted group-hover/field:text-theme-bg-accent transition-all">
                          <List size={14} />
                        </div>
                        <select 
                          value={selectedTaskListId || ''}
                          onChange={e => moveTask(selectedTask.id, e.target.value)}
                          className="w-full bg-transparent border-none pl-10 pr-2 py-2 text-theme-text text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                        >
                          {lists.map(l => (
                            <option key={l.id} value={l.id} className="bg-theme-contrast text-theme-text">
                              {l.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted/50 ml-1">Notes</label>
                    <textarea
                      placeholder="Add more context here..."
                      value={selectedTask.notes || ''}
                      onChange={e => updateTask(selectedTask.id, { notes: e.target.value })}
                      className="w-full bg-transparent border-none px-1 py-1 text-theme-text text-sm min-h-[150px] focus:outline-none transition-all resize-none placeholder:text-theme-muted/20 leading-relaxed"
                    />
                  </div>
                </div>

                <div className="mt-auto pt-8 pb-4 flex justify-between items-center border-t border-theme-border/10">
                  <span className="text-[10px] font-medium text-theme-muted/40 uppercase tracking-[0.2em]">
                    Synced with Google Tasks
                  </span>
                  <button
                    onClick={() => { if(confirm('Delete this task?')) { deleteTask(selectedTask.id); setSelectedTaskId(null); } }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const SidebarListItem: React.FC<{
  list: GoogleTaskList;
  isVisible: boolean;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}> = ({ list, isVisible, onToggle, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative' as const,
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle !== list.title) onRename(editTitle.trim());
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center pr-2">
      <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-theme-muted opacity-0 group-hover:opacity-100 transition-all">
        <Menu size={12} className="rotate-90" />
      </div>
      <button
        onClick={onToggle}
        className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-[18px] transition-all ${isVisible ? 'bg-theme-bg-accent/10 text-theme-bg-accent' : 'text-theme-text hover:bg-theme-bg-accent/5'}`}
      >
        <div className="flex items-center gap-3 truncate">
          <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all ${isVisible ? 'bg-theme-bg-accent border-theme-bg-accent shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-theme-border'}`}>
            {isVisible && <Check size={12} className="text-theme-contrast" strokeWidth={4} />}
          </div>
          {isEditing ? (
            <form onSubmit={handleRename} className="flex-1">
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleRename}
                className="w-full bg-transparent outline-none border-b border-theme-bg-accent/50 text-sm font-bold"
              />
            </form>
          ) : (
            <span className="text-sm font-bold truncate">{list.title}</span>
          )}
        </div>
      </button>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-1">
        <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-theme-bg-accent/10 rounded-lg text-theme-muted hover:text-theme-bg-accent transition-all">
          <Edit2 size={12} />
        </button>
        <button onClick={() => { if (confirm('Delete this list?')) onDelete(); }} className="p-1.5 hover:bg-theme-bg-accent/10 rounded-lg text-theme-muted hover:text-red-400 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

// ─── Column Component ────────────────────────────────────────────────────────
const TaskColumn: React.FC<{
  listId: string; title: string; tasks: GoogleTask[];
  sensors: any; selectedTaskId: string | null; focusedTaskId: string | null;
  setFocusedTaskId: (id: string | null) => void;
  onSelect: (id: string) => void; onToggle: (id: string, x?: number, y?: number) => void;
  onRemove: (id: string) => void; onUpdate: (id: string, u: Partial<GoogleTask>) => void;

  onAddTask: (text: string, parent?: string, previous?: string) => void; onMoveTask: (id: string, parent?: string, prev?: string) => void;
  onClearCompleted: () => void; onRenameList: (t: string) => Promise<void>;
  onDeleteList: (id: string) => void;
}> = ({
  listId, title, tasks, sensors,
  selectedTaskId, focusedTaskId, setFocusedTaskId,
  onSelect, onToggle, onRemove, onUpdate, onAddTask, onMoveTask,
  onClearCompleted, onRenameList, onDeleteList
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showMenu, setShowMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'manual' | 'deadline' | 'title'>('manual');
  // Local order for immediate drag feedback
  const [orderedIds, setOrderedIds] = useState<string[]>(() => tasks.filter(t => t.status !== 'completed').map(t => t.id));
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync orderedIds when tasks prop changes (e.g. after API refresh)
  useEffect(() => {
    const incoming = tasks.filter(t => t.status !== 'completed').map(t => t.id);
    setOrderedIds(prev => {
      // 1. Update any temp IDs in 'prev' to real IDs if they match
      const updatedPrev = prev.map(id => {
        if (id.startsWith('temp-')) {
          const tempTask = tasks.find(t => t.id === id);
          if (tempTask) {
            const realTask = tasks.find(t => t.title === tempTask.title && !t.id.startsWith('temp-'));
            if (realTask) return realTask.id;
          }
        }
        return id;
      });

      // 2. Remove IDs no longer present
      const existing = updatedPrev.filter(id => incoming.includes(id));
      
      // 3. Find truly new IDs
      const added = incoming.filter(id => !existing.includes(id));
      if (added.length === 0) return existing;

      // 4. Intelligently merge: insert added items into existing at their relative positions from incoming
      const newOrder = [...existing];
      added.forEach(id => {
        const idxInIncoming = incoming.indexOf(id);
        if (idxInIncoming === 0) {
          newOrder.unshift(id);
        } else {
          const prevInIncoming = incoming[idxInIncoming - 1];
          const idxInExisting = newOrder.indexOf(prevInIncoming);
          if (idxInExisting !== -1) {
            newOrder.splice(idxInExisting + 1, 0, id);
          } else {
            newOrder.push(id);
          }
        }
      });
      return newOrder;
    });
  }, [tasks]);

  // Build visibleTasks in the current ordered sequence
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const [showCompleted, setShowCompleted] = useState(false);

  const sortedVisibleTasks = useMemo(() => {
    // Reconstruct task objects in orderedIds order
    const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));
    let result = orderedIds.map(id => taskMap[id]).filter(Boolean) as GoogleTask[];
    if (sortBy === 'deadline') {
      result = [...result].sort((a, b) => {
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due).getTime() - new Date(b.due).getTime();
      });
    } else if (sortBy === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [orderedIds, tasks, sortBy]);

  const visibleTasks = sortedVisibleTasks;

  const tree = useMemo(() => buildTree(sortedVisibleTasks), [sortedVisibleTasks]);
  const flattenedTasks = useMemo(() => {
    const flatten = (nodes: TaskNode[], depth = 0): { node: TaskNode, depth: number }[] => {
      let res: { node: TaskNode, depth: number }[] = [];
      nodes.forEach(n => {
        res.push({ node: n, depth });
        if (n.children && n.children.length > 0) {
          res = res.concat(flatten(n.children, depth + 1));
        }
      });
      return res;
    };
    return flatten(tree);
  }, [tree]);

  const flattenedIds = useMemo(() => flattenedTasks.map(ft => ft.node.id), [flattenedTasks]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText.trim());
    setNewTaskText('');
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle !== title) await onRenameList(editTitle.trim());
    setIsEditingTitle(false);
  };

  const isSpecial = listId.startsWith('__');

  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col h-full bg-theme-glass/40 backdrop-blur-3xl rounded-[40px] overflow-hidden border border-theme-border shadow-2xl shadow-black/10 group/column transition-all duration-700 hover:bg-theme-glass/60 hover:border-theme-border/60 hover:shadow-theme-bg-accent/5">
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-7 bg-gradient-to-b from-theme-bg-accent/5 to-transparent">
        <div className="flex-1 min-w-0 mr-3">
          {isEditingTitle ? (
            <form onSubmit={handleRename}>
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleRename}
                className="w-full bg-transparent text-xl font-black text-theme-text outline-none border-b-2 border-theme-bg-accent/50 pb-1"
              />
            </form>
          ) : (
            <h3 className="text-xl font-black text-theme-text truncate tracking-tight">{title}</h3>
          )}
        </div>
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <div className="flex items-center bg-theme-bg-accent/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-theme-bg-accent/10 shadow-sm transition-all hover:bg-theme-bg-accent/10">
            <span className="text-[9px] font-black text-theme-bg-accent uppercase tracking-[0.15em] whitespace-nowrap">
              {visibleTasks.length} {visibleTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          {!isSpecial && (
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className={`p-1.5 rounded-xl transition-all shadow-sm ${
                showMenu 
                  ? 'bg-theme-bg-accent text-theme-contrast' 
                  : 'text-theme-text bg-theme-hover/20 hover:bg-theme-hover border border-theme-border/30 hover:border-theme-border'
              }`}
            >
              <MoreVertical size={16} />
            </button>
          )}
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute right-0 top-full mt-3 w-52 bg-theme-contrast border border-theme-border/30 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.5)] z-[60] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-theme-border/10 bg-theme-bg-accent/5">
                  <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em]">List Options</p>
                </div>
                {/* Sort Section */}
                <div className="p-1.5 border-b border-theme-border/10">
                  <p className="px-3 py-1 text-[8px] font-black text-theme-muted uppercase tracking-widest mb-1">Sort By</p>
                  {[
                    { id: 'manual', label: 'My Order', icon: LayoutGrid },
                    { id: 'deadline', label: 'Deadline', icon: Clock },
                    { id: 'title', label: 'Title', icon: StickyNote }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setSortBy(item.id as any); setShowMenu(false); }} 
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                        sortBy === item.id ? 'bg-theme-bg-accent/10 text-theme-text' : 'text-theme-muted hover:bg-theme-bg-accent/10 hover:text-theme-text'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={14} className={sortBy === item.id ? 'text-theme-bg-accent' : 'text-theme-muted group-hover:text-theme-text/70'} />
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      {sortBy === item.id && <div className="w-1 h-1 rounded-full bg-theme-bg-accent shadow-[0_0_8px_var(--theme-bg-accent)]" />}
                    </button>
                  ))}
                </div>

                {/* Actions Section */}
                <div className="p-1.5 space-y-0.5">
                  <button onClick={() => { setIsEditingTitle(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-theme-muted hover:bg-theme-bg-accent/10 hover:text-theme-text rounded-xl transition-all group">
                    <Edit2 size={14} className="text-theme-muted/30 group-hover:text-theme-muted/60" /> Rename List
                  </button>
                  {completedTasks.length > 0 && (
                    <button onClick={() => { onClearCompleted(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-green-500/80 hover:bg-green-500/10 hover:text-green-500 rounded-xl transition-all group">
                      <CheckCheck size={14} className="opacity-50 group-hover:opacity-100" /> Clear {completedTasks.length} Completed
                    </button>
                  )}
                  <button onClick={() => { if(confirm('Delete this list?')) { onDeleteList(listId); setShowMenu(false); } }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500/80 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all group">
                    <Trash2 size={14} className="opacity-50 group-hover:opacity-100" /> Delete List
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-8 pb-4 -mt-2">
        <div className="h-1 w-full bg-theme-bg-accent/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` }}
            className="h-full bg-theme-bg-accent shadow-[0_0_10px_var(--theme-bg-accent)]"
          />
        </div>
      </div>

      {/* Add task input - Strategy #6: Recessed Slot Feel */}
      <div className="flex-shrink-0 px-8 py-4 mb-4">
        <form onSubmit={handleAdd} className="relative group">
          <div className="absolute inset-0 bg-theme-bg-accent/5 rounded-[22px] blur-[1px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-3 bg-theme-bg-accent/5 border border-theme-border rounded-[20px] px-5 py-4 transition-all duration-300 focus-within:border-theme-bg-accent/20 focus-within:bg-theme-bg-accent/[0.08] focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <button type="submit" className="text-theme-muted hover:text-theme-bg-accent transition-colors">
              <Plus size={18} className="transition-transform group-focus-within:rotate-90 duration-300" />
            </button>
            <input
              type="text"
              placeholder="Add a task..."
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[14px] font-bold text-theme-text placeholder:text-theme-muted/30"
            />
          </div>
        </form>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-0 relative">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={(e) => {
            const { active, over } = e;
            if (!over || active.id === over.id) return;
            const oldIndex = orderedIds.indexOf(active.id as string);
            const newIndex = orderedIds.indexOf(over.id as string);
            if (oldIndex === -1 || newIndex === -1) return;
            // Immediately reorder locally for smooth UX
            const newOrder = [...orderedIds];
            newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, active.id as string);
            setOrderedIds(newOrder);
            // Sync to API: move task before the one now after it
            const previousId = newIndex > 0 ? newOrder[newIndex - 1] : undefined;
            onMoveTask(active.id as string, undefined, previousId);
          }}
        >
          <SortableContext items={flattenedIds} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout" initial={false}>
              {flattenedTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center opacity-30"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-theme-muted mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">No active tasks</p>
                </motion.div>
              ) : (
                flattenedTasks.map(({ node, depth }) => (
                  <TaskItem
                    key={node.id}
                    task={node}
                    depth={depth}
                    isSelected={selectedTaskId === node.id}
                    focusedTaskId={focusedTaskId}
                    setFocusedTaskId={setFocusedTaskId}
                    onToggle={onToggle}
                    onRemove={onRemove}
                    onSelect={onSelect}
                    onIndent={(id) => {
                      const idx = flattenedIds.indexOf(id);
                      if (idx > 0) onMoveTask(id, flattenedIds[idx-1]);
                    }}
                    onOutdent={(id) => {
                      const task = tasks.find(t => t.id === id);
                      if (task?.parent) onMoveTask(id, undefined, task.parent);
                    }}
                    onUpdateTask={onUpdate}
                    onEnter={(id) => onAddTask('', undefined, id)}
                    onBackspace={(id, title) => { 
                      if (title === '') {
                        const idx = flattenedIds.indexOf(id);
                        if (idx > 0) setFocusedTaskId(flattenedIds[idx-1]);
                        onRemove(id); 
                      }
                    }}
                    onArrowUp={(id) => {
                      const idx = flattenedIds.indexOf(id);
                      if (idx > 0) setFocusedTaskId(flattenedIds[idx-1]);
                    }}
                    onArrowDown={(id) => {
                      const idx = flattenedIds.indexOf(id);
                      if (idx < flattenedIds.length - 1) setFocusedTaskId(flattenedIds[idx+1]);
                    }}
                  />
                ))
              )}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-theme-border/20 mt-4">
            <button
              onClick={() => setShowCompleted(v => !v)}
              className="flex items-center gap-2 text-[10px] text-theme-muted font-black uppercase tracking-[0.2em] px-3 py-2 hover:text-theme-text transition-colors bg-theme-hover/20 rounded-xl w-full"
            >
              <div className={`transition-transform duration-300 ${showCompleted ? 'rotate-90' : ''}`}>
                <ChevronRight size={14} />
              </div>
              Completed ({completedTasks.length})
            </button>
            <AnimatePresence>
              {showCompleted && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 mt-3 overflow-hidden"
                >
                  {completedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={{ ...task, children: [] }}
                      depth={0}
                      isSelected={selectedTaskId === task.id}
                      focusedTaskId={focusedTaskId}
                      setFocusedTaskId={setFocusedTaskId}
                      onToggle={onToggle}
                      onRemove={onRemove}
                      onSelect={onSelect}
                      onIndent={() => {}}
                      onOutdent={() => {}}
                      onUpdateTask={onUpdate}
                      onEnter={() => {}}
                      onBackspace={() => {}}
                      onArrowUp={() => {}}
                      onArrowDown={() => {}}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskItem: React.FC<{
  task: TaskNode; depth: number; isSelected: boolean;
  focusedTaskId: string | null; setFocusedTaskId: (id: string | null) => void;
  onToggle: (id: string, x?: number, y?: number) => void; onRemove: (id: string) => void;
  onSelect: (id: string) => void; onIndent: (id: string) => void;
  onOutdent: (id: string) => void; onUpdateTask: (id: string, u: Partial<GoogleTask>) => void;
  onEnter: (id: string) => void; onBackspace: (id: string, title: string) => void;
  onArrowUp: (id: string) => void; onArrowDown: (id: string) => void;
}> = ({
  task, depth, isSelected, focusedTaskId, setFocusedTaskId,
  onToggle, onRemove, onSelect, onIndent, onOutdent,
  onUpdateTask, onEnter, onBackspace, onArrowUp, onArrowDown
}) => {
  const [expanded, setExpanded] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasChildren = task.children && task.children.length > 0;
  const isFocused = focusedTaskId === task.id;

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isFocused]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [task.title]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 24}px`,
    zIndex: isDragging ? 50 : 1,
    position: 'relative' as const,
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onEnter(task.id); }
    else if (e.key === 'Tab') { e.preventDefault(); e.shiftKey ? onOutdent(task.id) : onIndent(task.id); }
    else if (e.key === 'Backspace' && task.title === '') { e.preventDefault(); onBackspace(task.id, task.title); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); onArrowUp(task.id); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); onArrowDown(task.id); }
  };

  const isCompleted = task.status === 'completed';
  const isOverdue = !isCompleted && task.due && task.due.split('T')[0] < new Date().toISOString().split('T')[0];

  return (
    <div ref={setNodeRef} style={style} className="group/item outline-none relative">
      {depth > 0 && (
        <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-theme-border/30" style={{ left: `-${12}px` }} />
      )}

      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative flex items-start gap-2.5 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer group/card outline-none focus:outline-none focus:ring-0 ${
          isCompleted ? 'opacity-40 grayscale-[0.5]' :
          isSelected ? 'bg-theme-bg-accent/[0.06] ring-2 ring-inset ring-theme-bg-accent/20 z-10' :
          'hover:bg-theme-bg-accent/[0.04]'
        } ${isDragging ? 'opacity-50 shadow-2xl scale-[1.02] z-50 ring-2 ring-theme-bg-accent/50' : ''}`}
        onClick={() => { setFocusedTaskId(task.id); onSelect(task.id); }}
      >
        {/* Priority Pip */}
        {task.starred && !isCompleted && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-500 rounded-full blur-[3px] opacity-40 animate-pulse" />
        )}
        {task.starred && !isCompleted && (
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400 rounded-full z-20" />
        )}
        <div {...attributes} {...listeners} className="mt-1.5 cursor-grab active:cursor-grabbing text-theme-muted opacity-0 group-hover/item:opacity-100 transition-all flex-shrink-0">
          <Menu size={12} className="rotate-90" />
        </div>

        <motion.button
          onClick={e => { e.stopPropagation(); onToggle(task.id, e.clientX, e.clientY); }}
          whileTap={{ scale: 0.8 }}
          animate={isCompleted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
            isCompleted ? 'bg-green-500 border-green-500 text-white' : isOverdue ? 'border-red-400' : 'border-theme-muted group-hover/item:border-theme-bg-accent'
          }`}
        >
          {isCompleted ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
              <Check size={12} strokeWidth={4} />
            </motion.div>
          ) : (
            <div className={`w-2 h-2 rounded-full opacity-0 group-hover/item:opacity-40 transition-opacity ${isOverdue ? 'bg-red-400' : 'bg-theme-bg-accent'}`} />
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <textarea
            ref={inputRef}
            value={task.title}
            onChange={e => onUpdateTask(task.id, { title: e.target.value })}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocusedTaskId(task.id)}
            rows={1}
            placeholder="New task"
            className={`w-full bg-transparent border-none focus:outline-none focus-visible:outline-none focus:ring-0 text-sm text-theme-text placeholder:text-theme-muted resize-none p-0 custom-scrollbar-thin overflow-y-hidden ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}
          />
          
          {(task.notes || task.due) && (
            <div className="flex flex-wrap gap-2 mt-3.5">
              {task.notes && (
                <span className="text-[9px] font-bold text-theme-muted flex items-center gap-1.5 bg-theme-bg-accent/[0.03] px-2.5 py-1 rounded-full border border-theme-border/20">
                  <StickyNote size={10} className="opacity-40" /> Notes
                </span>
              )}
              {task.due && (
                <span className={`text-[9px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                  new Date(task.due) < new Date() && !isCompleted 
                    ? 'bg-red-500/5 text-red-500 border-red-500/20' 
                    : 'bg-theme-bg-accent/5 text-theme-bg-accent border-theme-border'
                }`}>
                  <Clock size={10} className="opacity-60" /> {new Date(task.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <button
            onClick={e => { e.stopPropagation(); onUpdateTask(task.id, { starred: !task.starred }); }}
            className={`p-1.5 rounded-lg transition-all ${task.starred ? 'text-amber-500 bg-amber-500/10' : 'text-theme-muted opacity-0 group-hover/item:opacity-100 hover:text-amber-500 hover:bg-amber-500/5'}`}
          >
            <Star size={14} fill={task.starred ? 'currentColor' : 'none'} strokeWidth={task.starred ? 2.5 : 2} />
          </button>
          
          {hasChildren && (
            <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} className={`p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-all ${expanded ? 'rotate-0' : '-rotate-90'}`}>
              <ChevronDown size={14} />
            </button>
          )}

          <button onClick={e => { e.stopPropagation(); if(confirm('Delete task?')) onRemove(task.id); }} className="p-1.5 rounded-lg text-theme-muted opacity-0 group-hover/item:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
