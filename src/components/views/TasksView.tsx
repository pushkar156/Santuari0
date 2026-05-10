import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ListTodo, Hash,
  RefreshCw, LogOut, Loader2, Calendar, Menu,
  StickyNote, Star, ChevronRight, ChevronDown, X,
  MoreVertical, Edit2, Check, LayoutGrid, Settings as SettingsIcon,
  Clock, AlertCircle, ArrowRightLeft, CheckCheck
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
    clearCompleted, toggleStarred, moveTaskToList,
    visibleListIds, toggleListVisibility, setVisibleListIds,
    showTodayColumn, setShowTodayColumn,
    showStarredColumn, setShowStarredColumn,
  } = useTasksStore();

  const { todos: localTodos, addTodo: addLocalTodo, toggleTodo: toggleLocalTodo, removeTodo: removeLocalTodo } = useWidgetStore();

  const [showLocal, setShowLocal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [lists, isAuthenticated]);

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

  const handleDragEnd = (listId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const tasks = tasksByList[listId] || [];
    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const prev = newIndex > oldIndex ? tasks[newIndex] : tasks[newIndex - 1];
      moveTask(active.id as string, tasks[newIndex].parent, prev?.id);
    }
  };

  const handleToggleVisibility = (listId: string) => toggleListVisibility(listId);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await createList(newListTitle.trim());
    setNewListTitle('');
    setIsCreatingList(false);
  };

  const handleRenameList = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingListTitle.trim()) {
      await updateList(id, editingListTitle.trim());
    }
    setEditingListId(null);
  };

  const handleToggle = (id: string) => showLocal ? toggleLocalTodo(id) : toggleTask(id);
  const handleRemove = (id: string) => { if (showLocal) removeLocalTodo(id); else removeTask(id); };
  const handleUpdate = (id: string, updates: Partial<GoogleTask>) => {
    if (showLocal) return;
    // Route star toggles through dedicated action so they persist across syncs
    if ('starred' in updates) {
      toggleStarred(id);
      return;
    }
    updateTaskDetail(id, updates);
  };

  const { setActiveView } = useViewStore();

  const starredTasks = allTasks.filter(t => t.starred && t.status !== 'completed');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = allTasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.due) return false;
    return t.due.split('T')[0] <= todayStr;
  });

  // Build columns for the dashboard
  const columns = useMemo(() => {
    if (showLocal) {
      return [{ id: '__local__', title: 'Local Focus', tasks: localTodos.map(t => ({ id: t.id, title: t.text, status: t.completed ? 'completed' : 'needsAction', children: [], updated: new Date().toISOString(), position: '' })) }];
    }

    const cols: { id: string; title: string; tasks: GoogleTask[] }[] = [];

    // Today & Overdue smart column
    const todayTasksSnap = allTasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.due) return false;
      const q = searchQuery.trim().toLowerCase();
      if (q && !t.title.toLowerCase().includes(q) && !(t.notes?.toLowerCase().includes(q))) return false;
      return t.due.split('T')[0] <= new Date().toISOString().split('T')[0];
    });
    if (showTodayColumn && todayTasksSnap.length > 0) {
      cols.push({ id: '__today__', title: '📅 Today & Overdue', tasks: todayTasksSnap });
    }

    // Starred column
    if (showStarredColumn) {
      const starred = allTasks.filter(t => {
        if (!t.starred || t.status === 'completed') return false;
        const q = searchQuery.trim().toLowerCase();
        return !q || t.title.toLowerCase().includes(q) || !!(t.notes?.toLowerCase().includes(q));
      });
      cols.push({ id: '__starred__', title: '⭐ Starred', tasks: starred });
    }

    // Visible user lists
    const visibleLists = lists.filter(l => visibleListIds.includes(l.id)).map(l => {
      let listTasks = tasksByList[l.id] || [];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        listTasks = listTasks.filter(t =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      }
      return { id: l.id, title: l.title, tasks: listTasks };
    });

    return [...cols, ...visibleLists];
  }, [showLocal, localTodos, showTodayColumn, showStarredColumn, allTasks, lists, visibleListIds, tasksByList, searchQuery]);


  if (!isAuthenticated && !showLocal) {
    return <AuthGate onConnect={() => sync()} onLocal={() => setShowLocal(true)} onSettings={() => setActiveView('settings')} />;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-theme-bg">
      {/* ── Sidebar ────────────────────────────────────────── */}
      {/* ── Sidebar Overlay ────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute lg:relative left-0 top-0 h-full w-[320px] bg-theme-bg/95 backdrop-blur-3xl border-r border-theme-border flex flex-col overflow-hidden z-50 shadow-2xl"
            >
            <div className="p-8 flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-theme-bg-accent rounded-[20px] flex items-center justify-center shadow-lg shadow-theme-bg-accent/20 rotate-3">
                    <ListTodo size={28} className="text-theme-contrast -rotate-3" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-theme-text leading-tight tracking-tight">Santuario</h1>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em]">Connected</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-2.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-2xl transition-all hover:rotate-90 duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-9 flex-1 overflow-y-auto custom-scrollbar pr-3 -mr-3">
                {/* Starred Section - Inspired by Google Tasks */}
                <div>
                  <div className="flex items-center justify-between px-3 mb-4">
                    <span className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em]">Quick Access</span>
                    {starredTasks.length > 0 && (
                      <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                        {starredTasks.length} Starred
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {/* Today & Overdue toggle */}
                    <button
                      onClick={() => setShowTodayColumn(!showTodayColumn)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${showTodayColumn ? 'bg-blue-500/10 text-blue-400 shadow-sm border border-blue-400/20' : 'text-theme-muted hover:bg-theme-hover/50 hover:text-theme-text border border-transparent'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showTodayColumn ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-theme-hover/50 group-hover:bg-theme-hover'}`}>
                        <Clock size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black text-sm">Today & Overdue</p>
                        <p className="text-[10px] opacity-60">Due now smart list</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {todayTasks.length > 0 && (
                          <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">{todayTasks.length}</span>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${showTodayColumn ? 'bg-blue-500 border-blue-500' : 'border-theme-border group-hover:border-theme-muted'}`}>
                          {showTodayColumn && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    </button>

                    {/* Starred toggle */}
                    <button
                      onClick={() => setShowStarredColumn(!showStarredColumn)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${showStarredColumn ? 'bg-theme-bg-accent/10 text-theme-bg-accent shadow-sm border border-theme-bg-accent/20' : 'text-theme-muted hover:bg-theme-hover/50 hover:text-theme-text border border-transparent'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showStarredColumn ? 'bg-theme-bg-accent text-theme-contrast shadow-lg shadow-theme-bg-accent/20' : 'bg-theme-hover/50 group-hover:bg-theme-hover'}`}>
                        <Star size={20} className={showStarredColumn ? 'fill-theme-contrast' : 'group-hover:text-theme-text'} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black text-sm">Starred Board</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] opacity-60">Priority view</p>
                          {starredTasks.length > 0 && (
                            <span className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black ${showStarredColumn ? 'text-theme-bg-accent' : 'text-theme-muted'}`}>{starredTasks.length}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${showStarredColumn ? 'bg-theme-bg-accent border-theme-bg-accent' : 'border-theme-border group-hover:border-theme-muted'}`}>
                          {showStarredColumn && <Check size={12} className="text-theme-contrast" strokeWidth={3} />}
                        </div>
                      </div>
                    </button>

                    {/* Starred Tasks Preview */}
                    {starredTasks.length > 0 && (
                      <div className="mt-2 pl-14 space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar-thin">
                        {starredTasks.slice(0, 5).map(task => (
                          <div
                            key={task.id}
                            onClick={() => { setSelectedTaskId(task.id); setFocusedTaskId(task.id); }}
                            className="text-xs text-theme-muted hover:text-theme-text truncate cursor-pointer py-1 transition-colors flex items-center gap-2 group/star"
                          >
                            <div className="w-1 h-1 rounded-full bg-yellow-500 opacity-40 group-hover/star:opacity-100" />
                            {task.title}
                          </div>
                        ))}
                        {starredTasks.length > 5 && (
                          <p className="text-[10px] text-theme-muted italic pl-3">+ {starredTasks.length - 5} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between px-3 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em]">Dashboard Manager</span>
                      <span className="text-[9px] text-theme-muted font-bold opacity-60">Visible: {visibleListIds.length}/{lists.length}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const allIds = lists.map(l => l.id);
                        setVisibleListIds(visibleListIds.length === allIds.length ? [] : allIds);
                      }}
                      className="text-[10px] font-black text-theme-bg-accent hover:underline decoration-2 underline-offset-4"
                    >
                      {visibleListIds.length === lists.length ? 'Hide All' : 'Show All'}
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {lists.map(list => {
                      const listTasks = tasksByList[list.id] || [];
                      const listStarredCount = listTasks.filter(t => t.starred && t.status !== 'completed').length;
                      const overdueCount = listTasks.filter(t => {
                        if (t.status === 'completed' || !t.due) return false;
                        return t.due.split('T')[0] < new Date().toISOString().split('T')[0];
                      }).length;
                      const isVisible = visibleListIds.includes(list.id);
                      
                      return (
                        <div key={list.id} className="group/list flex items-center gap-2">
                          <button
                            onClick={() => handleToggleVisibility(list.id)}
                            className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${isVisible ? 'bg-theme-bg-accent/5 text-theme-text' : 'text-theme-muted hover:bg-theme-hover/30 hover:text-theme-text'}`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isVisible ? 'bg-theme-bg-accent border-theme-bg-accent shadow-lg shadow-theme-bg-accent/20 scale-110' : 'border-theme-border group-hover/list:border-theme-muted'}`}>
                              {isVisible && <Check size={14} className="text-theme-contrast" strokeWidth={3} />}
                            </div>
                            
                            <div className="flex-1 min-w-0 text-left">
                              {editingListId === list.id ? (
                                <form onSubmit={(e) => handleRenameList(list.id, e)} className="w-full" onClick={e => e.stopPropagation()}>
                                  <input
                                    autoFocus
                                    value={editingListTitle}
                                    onChange={e => setEditingListTitle(e.target.value)}
                                    onBlur={(e) => handleRenameList(list.id, e)}
                                    className="w-full bg-theme-bg border border-theme-bg-accent/30 rounded-xl px-3 py-1 text-sm text-theme-text outline-none"
                                  />
                                </form>
                              ) : (
                                <div className="flex flex-col">
                                  <span className={`text-sm truncate ${isVisible ? 'font-black' : 'font-semibold'}`}>
                                    {list.title}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">
                                      {listTasks.filter(t => t.status === 'completed').length}/{listTasks.length} Done
                                    </span>
                                    {overdueCount > 0 && (
                                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-400/10 rounded-full border border-red-400/20 scale-75 origin-left">
                                        <AlertCircle size={8} className="text-red-400" />
                                        <span className="text-[8px] font-black text-red-400">{overdueCount}</span>
                                      </div>
                                    )}
                                    {listStarredCount > 0 && (
                                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-400/10 rounded-full border border-yellow-400/20 scale-75 origin-left">
                                        <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-[8px] font-black text-yellow-600">{listStarredCount}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center opacity-0 group-hover/list:opacity-100 transition-opacity pr-1 gap-1">
                            <button 
                              onClick={() => { setEditingListId(list.id); setEditingListTitle(list.title); }}
                              className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-xl transition-all"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => { if(confirm(`Delete "${list.title}"?`)) deleteList(list.id); }}
                              className="p-1.5 text-theme-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {isCreatingList && (
                      <motion.form 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleCreateList} 
                        className="px-2 py-2"
                      >
                        <div className="flex items-center gap-3 bg-theme-bg border-2 border-theme-bg-accent/50 rounded-2xl px-4 py-3 shadow-2xl">
                          <input
                            autoFocus
                            value={newListTitle}
                            onChange={e => setNewListTitle(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-bold text-theme-text outline-none"
                            placeholder="List name..."
                          />
                          <button 
                            type="button"
                            onClick={() => setIsCreatingList(false)}
                            className="p-1 text-theme-muted hover:text-theme-text"
                          >
                            <X size={16} />
                          </button>
                          <button type="submit" className="w-8 h-8 bg-theme-bg-accent text-theme-contrast rounded-lg flex items-center justify-center">
                            <Check size={16} strokeWidth={3} />
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="mt-auto pt-8 border-t border-theme-border flex flex-col gap-3">
                <button 
                  onClick={() => setIsCreatingList(true)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] bg-theme-bg-accent text-theme-contrast hover:scale-[1.02] active:scale-[0.98] transition-all font-black shadow-xl shadow-theme-bg-accent/20 group"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                    <Plus size={20} strokeWidth={3} />
                  </div>
                  <span>Create List</span>
                </button>
                <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] text-red-400 hover:bg-red-400/10 transition-all font-black group">
                  <div className="w-8 h-8 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <LogOut size={20} />
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
          </>
        )}
      </AnimatePresence>


      {/* ── Main Content ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-theme-bg-accent/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-theme-bg-accent/10 blur-[100px] rounded-full -z-10" />

        <header className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b border-theme-border bg-theme-glass/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-6 flex-1">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(v => !v)} 
              className={`p-3 rounded-2xl transition-all shadow-lg ${sidebarOpen ? 'text-theme-bg-accent bg-theme-bg-accent/10 border border-theme-bg-accent/20' : 'text-theme-muted hover:text-theme-text bg-theme-hover/20 border border-transparent'}`}
            >
              <Menu size={22} />
            </motion.button>
            <div className="hidden lg:block">
              <h1 className="text-2xl font-black text-theme-text tracking-tight flex items-center gap-3">
                Task Workspace
                <span className="px-2 py-0.5 bg-theme-bg-accent/10 text-theme-bg-accent text-[9px] rounded-lg font-black uppercase tracking-widest border border-theme-bg-accent/20">Board</span>
              </h1>
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest flex items-center gap-2">
                {isLoading ? <Loader2 size={10} className="animate-spin text-theme-bg-accent" /> : <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                {isLoading ? 'Syncing...' : 'Real-time cloud sync'}
              </p>
            </div>

            {/* Premium Search Bar */}
            <div className="max-w-md w-full ml-4 hidden md:block">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-theme-muted group-focus-within:text-theme-bg-accent transition-colors">
                  <Hash size={18} />
                </div>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, notes, or tags..."
                  className="w-full bg-theme-hover/20 border border-theme-border/50 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-theme-text outline-none focus:ring-4 focus:ring-theme-bg-accent/10 focus:border-theme-bg-accent/30 transition-all placeholder:text-theme-muted/40"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 px-6 py-2.5 bg-theme-bg/40 rounded-2xl border border-theme-border/50">
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-theme-border/20" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-theme-bg-accent transition-all duration-1000" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - (allTasks.length > 0 ? (allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100 : 0)} strokeLinecap="round" />
                  </svg>
                  <span className="text-[10px] font-black text-theme-text">
                    {allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-60">Total Progress</span>
                  <span className="text-xs font-black text-theme-text">{allTasks.filter(t => t.status === 'completed').length} / {allTasks.length} Done</span>
                </div>
              </div>
              <div className="w-px h-6 bg-theme-border" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-60">Active Board</span>
                <span className="text-xs font-black text-theme-text">{columns.length} Columns</span>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ rotate: 180, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.5 }}
              onClick={() => sync()} 
              disabled={isLoading}
              className="p-3 rounded-2xl bg-theme-bg-accent/10 text-theme-bg-accent border border-theme-bg-accent/20 transition-all disabled:opacity-50 shadow-lg shadow-theme-bg-accent/10"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </motion.button>
          </div>
        </header>

        {/* Board Display */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex h-full gap-6 p-8" style={{ minWidth: 'max-content' }}>
              {columns.length === 0 && (
                <div className="h-full flex items-center justify-center w-full min-w-[800px]">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 max-w-sm p-12 rounded-[40px] border border-dashed border-theme-border/50 bg-theme-hover/5"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-theme-hover to-theme-bg-accent/5 rounded-full mx-auto flex items-center justify-center text-theme-muted/40 shadow-inner">
                      <LayoutGrid size={48} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-theme-text">Board is Empty</h3>
                      <p className="text-theme-muted text-sm leading-relaxed px-4">
                        Toggle list visibility from the sidebar or enable the Starred board to see your tasks here.
                      </p>
                    </div>
                    <button 
                      onClick={() => setSidebarOpen(true)}
                      className="bg-theme-bg-accent text-theme-contrast px-8 py-3 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-theme-bg-accent/20"
                    >
                      Configure Workspace
                    </button>
                  </motion.div>
                </div>
              )}
              
              <AnimatePresence mode="popLayout" initial={false}>
                {columns.map(col => (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="h-full"
                  >
                    <ListColumn
                      listId={col.id}
                      title={col.title}
                      tasks={col.tasks as GoogleTask[]}
                      sensors={sensors}
                      selectedTaskId={selectedTaskId}
                      focusedTaskId={focusedTaskId}
                      setFocusedTaskId={setFocusedTaskId}
                      onSelect={setSelectedTaskId}
                      onToggle={handleToggle}
                      onRemove={handleRemove}
                      onUpdate={handleUpdate}
                      onDragEnd={handleDragEnd(col.id)}
                      onAddTask={async (title, parent, prev) => {
                        if (showLocal) { addLocalTodo(title); return; }
                        // Smart columns: add to the first real list
                        const targetListId = ['__starred__', '__today__'].includes(col.id)
                          ? lists[0]?.id
                          : col.id;
                        if (!targetListId) return;
                        setActiveList(targetListId);
                        const t = await addTask(title, parent, prev);
                        if (t) setFocusedTaskId(t.id);
                      }}
                      onMoveTask={moveTask}
                      onClearCompleted={() => clearCompleted(col.id)}
                      onRenameList={async (newTitle) => await updateList(col.id, newTitle)}
                      onDeleteList={async () => await deleteList(col.id)}
                    />
                  </motion.div>
                ))}

                {/* Add List Column Card */}
                {!showLocal && isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex-shrink-0"
                  >
                    <div className="w-[360px] h-full flex flex-col items-center justify-center">
                      {isCreatingList ? (
                        <motion.form 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onSubmit={handleCreateList}
                          className="w-full p-8 bg-theme-bg-accent/5 border-2 border-theme-bg-accent/30 rounded-[40px] space-y-6 shadow-2xl shadow-theme-bg-accent/10"
                        >
                          <div className="w-16 h-16 bg-theme-bg-accent rounded-3xl flex items-center justify-center shadow-lg mx-auto">
                            <Plus size={32} className="text-theme-contrast" />
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-center font-black text-theme-text uppercase tracking-widest text-xs">New List Name</h3>
                            <input
                              autoFocus
                              value={newListTitle}
                              onChange={e => setNewListTitle(e.target.value)}
                              className="w-full bg-theme-bg border-2 border-theme-border rounded-2xl px-6 py-4 text-theme-text font-bold text-center outline-none focus:border-theme-bg-accent transition-all"
                              placeholder="Type name here..."
                            />
                            <div className="flex gap-3">
                              <button 
                                type="button" 
                                onClick={() => setIsCreatingList(false)}
                                className="flex-1 py-3 rounded-xl bg-theme-hover text-theme-muted font-bold text-xs"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit"
                                className="flex-1 py-3 rounded-xl bg-theme-bg-accent text-theme-contrast font-bold text-xs shadow-lg shadow-theme-bg-accent/20"
                              >
                                Create List
                              </button>
                            </div>
                          </div>
                        </motion.form>
                      ) : (
                        <button
                          onClick={() => setIsCreatingList(true)}
                          className="w-full h-[200px] bg-theme-hover/10 border-2 border-dashed border-theme-border/50 rounded-[40px] flex flex-col items-center justify-center gap-4 text-theme-muted hover:text-theme-bg-accent hover:border-theme-bg-accent/50 hover:bg-theme-bg-accent/5 transition-all group"
                        >
                          <div className="w-16 h-16 bg-theme-bg rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Plus size={32} />
                          </div>
                          <span className="font-black text-sm uppercase tracking-[0.2em]">Add New List</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


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
                  <button 
                    onClick={() => setSelectedTaskId(null)} 
                    className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <Hash size={12} className="text-theme-bg-accent" /> Title
                  </label>
                  <textarea
                    className="w-full bg-theme-hover border border-theme-border rounded-2xl p-5 text-theme-text font-bold text-lg resize-none outline-none focus:ring-4 focus:ring-theme-bg-accent/10 focus:border-theme-bg-accent/50 transition-all shadow-inner"
                    rows={2}
                    value={selectedTask.title}
                    onChange={e => handleUpdate(selectedTask.id, { title: e.target.value })}
                    placeholder="What needs to be done?"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <StickyNote size={12} className="text-theme-bg-accent" /> Description
                  </label>
                  <textarea
                    className="w-full bg-theme-hover border border-theme-border rounded-2xl p-5 text-theme-text text-sm resize-none outline-none focus:ring-4 focus:ring-theme-bg-accent/10 focus:border-theme-bg-accent/50 transition-all min-h-[120px] leading-relaxed shadow-inner"
                    placeholder="Add more details or notes here..."
                    value={selectedTask.notes || ''}
                    onChange={e => handleUpdate(selectedTask.id, { notes: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar size={12} className="text-theme-bg-accent" /> Due Date
                    </label>
                    {(() => {
                      const isOverdue = selectedTask.due && selectedTask.due.split('T')[0] < new Date().toISOString().split('T')[0] && selectedTask.status !== 'completed';
                      return (
                        <div className="relative">
                          <input
                            type="date"
                            className={`w-full rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 transition-all border ${
                              isOverdue
                                ? 'bg-red-400/10 border-red-400/40 text-red-400 focus:ring-red-400/20'
                                : 'bg-theme-hover border-theme-border/50 text-theme-text focus:ring-theme-bg-accent/10 focus:border-theme-bg-accent/50 shadow-inner'
                            }`}
                            style={{ colorScheme: 'dark' }}
                            value={selectedTask.due ? selectedTask.due.split('T')[0] : ''}
                            onChange={e => handleUpdate(selectedTask.id, { due: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                          />
                          {isOverdue && (
                            <div className="mt-1 flex items-center gap-1 text-red-400">
                              <AlertCircle size={10} />
                              <span className="text-[9px] font-black">OVERDUE</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] flex items-center gap-2">
                      <Star size={12} className="text-theme-bg-accent" /> Priority
                    </label>
                    <button
                      onClick={() => toggleStarred(selectedTask.id)}
                      className={`w-full h-[54px] rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all border ${selectedTask.starred ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-500' : 'bg-theme-hover/50 border-transparent text-theme-muted hover:text-theme-text'}`}
                    >
                      <Star size={14} fill={selectedTask.starred ? 'currentColor' : 'none'} />
                      {selectedTask.starred ? 'Starred' : 'Not Starred'}
                    </button>
                  </div>
                </div>

                {/* Move to List */}
                {lists.length > 1 && selectedTaskListId && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] flex items-center gap-2">
                      <ArrowRightLeft size={12} className="text-theme-bg-accent" /> Move to List
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTaskListId}
                        onChange={e => {
                          moveTaskToList(selectedTask.id, e.target.value);
                          setSelectedTaskId(null);
                        }}
                        className="w-full bg-theme-hover border border-theme-border/50 rounded-2xl px-5 py-4 text-theme-text text-sm font-bold outline-none focus:ring-4 focus:ring-theme-bg-accent/10 focus:border-theme-bg-accent/50 transition-all cursor-pointer appearance-none shadow-inner"
                      >
                        {lists.map(l => (
                          <option key={l.id} value={l.id} style={{ background: '#1e293b', color: '#ffffff' }}>
                            {l.id === selectedTaskListId ? `✓ ${l.title}` : l.title}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-muted">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6 border-t border-theme-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Last Modified</span>
                    <span className="text-xs text-theme-text font-bold">
                      {new Date(selectedTask.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={() => { if(confirm('Permanently delete this task?')) { handleRemove(selectedTask.id); setSelectedTaskId(null); } }}
                    className="flex items-center gap-2 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─── List Column ─────────────────────────────────────────────────────────────
interface ListColumnProps {
  listId: string;
  title: string;
  tasks: GoogleTask[];
  sensors: any;
  selectedTaskId: string | null;
  focusedTaskId: string | null;
  setFocusedTaskId: (id: string | null) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, u: Partial<GoogleTask>) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAddTask: (title: string, parent?: string, prev?: string) => void;
  onMoveTask: (id: string, parentId?: string, prevId?: string) => void;
  onClearCompleted: () => void;
  onRenameList: (newTitle: string) => Promise<void>;
  onDeleteList: () => Promise<void>;
}

const ListColumn: React.FC<ListColumnProps> = ({
  listId, title, tasks, sensors,
  selectedTaskId, focusedTaskId, setFocusedTaskId,
  onSelect, onToggle, onRemove, onUpdate, onDragEnd, onAddTask, onMoveTask,
  onClearCompleted, onRenameList, onDeleteList
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'manual' | 'deadline' | 'title'>('manual');

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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-theme-text truncate tracking-tight">{title}</h2>
              {!isSpecial && (
                <button 
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover/column:opacity-100 p-1 text-theme-muted hover:text-theme-text transition-all"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
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
                  <button onClick={() => { if(confirm('Delete this list?')) { onDeleteList(); setShowMenu(false); } }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400/80 hover:bg-red-400/10 hover:text-red-400 rounded-xl transition-all group">
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
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
                  // Recursive function to render task and its subtasks with correct keyboard navigation
                  const renderTask = (node: TaskNode, depth: number) => {
                    const flattenedVisualList = tasks; // All tasks in flat order for focus navigation
                    
                    const handleArrow = (id: string, direction: 'up' | 'down') => {
                      const idx = flattenedVisualList.findIndex(t => t.id === id);
                      if (direction === 'up' && idx > 0) setFocusedTaskId(flattenedVisualList[idx - 1].id);
                      if (direction === 'down' && idx < flattenedVisualList.length - 1) setFocusedTaskId(flattenedVisualList[idx + 1].id);
                    };

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
                              const idx = tasks.findIndex(x => x.id === id);
                              const next = idx > 0 ? tasks[idx - 1].id : tasks.length > 1 ? tasks[1].id : null;
                              onRemove(id);
                              if (next) setFocusedTaskId(next);
                            }
                          }}
                          onArrowUp={id => handleArrow(id, 'up')}
                          onArrowDown={id => handleArrow(id, 'down')}
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
                      onArrowUp={(id) => {
                        const idx = completedTasks.findIndex(x => x.id === id);
                        if (idx > 0) setFocusedTaskId(completedTasks[idx - 1].id);
                      }}
                      onArrowDown={(id) => {
                        const idx = completedTasks.findIndex(x => x.id === id);
                        if (idx < completedTasks.length - 1) setFocusedTaskId(completedTasks[idx + 1].id);
                      }}
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
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isFocused]);

  // Auto-resize textarea
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
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      onEnter(task.id); 
    }
    else if (e.key === 'Tab') { 
      e.preventDefault(); 
      e.shiftKey ? onOutdent(task.id) : onIndent(task.id); 
    }
    else if (e.key === 'Backspace' && task.title === '') {
      e.preventDefault();
      onBackspace(task.id, task.title);
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onArrowUp(task.id);
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onArrowDown(task.id);
    }
  };

  const isCompleted = task.status === 'completed';
  const isOverdue = !isCompleted && task.due && task.due.split('T')[0] < new Date().toISOString().split('T')[0];

  return (
    <div ref={setNodeRef} style={style} className="group/item outline-none relative">
      {/* Hierarchy Line */}
      {depth > 0 && (
        <div 
          className="absolute left-[-12px] top-0 bottom-0 w-px bg-theme-border/30" 
          style={{ left: `-${12}px` }}
        />
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
        {/* Drag Handle */}
        <div 
          {...attributes} {...listeners} 
          className="mt-1.5 cursor-grab active:cursor-grabbing text-theme-muted opacity-0 group-hover/item:opacity-100 transition-all flex-shrink-0"
        >
          <Menu size={12} className="rotate-90" />
        </div>

        {/* Checkbox — animated completion */}
        <motion.button
          onClick={e => { e.stopPropagation(); onToggle(task.id); }}
          whileTap={{ scale: 0.8 }}
          animate={isCompleted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : isOverdue
              ? 'border-red-400 group-hover/item:border-red-400'
              : 'border-theme-muted group-hover/item:border-theme-bg-accent'
          }`}
        >
          {isCompleted ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
              <Check size={12} strokeWidth={4} />
            </motion.div>
          ) : (
            <div className={`w-2 h-2 rounded-full opacity-0 group-hover/item:opacity-40 transition-opacity ${
              isOverdue ? 'bg-red-400' : 'bg-theme-bg-accent'
            }`} />
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

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <button
            onClick={e => { e.stopPropagation(); onUpdateTask(task.id, { starred: !task.starred }); }}
            className={`p-1.5 rounded-lg transition-all ${task.starred ? 'text-amber-500 bg-amber-500/10' : 'text-theme-muted opacity-0 group-hover/item:opacity-100 hover:text-amber-500 hover:bg-amber-500/5'}`}
          >
            <Star size={14} fill={task.starred ? 'currentColor' : 'none'} strokeWidth={task.starred ? 2.5 : 2} />
          </button>
          
          {hasChildren && (
            <button 
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} 
              className={`p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-all ${expanded ? 'rotate-0' : '-rotate-90'}`}
            >
              <ChevronDown size={14} />
            </button>
          )}

          <button 
            onClick={e => { e.stopPropagation(); if(confirm('Delete task?')) onRemove(task.id); }}
            className="p-1.5 rounded-lg text-theme-muted opacity-0 group-hover/item:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>

      {/* Subtasks */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-1 mt-1 overflow-hidden"
          >
            <SortableContext items={task.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {task.children.map(child => (
                <TaskItem key={child.id} task={child} depth={depth + 1}
                  isSelected={isSelected} focusedTaskId={focusedTaskId} setFocusedTaskId={setFocusedTaskId}
                  onToggle={onToggle} onRemove={onRemove} onSelect={onSelect}
                  onIndent={onIndent} onOutdent={onOutdent} onUpdateTask={onUpdateTask}
                  onEnter={onEnter} onBackspace={onBackspace} onArrowUp={onArrowUp} onArrowDown={onArrowDown}
                />
              ))}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
