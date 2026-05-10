import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ListTodo,
  RefreshCw, LogOut, Loader2, Menu,
  StickyNote, Star, ChevronRight, ChevronDown, X,
  MoreVertical, Edit2, Check, LayoutGrid, Settings as SettingsIcon,
  Clock, CheckCheck
} from 'lucide-react';
import { useViewStore } from '../../store/viewStore';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasksStore } from '../../store/tasksStore';
import { useWidgetStore } from '../../store/widgetStore';
import { GoogleTask } from '../../services/googleTasks';

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

// ─── Auth gate ───────────────────────────────────────────────────────────────
const AuthGate: React.FC<{ onConnect: () => void; onLocal: () => void; onSettings: () => void }> = ({ onConnect, onLocal, onSettings }) => (
  <div className="h-screen w-full flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="theme-glass p-12 max-w-md w-full text-center space-y-8">
      <div className="w-20 h-20 bg-theme-bg-accent rounded-3xl mx-auto flex items-center justify-center shadow-lg">
        <ListTodo size={40} className="text-theme-contrast" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-theme-text">Tasks Workspace</h1>
        <p className="text-theme-muted">Sync your Google Tasks or stay focused locally.</p>
      </div>
      <div className="space-y-4 pt-4">
        <button onClick={onConnect}
          className="w-full bg-theme-bg-accent text-theme-contrast py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3">
          <RefreshCw size={20} /> Connect Google Tasks
        </button>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onLocal}
            className="w-full bg-theme-hover/50 text-theme-text py-4 rounded-xl font-bold text-sm hover:bg-theme-border transition-all flex items-center justify-center gap-2 border border-theme-border/50">
            Use Local
          </button>
          <button onClick={onSettings}
            className="w-full bg-theme-hover/50 text-theme-text py-4 rounded-xl font-bold text-sm hover:bg-theme-border transition-all flex items-center justify-center gap-2 border border-theme-border/50">
            <SettingsIcon size={16} /> Settings
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export const TasksView: React.FC = () => {
  const {
    lists, tasksByList, isLoading, isAuthenticated,
    fetchLists, setActiveList, addTask, toggleTask, updateTaskDetail,
    moveTask, removeTask, sync, logout, createList, updateList, deleteList,
    clearCompleted, moveTaskToList,
    visibleListIds, toggleListVisibility,
    showTodayColumn, setShowTodayColumn,
    showStarredColumn, setShowStarredColumn,
  } = useTasksStore();
  const { todos: localTodos } = useWidgetStore();
  const { setActiveView } = useViewStore();

  const [showLocal, setShowLocal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Sync Logic
  useEffect(() => {
    if (isAuthenticated && lists.length === 0) fetchLists();
  }, [isAuthenticated, lists.length, fetchLists]);

  // Auto-fetch tasks for each list
  useEffect(() => {
    if (isAuthenticated && lists.length > 0) {
      lists.forEach(list => {
        if (!tasksByList[list.id]) setActiveList(list.id);
      });
    }
  }, [lists, isAuthenticated, tasksByList, setActiveList]);

  const allTasks = useMemo(() => Object.values(tasksByList).flat(), [tasksByList]);
  const selectedTask = !showLocal && selectedTaskId ? allTasks.find(t => t.id === selectedTaskId) : null;
  // Find which list the selected task lives in
  const selectedTaskListId = selectedTask
    ? Object.entries(tasksByList).find(([, tasks]) => tasks.some(t => t.id === selectedTask.id))?.[0] ?? null
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent, listId: string) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const listTasks = tasksByList[listId] || [];
      const oldIndex = listTasks.findIndex(t => t.id === active.id);
      const newIndex = listTasks.findIndex(t => t.id === over.id);
      onDragEnd(listId, oldIndex, newIndex);
    }
  };

  const onDragEnd = (listId: string, oldIndex: number, newIndex: number) => {
    const listTasks = tasksByList[listId] || [];
    const task = listTasks[oldIndex];
    const target = listTasks[newIndex];
    moveTask(listId, task.id, target.id);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      await createList(newListTitle.trim());
      setNewListTitle('');
      setIsCreatingList(false);
    }
  };

  const handleRenameList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingListId && editingListTitle.trim()) {
      await updateList(editingListId, editingListTitle.trim());
      setEditingListId(null);
    }
  };

  if (!isAuthenticated && !showLocal) {
    return <AuthGate onConnect={() => sync()} onLocal={() => setShowLocal(true)} onSettings={() => setActiveView('settings')} />;
  }

  const starredTasks = allTasks.filter((t: GoogleTask) => t.starred && t.status !== 'completed');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = allTasks.filter((t: GoogleTask) => {
    if (t.status === 'completed') return false;
    if (!t.due) return false;
    return t.due.split('T')[0] <= todayStr;
  });

  // Combine Google and Local tasks for columns if needed, or handle showLocal separately
  const displayLists = showLocal ? [{ id: 'local', title: 'Local Tasks' }] : lists;
  const displayTasksByList = showLocal ? { 'local': localTodos.map(t => ({ id: t.id, title: t.text, status: t.completed ? 'completed' : 'needsAction', starred: false, notes: '', updated: '', selfLink: '', parent: undefined, position: '', due: undefined } as GoogleTask)) } : tasksByList;


  return (
    <div className="h-screen w-full flex overflow-hidden bg-theme-bg/20">
      {/* Sidebar - Strategy #5: Pill Headers for Lists */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="flex-shrink-0 border-r border-theme-border/30 bg-theme-bg/10 backdrop-blur-3xl overflow-hidden flex flex-col"
      >
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
            {/* Special Views */}
            <div className="space-y-1 mb-6">
              <button
                onClick={() => setShowTodayColumn(!showTodayColumn)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[18px] transition-all group ${showTodayColumn ? 'bg-theme-bg-accent/10 text-theme-bg-accent' : 'text-theme-text hover:bg-theme-bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} className={showTodayColumn ? 'text-theme-bg-accent' : 'text-theme-muted'} />
                  <span className="text-sm font-bold">My Day</span>
                </div>
                <span className="text-[10px] font-black opacity-40">{todayTasks.length}</span>
              </button>
              <button
                onClick={() => setShowStarredColumn(!showStarredColumn)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[18px] transition-all group ${showStarredColumn ? 'bg-theme-bg-accent/10 text-theme-bg-accent' : 'text-theme-text hover:bg-theme-bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Star size={18} className={showStarredColumn ? 'text-theme-bg-accent' : 'text-theme-muted'} />
                  <span className="text-sm font-bold">Starred</span>
                </div>
                <span className="text-[10px] font-black opacity-40">{starredTasks.length}</span>
              </button>
            </div>

            <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest px-4 mb-3">Lists</p>
            {displayLists.map(list => (
              <div key={list.id} className="group flex items-center">
                <button
                  onClick={() => toggleListVisibility(list.id)}
                  className={`flex-1 flex items-center justify-between px-4 py-3 rounded-[18px] transition-all ${visibleListIds.includes(list.id) ? 'bg-theme-bg-accent/10 text-theme-bg-accent' : 'text-theme-text hover:bg-theme-bg-accent/5'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <ListTodo size={18} className={visibleListIds.includes(list.id) ? 'text-theme-bg-accent' : 'text-theme-muted'} />
                    {editingListId === list.id ? (
                      <form onSubmit={handleRenameList} className="flex-1">
                        <input
                          autoFocus
                          value={editingListTitle}
                          onChange={e => setEditingListTitle(e.target.value)}
                          onBlur={handleRenameList}
                          className="w-full bg-transparent outline-none border-b border-theme-bg-accent/50 text-sm font-bold"
                        />
                      </form>
                    ) : (
                      <span className="text-sm font-bold truncate">{list.title}</span>
                    )}
                  </div>
                </button>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 pr-2">
                  <button onClick={() => { setEditingListId(list.id); setEditingListTitle(list.title); }} className="p-1.5 hover:bg-theme-bg-accent/10 rounded-lg text-theme-muted hover:text-theme-bg-accent transition-all">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => { if (confirm('Delete this list?')) deleteList(list.id); }} className="p-1.5 hover:bg-theme-bg-accent/10 rounded-lg text-theme-muted hover:text-red-400 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {isCreatingList && (
              <form onSubmit={handleCreateList} className="px-4 py-2">
                <input
                  autoFocus
                  placeholder="New list title..."
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  onBlur={() => !newListTitle && setIsCreatingList(false)}
                  className="w-full bg-theme-bg-accent/5 border border-theme-bg-accent/30 rounded-xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:ring-1 focus:ring-theme-bg-accent/50"
                />
              </form>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-theme-border/20">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all group">
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-theme-bg/10 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="flex-shrink-0 h-24 flex items-center justify-between px-10 border-b border-theme-border/20 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-theme-bg-accent/5 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-bg-accent transition-all">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-theme-text tracking-tight flex items-center gap-3">
                Santuario Tasks
                {isLoading && <Loader2 size={18} className="animate-spin text-theme-bg-accent" />}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-bg-accent transition-colors">
                <LayoutGrid size={18} />
              </div>
              <input
                type="text"
                placeholder="Search everywhere..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-theme-bg-accent/5 border border-theme-border/30 rounded-[22px] py-3 pl-12 pr-6 text-sm font-bold text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/20 w-72 transition-all"
              />
            </div>
            <button onClick={() => sync()} className="p-3 bg-theme-bg-accent/5 hover:bg-theme-bg-accent/10 rounded-2xl text-theme-bg-accent transition-all">
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Dynamic Column Flow */}
        <div className="flex-1 overflow-x-auto custom-scrollbar flex p-8 gap-8 items-start">
          <AnimatePresence mode="popLayout">
            {showTodayColumn && (
              <TaskColumn
                key="column-today"
                listId="__today"
                title="My Day"
                tasks={todayTasks}
                sensors={sensors}
                selectedTaskId={selectedTaskId}
                focusedTaskId={focusedTaskId}
                setFocusedTaskId={setFocusedTaskId}
                onSelect={setSelectedTaskId}
                onToggle={toggleTask}
                onRemove={removeTask}
                onUpdate={updateTaskDetail}
                onDragEnd={handleDragEnd}
                onAddTask={(text) => addTask(text, displayLists[0]?.id)}
                onMoveTask={moveTask}
                onClearCompleted={() => {}}
                onRenameList={async () => {}}
                onDeleteList={() => setShowTodayColumn(false)}
              />
            )}
            {showStarredColumn && (
              <TaskColumn
                key="column-starred"
                listId="__starred"
                title="Starred"
                tasks={starredTasks}
                sensors={sensors}
                selectedTaskId={selectedTaskId}
                focusedTaskId={focusedTaskId}
                setFocusedTaskId={setFocusedTaskId}
                onSelect={setSelectedTaskId}
                onToggle={toggleTask}
                onRemove={removeTask}
                onUpdate={updateTaskDetail}
                onDragEnd={handleDragEnd}
                onAddTask={(text) => addTask(text, displayLists[0]?.id)}
                onMoveTask={moveTask}
                onClearCompleted={() => {}}
                onRenameList={async () => {}}
                onDeleteList={() => setShowStarredColumn(false)}
              />
            )}
            {(showLocal ? ['local'] : visibleListIds).map(listId => {
              const list = displayLists.find(l => l.id === listId);
              if (!list) return null;
              return (
                <TaskColumn
                  key={`column-${listId}`}
                  listId={listId}
                  title={list.title}
                  tasks={displayTasksByList[listId] || []}
                  sensors={sensors}
                  selectedTaskId={selectedTaskId}
                  focusedTaskId={focusedTaskId}
                  setFocusedTaskId={setFocusedTaskId}
                  onSelect={setSelectedTaskId}
                  onToggle={toggleTask}
                  onRemove={removeTask}
                  onUpdate={updateTaskDetail}
                  onDragEnd={handleDragEnd}
                  onAddTask={(text) => addTask(text, listId)}
                  onClearCompleted={() => clearCompleted(listId)}
                  onRenameList={(t) => updateList(listId, t)}
                  onDeleteList={(id) => deleteList(id)}
                  onMoveTask={moveTask}
                />
              );
            })}
          </AnimatePresence>

          {/* Details Pane */}
          <AnimatePresence>
            {selectedTask && (
              <motion.aside
                key="details"
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                className="w-[420px] flex-shrink-0 border-l border-theme-border bg-theme-glass backdrop-blur-2xl flex flex-col p-8 gap-6 overflow-y-auto custom-scrollbar shadow-2xl z-20"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-theme-bg-accent/10 rounded-lg flex items-center justify-center text-theme-bg-accent">
                      <Edit2 size={16} />
                    </div>
                    <span className="text-xs font-black text-theme-muted uppercase tracking-[0.2em]">Edit Task</span>
                  </div>
                  <button onClick={() => setSelectedTaskId(null)} className="p-2 hover:bg-theme-bg-accent/10 rounded-xl text-theme-muted transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Title & Notes Area */}
                  <div className="space-y-6 bg-theme-bg-accent/5 p-6 rounded-3xl border border-theme-border/20">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest ml-1">Title</label>
                      <textarea
                        value={selectedTask.title}
                        onChange={e => updateTaskDetail(selectedTask.id, { title: e.target.value })}
                        className="w-full bg-transparent text-xl font-bold text-theme-text outline-none resize-none placeholder-theme-muted/30"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 border-t border-theme-border/20 pt-6">
                      <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest ml-1">Description</label>
                      <textarea
                        value={selectedTask.notes || ''}
                        onChange={e => updateTaskDetail(selectedTask.id, { notes: e.target.value })}
                        placeholder="Add some details..."
                        className="w-full bg-transparent text-[14px] font-medium leading-relaxed text-theme-text/80 outline-none resize-none min-h-[120px] placeholder-theme-muted/30"
                      />
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="group relative">
                      <label className="absolute left-4 top-2.5 text-[9px] font-black text-theme-muted uppercase tracking-widest transition-all group-focus-within:text-theme-bg-accent">Due Date</label>
                      <input
                        type="date"
                        value={selectedTask.due ? selectedTask.due.split('T')[0] : ''}
                        onChange={e => updateTaskDetail(selectedTask.id, { due: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                        className="w-full bg-theme-bg-accent/5 border border-theme-border/20 rounded-2xl pt-7 pb-3.5 px-4 text-[13px] font-bold text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all"
                      />
                    </div>

                    <div className="group relative">
                      <label className="absolute left-4 top-2.5 text-[9px] font-black text-theme-muted uppercase tracking-widest transition-all">Move to List</label>
                      <select
                        value={selectedTaskListId || ''}
                        onChange={e => {
                          const targetListId = e.target.value;
                          if (targetListId && targetListId !== selectedTaskListId) {
                            moveTaskToList(selectedTask.id, targetListId);
                          }
                        }}
                        className="w-full bg-theme-bg-accent/5 border border-theme-border/20 rounded-2xl pt-7 pb-3.5 px-4 text-[13px] font-bold text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/20 transition-all appearance-none cursor-pointer"
                      >
                        {lists.map(l => (
                          <option key={l.id} value={l.id} className="bg-slate-900 text-white font-bold">{l.title}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 translate-y-1 text-theme-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-theme-border/20 flex justify-between items-center">
                  <button onClick={() => { if (confirm('Delete this task?')) { removeTask(selectedTask.id); setSelectedTaskId(null); } }} className="flex items-center gap-2 text-red-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-all">
                    <Trash2 size={14} /> Delete Task
                  </button>
                  <button 
                    onClick={() => updateTaskDetail(selectedTask.id, { starred: !selectedTask.starred })}
                    className={`p-3 rounded-2xl transition-all ${selectedTask.starred ? 'bg-amber-400/20 text-amber-500' : 'bg-theme-bg-accent/5 text-theme-muted hover:text-theme-bg-accent'}`}
                  >
                    <Star size={20} fill={selectedTask.starred ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// ─── Column Component ────────────────────────────────────────────────────────
const TaskColumn: React.FC<{
  listId: string; title: string; tasks: GoogleTask[];
  sensors: any; selectedTaskId: string | null; focusedTaskId: string | null;
  setFocusedTaskId: (id: string | null) => void;
  onSelect: (id: string) => void; onToggle: (id: string) => void;
  onRemove: (id: string) => void; onUpdate: (id: string, u: Partial<GoogleTask>) => void;
  onDragEnd: (e: DragEndEvent, listId: string) => void;
  onAddTask: (text: string, parent?: string, previous?: string) => void; onMoveTask: (id: string, parent?: string, prev?: string) => void;
  onClearCompleted: () => void; onRenameList: (t: string) => Promise<void>;
  onDeleteList: (id: string) => void;
}> = ({
  listId, title, tasks, sensors,
  selectedTaskId, focusedTaskId, setFocusedTaskId,
  onSelect, onToggle, onRemove, onUpdate, onDragEnd, onAddTask, onMoveTask,
  onClearCompleted, onRenameList, onDeleteList
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showMenu, setShowMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'manual' | 'deadline' | 'title'>('manual');
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const [showCompleted, setShowCompleted] = useState(false);

  const sortedVisibleTasks = useMemo(() => {
    let result = [...visibleTasks];
    if (sortBy === 'deadline') {
      result.sort((a, b) => {
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due).getTime() - new Date(b.due).getTime();
      });
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [visibleTasks, sortBy]);

  const tree = useMemo(() => buildTree(sortedVisibleTasks), [sortedVisibleTasks]);

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
    <div className="w-[360px] flex-shrink-0 flex flex-col h-full bg-theme-bg/40 backdrop-blur-xl rounded-[40px] overflow-hidden border border-theme-border/50 shadow-2xl shadow-black/5 group/column transition-all duration-500 hover:bg-theme-bg/60 hover:shadow-theme-bg-accent/5">
      {/* Column header */}
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
              className="p-1.5 rounded-xl text-theme-text bg-theme-hover/20 hover:bg-theme-hover border border-theme-border/30 hover:border-theme-border transition-all shadow-sm"
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
                className="absolute right-0 top-full mt-3 w-52 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[60] overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">List Options</p>
                </div>

                {/* Sort Section */}
                <div className="p-1.5 border-b border-white/5">
                  <p className="px-3 py-1 text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Sort By</p>
                  {[
                    { id: 'manual', label: 'My Order', icon: LayoutGrid },
                    { id: 'deadline', label: 'Deadline', icon: Clock },
                    { id: 'title', label: 'Title', icon: StickyNote }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setSortBy(item.id as any); setShowMenu(false); }} 
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                        sortBy === item.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={14} className={sortBy === item.id ? 'text-white' : 'text-white/40 group-hover:text-white/70'} />
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      {sortBy === item.id && <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />}
                    </button>
                  ))}
                </div>

                {/* Actions Section */}
                <div className="p-1.5 space-y-0.5">
                  <button onClick={() => { setIsEditingTitle(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white rounded-xl transition-all group">
                    <Edit2 size={14} className="text-white/30 group-hover:text-white/60" /> Rename List
                  </button>
                  {completedTasks.length > 0 && (
                    <button onClick={() => { onClearCompleted(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-green-400/80 hover:bg-green-400/10 hover:text-green-400 rounded-xl transition-all group">
                      <CheckCheck size={14} className="opacity-50 group-hover:opacity-100" /> Clear {completedTasks.length} Completed
                    </button>
                  )}
                  <button onClick={() => { if(confirm('Delete this list?')) { onDeleteList(listId); setShowMenu(false); } }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400/80 hover:bg-red-400/10 hover:text-red-400 rounded-xl transition-all group">
                    <Trash2 size={14} className="opacity-50 group-hover:opacity-100" /> Delete List
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add task input - Strategy #6: Recessed Slot Feel */}
      <div className="flex-shrink-0 px-8 py-4 mb-4">
        <form onSubmit={handleAdd} className="relative group">
          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-[22px] blur-[2px] opacity-40 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-3 bg-theme-bg-accent/[0.03] dark:bg-white/5 border border-theme-border/30 rounded-[20px] px-5 py-4 transition-all duration-300 focus-within:border-theme-bg-accent/30 focus-within:bg-white/60 dark:focus-within:bg-white/10 focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] shadow-inner">
            <Plus size={18} className="text-theme-muted group-focus-within/input:text-theme-bg-accent transition-colors" />
            <input
              type="text"
              placeholder="Add a task..."
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[14px] font-bold text-theme-text placeholder:text-theme-muted/40"
            />
          </div>
        </form>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onDragEnd(e, listId)}>
          <SortableContext items={visibleTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout" initial={false}>
              {tree.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center opacity-30"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-theme-muted mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">No active tasks</p>
                </motion.div>
              ) : (
                tree.map(task => {
                  const renderTask = (node: TaskNode, depth: number) => {
                    return (
                      <React.Fragment key={node.id}>
                        <TaskItem
                          task={node}
                          depth={depth}
                          isSelected={selectedTaskId === node.id}
                          focusedTaskId={focusedTaskId}
                          setFocusedTaskId={setFocusedTaskId}
                          onToggle={onToggle}
                          onRemove={onRemove}
                          onSelect={onSelect}
                          onIndent={(id) => {
                            const idx = tasks.findIndex(t => t.id === id);
                            if (idx > 0) onMoveTask(id, tasks[idx - 1].id);
                          }}
                          onOutdent={(id) => {
                            const t = tasks.find(x => x.id === id);
                            if (t?.parent) {
                              const p = tasks.find(x => x.id === t.parent);
                              onMoveTask(id, p?.parent, p?.id);
                            }
                          }}
                          onUpdateTask={onUpdate}
                          onEnter={(id) => {
                            const t = tasks.find(x => x.id === id);
                            onAddTask('', t?.parent, id);
                          }}
                          onBackspace={(id, title) => {
                            if (title === '') {
                              onRemove(id);
                              setFocusedTaskId(null);
                            }
                          }}
                          onArrowUp={() => {}}
                          onArrowDown={() => {}}
                        />
                        {node.children && node.children.length > 0 && (
                          <div className="space-y-1">
                            {node.children.map(child => renderTask(child, depth + 1))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  };
                  return renderTask(task, 0);
                })
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
  onToggle: (id: string) => void; onRemove: (id: string) => void;
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
        className={`relative flex items-start gap-4 px-5 py-4 rounded-[22px] border transition-all cursor-pointer ${
          isCompleted ? 'bg-theme-bg/5 border-transparent opacity-60' :
          isSelected ? 'bg-white/70 dark:bg-white/10 border-theme-bg-accent/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] scale-[1.01] z-10' :
          'bg-transparent border-transparent hover:bg-theme-bg-accent/[0.03]'
        } ${isDragging ? 'opacity-50 shadow-2xl scale-[1.02] z-50 ring-1 ring-theme-bg-accent' : ''}`}
        onClick={() => { setFocusedTaskId(task.id); onSelect(task.id); }}
      >
        <div {...attributes} {...listeners} className="mt-1.5 cursor-grab active:cursor-grabbing text-theme-muted opacity-0 group-hover/item:opacity-100 transition-all flex-shrink-0">
          <Menu size={12} className="rotate-90" />
        </div>

        <motion.button
          onClick={e => { e.stopPropagation(); onToggle(task.id); }}
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
            className={`w-full bg-transparent border-none outline-none resize-none p-0 text-[14px] font-semibold leading-[1.6] tracking-wide transition-all ${
              isCompleted ? 'line-through text-theme-muted/50' : 'text-theme-text'
            }`}
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
                    ? 'bg-red-400/5 text-red-500 border-red-400/20' 
                    : 'bg-indigo-400/5 text-indigo-600 dark:text-indigo-400 border-indigo-400/20'
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
