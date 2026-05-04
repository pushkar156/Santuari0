import React, { useState } from 'react';
import { useWidgetStore } from '../../../store/widgetStore';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { WidgetContainer } from '../../layout/WidgetContainer';

export const Todo: React.FC = () => {
  const [text, setText] = useState('');
  const { todos, addTodo, toggleTodo, removeTodo } = useWidgetStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(text.trim());
      setText('');
    }
  };

  return (
    <WidgetContainer className="w-full h-full flex flex-col min-h-[300px]">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        Daily Tasks
      </h3>

      <form onSubmit={handleSubmit} className="mb-4 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a focus task..."
          className="w-full bg-black/20 rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder-white/40"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white transition-colors"
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm italic">
            No tasks for today.
          </div>
        ) : (
          todos.map((todo) => (
            <div 
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <button 
                onClick={() => toggleTodo(todo.id)}
                className={`transition-colors ${todo.completed ? 'text-green-400' : 'text-white/30 hover:text-white/60'}`}
              >
                {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              
              <span className={`flex-1 text-sm transition-all ${todo.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                {todo.text}
              </span>

              <button 
                onClick={() => removeTodo(todo.id)}
                className="text-white/0 group-hover:text-white/30 hover:text-red-400 transition-all p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      
      {todos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/30 flex justify-between">
          <span>{todos.filter(t => t.completed).length} of {todos.length} completed</span>
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      )}
    </WidgetContainer>
  );
};
