import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  ListTodo, 
  RefreshCw,
  LogOut,
  ChevronDown,
  Edit2,
  Calendar as CalendarIcon,
  Menu,
  Search,
  Settings as SettingsIcon,
  X,
  Hash,
  MoreVertical,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { useTasksStore } from '../../store/tasksStore';
import { useWidgetStore } from '../../store/widgetStore';

export const TasksView: React.FC = () => {
  const { 
    lists, 
    tasksByList, 
    activeListId, 
    isLoading, 
    isAuthenticated,
    error,
    fetchLists,
    fetchTasks,
    setActiveList,
    addTask,
    createList,
    toggleTask,
    updateTask,
    removeTask,
    sync,
    logout
  } = useTasksStore();
  const { todos: localTodos, addTodo: addLocalTodo, toggleTodo: toggleLocalTodo, removeTodo: removeLocalTodo } = useWidgetStore();

  const [newTaskText, setNewTaskText] = useState('');
  const [showLocal, setShowLocal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // Initial Sync Logic
  useEffect(() => {
    if (isAuthenticated) {
      sync(false);
    }
  }, [isAuthenticated, sync]);

  // Ensure data is fetched if lists are empty but authenticated
  useEffect(() => {
    if (isAuthenticated && lists.length === 0 && !isLoading) {
      fetchLists(false);
    }
  }, [isAuthenticated, lists.length, isLoading, fetchLists]);

  // Fetch tasks for active list if missing
  useEffect(() => {
    if (isAuthenticated && activeListId && !tasksByList[activeListId] && !isLoading) {
      fetchTasks(activeListId);
    }
  }, [isAuthenticated, activeListId, tasksByList, isLoading, fetchTasks]);

  const rawTasks = useMemo(() => {
    let tasks: any[] = [];
    if (showLocal) {
      tasks = localTodos.map(t => ({ 
        id: t.id, 
        title: t.text, 
        status: t.completed ? 'completed' : 'needsAction',
        notes: '',
        due: null
      }));
    } else {
      tasks = activeListId ? tasksByList[activeListId] || [] : [];
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return tasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) || 
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return tasks;
  }, [showLocal, localTodos, activeListId, tasksByList, searchQuery]);

  const activeTasks = useMemo(() => rawTasks.filter(t => t.status !== 'completed'), [rawTasks]);
  const completedTasks = useMemo(() => rawTasks.filter(t => t.status === 'completed'), [rawTasks]);
  
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    const allListsTasks = Object.values(tasksByList).flat();
    const allPossibleTasks = [...allListsTasks, ...localTodos.map(t => ({ 
      id: t.id, 
      title: t.text, 
      status: t.completed ? 'completed' : 'needsAction',
      notes: '',
      due: null
    }))];
    return allPossibleTasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasksByList, localTodos]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    if (showLocal) {
      addLocalTodo(newTaskText.trim());
    } else {
      addTask(newTaskText.trim());
    }
    setNewTaskText('');
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) {
      setIsAddingList(false);
      return;
    }
    createList(newListTitle.trim());
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleToggle = (id: string) => {
    if (showLocal) {
      toggleLocalTodo(id);
    } else {
      toggleTask(id);
    }
  };

  const handleRemove = (id: string) => {
    if (showLocal) {
      removeLocalTodo(id);
    } else {
      removeTask(id);
    }
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  // Auth/Login View
  if (!isAuthenticated && !showLocal) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-6 bg-slate-950 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-12 max-w-md w-full text-center space-y-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-[2.5rem]"
        >
          <div className="w-24 h-24 bg-white rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl transform -rotate-6">
            <ListTodo size={48} className="text-slate-950" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">Santuario Tasks</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Professional task management with seamless Google synchronization.
            </p>
          </div>
          
          <div className="space-y-4 pt-6">
            <button 
              onClick={() => sync(true)}
              disabled={isLoading}
              className="w-full bg-white text-slate-950 py-5 rounded-2xl font-bold text-xl hover:bg-slate-100 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
              Connect Google
            </button>
            <button 
              onClick={() => setShowLocal(true)}
              className="w-full bg-slate-800 text-white border border-slate-700 py-5 rounded-2xl font-bold text-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              Offline Mode
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 text-red-400 bg-red-400/5 p-5 rounded-2xl text-sm justify-center border border-red-400/20"
            >
              <AlertCircle size={20} />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative z-10 bg-slate-950">
      {/* Header - Strictly Solid */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900 shadow-xl relative z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-xl text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ListTodo size={18} className="text-slate-950" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight hidden sm:block">Santuario Tasks</span>
          </div>
          
          <div className="relative group min-w-[300px] hidden md:block">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Search tasks, notes, lists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-11 pr-6 text-sm text-white outline-none focus:border-slate-600 transition-all font-medium placeholder-slate-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <button 
              onClick={() => sync(true)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold transition-all border border-slate-700 ${isLoading ? 'opacity-50' : 'active:scale-95'}`}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
          <div className="h-6 w-px bg-slate-800" />
          <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Strictly Solid */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 flex flex-col gap-6 p-5 overflow-hidden border-r border-slate-800 bg-slate-900 relative z-20"
            >
              {/* Create List Button */}
              <button 
                onClick={() => setIsAddingList(true)}
                className="w-full flex items-center gap-3 px-5 py-3.5 bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] transition-all group rounded-xl shadow-xl shadow-black/20"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-bold text-xs uppercase tracking-widest">New Task List</span>
              </button>

              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <div className="flex items-center justify-between px-2 mb-1">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Your Collections</h2>
                </div>
                
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  <AnimatePresence>
                    {isAddingList && (
                      <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleCreateList}
                        className="mb-3"
                      >
                        <input
                          autoFocus
                          value={newListTitle}
                          onChange={(e) => setNewListTitle(e.target.value)}
                          onBlur={() => !newListTitle && setIsAddingList(false)}
                          placeholder="List title..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-slate-600 transition-all"
                        />
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => {
                      setShowLocal(true);
                      setSelectedTaskId(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      showLocal 
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-lg' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <Hash size={16} className={showLocal ? 'text-white' : 'text-slate-500'} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Local workspace</span>
                  </button>

                  <div className="h-px bg-slate-800 my-2 mx-2" />

                  {isAuthenticated && lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => {
                        setActiveList(list.id);
                        setShowLocal(false);
                        setSelectedTaskId(null);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        !showLocal && activeListId === list.id 
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-lg' 
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <ListTodo size={16} className={!showLocal && activeListId === list.id ? 'text-white' : 'text-slate-500'} />
                      <span className="text-[11px] font-bold uppercase tracking-wider truncate text-left">{list.title}</span>
                    </button>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-slate-800 mt-auto">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <LogOut size={14} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area - Strictly Solid */}
        <main className="flex-1 flex overflow-hidden relative bg-slate-950">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto px-8 py-12">
                {/* Header Area */}
                <div className="mb-10 flex items-end justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border ${
                        showLocal 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {showLocal ? 'Personal Workspace' : 'Cloud Synchronized'}
                      </span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">
                      {showLocal ? 'Personal Tasks' : (lists.find(l => l.id === activeListId)?.title || 'Tasks')}
                    </h1>
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                          {activeTasks.length} Pending
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-800" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {completedTasks.length} Completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Input Bar */}
                <div className="mb-10">
                  <form onSubmit={handleAddTask} className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors">
                      <Plus size={24} />
                    </div>
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Add a new task to your list..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-6 pl-16 pr-8 text-lg font-bold text-white outline-none focus:border-slate-600 transition-all placeholder-slate-700 shadow-xl"
                    />
                  </form>
                </div>

                {/* Tasks List */}
                <div className="space-y-10 pb-20">
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {activeTasks.map((todo) => (
                        <TaskRow 
                          key={todo.id} 
                          todo={todo} 
                          isSelected={selectedTaskId === todo.id}
                          onToggle={() => handleToggle(todo.id)} 
                          onClick={() => setSelectedTaskId(todo.id)}
                        />
                      ))}
                      
                      {activeTasks.length === 0 && !isLoading && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="py-20 text-center bg-slate-900 rounded-3xl border border-slate-800"
                        >
                          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Check size={32} className="text-slate-500" />
                          </div>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">All tasks completed</p>
                          <p className="text-xs text-slate-600 mt-2 uppercase tracking-wider font-bold">You're having a productive day!</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {completedTasks.length > 0 && (
                    <div className="space-y-4">
                      <button 
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900 rounded-xl transition-all group"
                      >
                        <motion.div animate={{ rotate: showCompleted ? 0 : -90 }}>
                          <ChevronDown size={14} className="text-slate-500" />
                        </motion.div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300">
                          Completed Tasks ({completedTasks.length})
                        </span>
                      </button>
                      
                      <AnimatePresence>
                        {showCompleted && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-2"
                          >
                            {completedTasks.map((todo) => (
                              <TaskRow 
                                key={todo.id} 
                                todo={todo} 
                                isSelected={selectedTaskId === todo.id}
                                onToggle={() => handleToggle(todo.id)} 
                                onClick={() => setSelectedTaskId(todo.id)}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Panel - Third Column - Strictly Solid */}
          <AnimatePresence>
            {selectedTask && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 450, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 bg-slate-900 border-l border-slate-800 z-40 overflow-hidden flex flex-col shadow-2xl"
              >
                <DetailsPanel 
                  task={selectedTask} 
                  onClose={() => setSelectedTaskId(null)}
                  onUpdate={(updates) => updateTask(selectedTask.id, updates)}
                  onRemove={() => handleRemove(selectedTask.id)}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const TaskRow = ({ todo, isSelected, onToggle, onClick }: { todo: any, isSelected: boolean, onToggle: () => void, onClick: () => void }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={onClick}
      className={`group flex items-center gap-5 px-6 py-5 cursor-pointer transition-all rounded-2xl border ${
        isSelected 
          ? 'bg-slate-800 border-slate-600 shadow-xl' 
          : 'bg-slate-900 border-transparent hover:border-slate-800 hover:bg-slate-800/40'
      } ${todo.status === 'completed' ? 'opacity-50' : ''}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex-shrink-0 transition-all transform hover:scale-110 active:scale-90 ${
          todo.status === 'completed' ? 'text-white' : 'text-slate-600 group-hover:text-white'
        }`}
      >
        {todo.status === 'completed' ? (
          <CheckCircle2 size={24} className="fill-white text-slate-950" />
        ) : (
          <Circle size={24} className="stroke-[2px]" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-base font-bold block truncate transition-all tracking-tight ${
          todo.status === 'completed' ? 'line-through text-slate-500' : 'text-white'
        }`}>
          {todo.title}
        </span>
        {(todo.notes || todo.due) && (
          <div className="flex items-center gap-3 mt-1.5">
            {todo.notes && (
              <span className="text-[9px] text-slate-500 truncate max-w-[200px] font-black uppercase tracking-widest">
                • Details included
              </span>
            )}
            {todo.due && (
              <div className="flex items-center gap-1.5 text-[9px] text-white font-black uppercase tracking-widest bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                <CalendarIcon size={10} />
                <span>{format(new Date(todo.due), 'MMM d')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>
    </motion.div>
  );
};

const DetailsPanel = ({ task, onClose, onUpdate, onRemove }: { 
  task: any, 
  onClose: () => void, 
  onUpdate: (updates: any) => void,
  onRemove: () => void
}) => {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || '');
  }, [task]);

  const handleBlur = () => {
    if (title !== task.title || notes !== (task.notes || '')) {
      onUpdate({ title, notes });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-800">
        <button 
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
        <button 
          onClick={onRemove}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Title</label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            className="w-full bg-transparent text-2xl font-black text-white outline-none resize-none placeholder-slate-800 leading-tight border-none p-0 focus:ring-0"
            rows={2}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Edit2 size={12} />
            Description
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleBlur}
            placeholder="No description provided..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm text-white outline-none focus:border-slate-600 transition-all min-h-[200px] resize-none leading-relaxed"
          />
        </div>

        <div className="pt-8 border-t border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon size={16} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Due Date</span>
            </div>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-slate-700">
              {task.due ? format(new Date(task.due), 'MMM d, yyyy') : 'Set Date'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</span>
            </div>
            <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${
              task.status === 'completed' 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {task.status === 'completed' ? 'Completed' : 'Active'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
