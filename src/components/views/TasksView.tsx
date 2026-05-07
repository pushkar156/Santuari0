import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  ListTodo, 
  MoreHorizontal,
  Hash,
  RefreshCw,
  LogOut,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTasksStore } from '../../store/tasksStore';
import { useWidgetStore } from '../../store/widgetStore';

export const TasksView: React.FC = () => {
  const { 
    lists, 
    tasksByList, 
    activeListId, 
    isLoading, 
    error, 
    isAuthenticated,
    fetchLists,
    setActiveList,
    addTask,
    toggleTask,
    removeTask,
    sync,
    logout
  } = useTasksStore();

  const { todos: localTodos, addTodo: addLocalTodo, toggleTodo: toggleLocalTodo, removeTodo: removeLocalTodo } = useWidgetStore();
  const [newTaskText, setNewTaskText] = useState('');
  const [showLocal, setShowLocal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && lists.length === 0) {
      fetchLists();
    }
  }, [isAuthenticated]);

  const activeTasks = showLocal 
    ? localTodos.map(t => ({ id: t.id, title: t.text, status: t.completed ? 'completed' : 'needsAction' }))
    : (activeListId ? tasksByList[activeListId] || [] : []);

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
  };

  if (!isAuthenticated && !showLocal) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="theme-glass p-12 max-w-md w-full text-center space-y-8"
        >
          <div className="w-20 h-20 bg-theme-bg-accent rounded-3xl mx-auto flex items-center justify-center shadow-lg">
            <ListTodo size={40} className="text-theme-contrast" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-theme-text">Tasks Workspace</h1>
            <p className="text-theme-muted">Sync your Google Tasks or stay focused with local task management.</p>
          </div>
          
          <div className="space-y-4 pt-4">
            <button 
              onClick={() => sync()}
              className="w-full bg-theme-bg-accent text-theme-contrast py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <RefreshCw size={20} />
              Connect Google Tasks
            </button>
            <button 
              onClick={() => setShowLocal(true)}
              className="w-full bg-theme-hover text-theme-text py-4 rounded-2xl font-bold text-lg hover:bg-theme-border transition-all flex items-center justify-center gap-3"
            >
              Use Local Tasks
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
            <h2 className="text-xl font-bold text-theme-text">Collections</h2>
            {isAuthenticated && (
              <button 
                onClick={() => sync()} 
                className={`text-theme-muted hover:text-theme-text transition-colors ${isLoading ? 'animate-spin' : ''}`}
                title="Sync now"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
          
          {/* Local Tasks Tab */}
          <button
            onClick={() => setShowLocal(true)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              showLocal 
                ? 'bg-theme-bg-accent text-theme-contrast shadow-lg scale-[1.02]' 
                : 'text-theme-muted hover:bg-theme-hover'
            }`}
          >
            <Hash size={18} />
            <span className="font-medium">Local Tasks</span>
          </button>

          <div className="h-px bg-theme-border my-2 mx-4" />

          {/* Google Task Lists */}
          {isAuthenticated ? (
            <div className="space-y-1">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => {
                    setActiveList(list.id);
                    setShowLocal(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    !showLocal && activeListId === list.id 
                      ? 'bg-theme-bg-accent text-theme-contrast shadow-lg scale-[1.02]' 
                      : 'text-theme-muted hover:bg-theme-hover'
                  }`}
                >
                  <ListTodo size={18} />
                  <span className="font-medium truncate">{list.title}</span>
                </button>
              ))}
            </div>
          ) : !showLocal && (
            <button 
              onClick={() => sync()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-theme-bg-accent hover:bg-theme-bg-accent/10 transition-all"
            >
              <RefreshCw size={18} />
              <span className="font-medium">Sign in to Google</span>
            </button>
          )}
          
          <div className="h-px bg-theme-border my-2 mx-4" />
          
          {isAuthenticated && (
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          )}
        </div>

        {/* Progress Card */}
        <div className="theme-glass p-6 flex-1 flex flex-col justify-end">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-theme-muted uppercase tracking-wider font-bold mb-1">
                  {showLocal ? 'Local' : 'Google Tasks'}
                </p>
                <h4 className="text-2xl font-bold text-theme-text">
                  {activeTasks.filter(t => t.status === 'completed').length}/{activeTasks.length}
                </h4>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-theme-border flex items-center justify-center">
                <span className="text-xs font-bold">
                  {activeTasks.length > 0 ? Math.round((activeTasks.filter(t => t.status === 'completed').length / activeTasks.length) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-theme-border rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-theme-bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${activeTasks.length > 0 ? (activeTasks.filter(t => t.status === 'completed').length / activeTasks.length) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        <header className="theme-glass p-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {!showLocal && <span className="px-2 py-0.5 bg-theme-bg-accent/20 text-theme-bg-accent text-[10px] font-bold rounded-md uppercase tracking-wider">Sync Active</span>}
              <h1 className="text-3xl font-bold text-theme-text">
                {showLocal ? 'Local Tasks' : (lists.find(l => l.id === activeListId)?.title || 'Tasks')}
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
            <button className="p-3 bg-theme-hover rounded-full text-theme-text hover:scale-110 transition-all">
              <MoreHorizontal size={24} />
            </button>
          </div>
        </header>

        <section className="flex-1 theme-glass overflow-hidden flex flex-col">
          {/* Add Task Input */}
          <div className="p-8 border-b border-theme-border">
            <form onSubmit={handleAddTask} className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-bg-accent transition-colors">
                <Plus size={24} />
              </div>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder={`Add a task to ${showLocal ? 'Local Tasks' : (lists.find(l => l.id === activeListId)?.title || 'this list')}...`}
                className="w-full bg-theme-hover rounded-2xl py-4 pl-14 pr-6 text-lg text-theme-text outline-none focus:ring-2 focus:ring-theme-bg-accent/30 transition-all placeholder-theme-muted/50"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-bg-accent">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
            </form>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {activeTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full opacity-40 select-none"
                >
                  <Hash size={64} className="mb-4" />
                  <p className="text-xl font-medium">No tasks found in this list</p>
                </motion.div>
              ) : (
                activeTasks.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group flex items-center gap-4 p-5 rounded-2xl border border-theme-border transition-all duration-300 ${
                      todo.status === 'completed' 
                        ? 'bg-theme-glass/30 opacity-60' 
                        : 'bg-theme-glass hover:bg-theme-hover hover:border-theme-bg-accent/30 shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => handleToggle(todo.id)}
                      className={`flex-shrink-0 transition-transform hover:scale-110 ${
                        todo.status === 'completed' ? 'text-green-400' : 'text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {todo.status === 'completed' ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                    </button>

                    <span className={`flex-1 text-lg transition-all ${
                      todo.status === 'completed' ? 'line-through text-theme-muted' : 'text-theme-text'
                    }`}>
                      {todo.title}
                    </span>

                    <button
                      onClick={() => handleRemove(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-theme-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
};
