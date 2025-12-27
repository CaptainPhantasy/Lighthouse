import React, { useState, useEffect } from 'react';
import { MOCK_TASKS, TEXTS } from '../constants';
import { Task, UserState } from '../types';
import { Share2, CheckCircle, Circle, Clock, Filter, AlertTriangle, Eye, EyeOff, MapPin, Check } from 'lucide-react';
import LocalLegalGuide from './LocalLegalGuide';

interface DelegationHubProps {
  userState: UserState;
  tasks: Task[];
}

const DelegationHub: React.FC<DelegationHubProps> = ({ userState, tasks }) => {
  // Toast notification state
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: '', visible: false});

  const showToast = (message: string) => {
    setToast({message, visible: true});
    setTimeout(() => setToast({message: '', visible: false}), 3000);
  };
  const [dynamicTasks, setDynamicTasks] = useState<Task[]>(tasks);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [showHiddenTasks, setShowHiddenTasks] = useState(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lighthouse_show_hidden_tasks');
      return saved === 'true';
    }
    return false;
  });

  // Check if all urgent and high priority tasks are completed
  const allUrgentAndHighCompleted = tasks.every(task => {
    if (task.priority === 'URGENT' || task.priority === 'HIGH') {
      return task.status === 'COMPLETED';
    }
    return true;
  });

  // Filter tasks based on brain fog level
  useEffect(() => {
    // Combine MOCK_TASKS with dynamic tasks (from document scanning)
    let allTasks = [...MOCK_TASKS, ...dynamicTasks];

    // Remove duplicates based on task id
    const uniqueTasks = allTasks.filter((task, index, self) =>
      index === self.findIndex(t => t.id === task.id)
    );

    let filteredTasks = [...uniqueTasks];

    // If brain fog level > 3, hide non-urgent FINANCIAL and LEGAL tasks
    if (userState.brainFogLevel > 3) {
      const hiddenTasks = filteredTasks.filter(task =>
        (task.category === 'FINANCIAL' && task.priority !== 'URGENT') ||
        (task.category === 'LEGAL' && task.priority !== 'URGENT')
      );

      // Only hide hidden tasks if showHiddenTasks is false
      if (!showHiddenTasks) {
        filteredTasks = filteredTasks.filter(task =>
          !((task.category === 'FINANCIAL' && task.priority !== 'URGENT') ||
          (task.category === 'LEGAL' && task.priority !== 'URGENT'))
        );
      }
    }

    // Add VA burial benefits task if user is veteran
    if (userState.isVeteran) {
      const vaTaskExists = filteredTasks.some(t => t.title.includes('VA Burial Benefits'));
      if (!vaTaskExists) {
        filteredTasks.unshift({
          id: 'va-burial',
          title: 'Claim VA Burial Benefits',
          description: 'Apply for Veterans Affairs burial benefits to cover funeral expenses and cemetery costs.',
          priority: 'HIGH',
          status: 'PENDING',
          category: 'FINANCIAL'
        });
      }
    }

    setDynamicTasks(filteredTasks);
  }, [userState.brainFogLevel, userState.isVeteran, dynamicTasks, showHiddenTasks]);

  const categories = ['ALL', 'LEGAL', 'LOGISTICS', 'FINANCIAL', 'CEREMONY'];

  const handleDelegate = (taskId: string) => {
    // In a real app, this generates a unique link
    const link = `https://lighthouse.app/task/${taskId}/delegate`;
    navigator.clipboard.writeText(link);

    // Show toast notification instead of alert
    showToast(`Link copied! Send this to a friend to let them handle this task: ${link}`);

    setDynamicTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'DELEGATED' } : t
    ));
  };

  const handleTaskComplete = (taskId: string) => {
    setDynamicTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'COMPLETED' } : t
    ));
    showToast('Task marked as complete!');
  };

  // Save showHiddenTasks to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lighthouse_show_hidden_tasks', showHiddenTasks.toString());
    }
  }, [showHiddenTasks]);

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'URGENT': return 'text-red-600 bg-red-50';
          case 'HIGH': return 'text-orange-600 bg-orange-50';
          default: return 'text-slate-600 bg-slate-50';
      }
  }

  const filteredTasks = activeCategory === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.category === activeCategory);

return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-medium text-slate-800 mb-1">Restoration Plan</h2>
          <p className="text-slate-500 text-sm">
              You don't have to do this alone. Use the <span className="font-medium text-blue-600">Ask Support Circle</span> button to generate task links you can share with friends and family.
          </p>
       </div>

       {/* Local Legal Guide - Only show for users with brain fog level < 4 */}
       <LocalLegalGuide userState={userState} />

       {/* Category Filters */}
       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {categories.map(cat => (
           <button
             key={cat}
             onClick={() => setActiveCategory(cat)}
             className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
               activeCategory === cat 
                 ? 'bg-slate-800 text-white border-slate-800' 
                 : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
             }`}
           >
             {cat.charAt(0) + cat.slice(1).toLowerCase()}
           </button>
         ))}
       </div>

       {/* Brain fog notice and show hidden tasks button */}
       {userState.brainFogLevel > 3 && (
         <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-purple-600" />
               <p className="text-sm text-purple-800 font-medium">
                 We've simplified your view to help you focus
               </p>
             </div>
             <button
               onClick={() => setShowHiddenTasks(!showHiddenTasks)}
               className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 px-3 py-1 rounded-full transition-colors"
             >
               {showHiddenTasks ? (
                 <>
                   <EyeOff className="w-3 h-3" />
                   Hide details
                 </>
               ) : (
                 <>
                   <Eye className="w-3 h-3" />
                   Show {dynamicTasks.filter(t =>
                     (t.category === 'FINANCIAL' && t.priority !== 'URGENT') ||
                     (t.category === 'LEGAL' && t.priority !== 'URGENT')
                   ).length} more tasks
                 </>
               )}
             </button>
           </div>
         </div>
       )}

       <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No tasks in this category.
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                      </span>
                      {task.status === 'DELEGATED' ? (
                          <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                              <Share2 className="w-3 h-3" /> Delegated
                          </span>
                      ) : (
                          <button 
                            onClick={() => handleDelegate(task.id)}
                            className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline"
                          >
                              {TEXTS.delegate_action} <Share2 className="w-3 h-3" />
                          </button>
                      )}
                  </div>
                  
                  <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className={`mt-1 ${task.status === 'COMPLETED' ? 'text-green-500' : 'text-slate-300 hover:text-green-500'} transition-colors`}
                      >
                          {task.status === 'COMPLETED' ? (
                              <Check className="w-5 h-5" />
                          ) : (
                              <Circle className="w-5 h-5" />
                          )}
                      </button>
                      <div className={`${task.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
                          <h3 className={`text-slate-800 font-medium ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>{task.title}</h3>
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                          {task.status === 'COMPLETED' && (
                            <p className="text-xs text-green-600 mt-1">✓ Completed</p>
                          )}
                      </div>
                  </div>
              </div>
            ))
          )}
       </div>
    </div>
  );
};

export default DelegationHub;