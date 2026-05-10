import React, { useState } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { useTasksStore } from '../../../store/tasksStore';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo, Hash } from 'lucide-react';
import { WidgetContainer } from '../../layout/WidgetContainer';

export const Todo: React.FC = () => {
  const [text, setText] = useState('');
  const [showLocal, setShowLocal] = useState(false);
  const { todos: localTodos, addTodo: addLocalTodo, toggleTodo: toggleLocalTodo, removeTodo: removeLocalTodo } = useWidgetStore();
  const { 
    isAuthenticated, 
    tasksByList, 
    activeListId, 
    toggleTask, 
    addTask: addGoogleTask,
    lists
  } = useTasksStore();

  const googleTasks = activeListId ? tasksByList[activeListId] || [] : [];
  const displayTasks = (isAuthenticated && !showLocal) ? googleTasks : localTodos;
  const isGoogle = isAuthenticated && !showLocal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (isGoogle) {
      addGoogleTask(text.trim());
    } else {
      addLocalTodo(text.trim());
    }
    setText('');
  };

  const activeListName = lists.find(l => l.id === activeListId)?.title || 'Google Tasks';

  return (
    <WidgetContainer className="w-full h-full flex flex-col min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          {isGoogle ? <ListTodo size={18} className="text-theme-bg-accent" /> : <Hash size={18} />}
          {isGoogle ? activeListName : 'Local Tasks'}
        </h3>
        
        {isAuthenticated && (
          <button 
            onClick={() => setShowLocal(!showLocal)}
            className="text-[10px] font-bold uppercase tracking-widest text-theme-muted hover:text-theme-text transition-colors"
          >
            Switch to {showLocal ? 'Google' : 'Local'}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-4 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isGoogle ? "Add task to Google..." : "Add local focus task..."}
          className="w-full bg-theme-glass border border-theme-border rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-theme-bg-accent/30 transition-all placeholder-theme-muted"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-theme-muted hover:text-theme-text transition-colors"
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
        {displayTasks.length === 0 ? (
          <div className="text-center py-8 text-theme-muted text-sm italic">
            No tasks found.
          </div>
        ) : (
          displayTasks.map((task: any) => {
            const id = isGoogle ? task.id : task.id;
            const title = isGoogle ? task.title : task.text;
            const completed = isGoogle ? task.status === 'completed' : task.completed;
            
            return (
              <div 
                key={id}
                className="flex items-center gap-3 p-3 rounded-xl bg-theme-glass hover:bg-theme-hover transition-colors group border border-transparent hover:border-theme-border"
              >
                <button 
                  onClick={() => isGoogle ? toggleTask(id) : toggleLocalTodo(id)}
                  className={`transition-colors ${completed ? 'text-green-400' : 'text-theme-muted hover:text-theme-text'}`}
                >
                  {completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                
                <span className={`flex-1 text-sm transition-all truncate ${completed ? 'line-through text-theme-muted' : 'text-theme-text opacity-90'}`}>
                  {title}
                </span>

                {!isGoogle && (
                  <button 
                    onClick={() => removeLocalTodo(id)}
                    className="text-transparent group-hover:text-theme-muted hover:text-red-400 transition-all p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {displayTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-theme-border text-[10px] text-theme-muted flex justify-between">
          <span>
            {isGoogle 
              ? displayTasks.filter((t: any) => t.status === 'completed').length 
              : displayTasks.filter((t: any) => t.completed).length} of {displayTasks.length} completed
          </span>
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      )}
    </WidgetContainer>
  );
};
