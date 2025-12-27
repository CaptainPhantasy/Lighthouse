import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_TASKS, TEXTS } from '../constants';
import { Task, UserState } from '../types';
import { Share2, CheckCircle, Circle, Clock, Filter, AlertTriangle, Eye, EyeOff, MapPin, Copy, Link as LinkIcon, Users, Lock, Heart, Loader2, MessageSquare } from 'lucide-react';
import LocalLegalGuide from './LocalLegalGuide';
import { createSupportRequest } from '../services/supportRequestService';
import { generateSupportShareMessage } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';

// Track generated support links to avoid duplicates
const taskLinkCache = new Map<string, string>();

interface DelegationHubProps {
  userState: UserState;
  tasks: Task[];
}

const DelegationHub: React.FC<DelegationHubProps> = ({ userState, tasks }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  // Gatekeeper Mode state
  const [showGatekeeperModal, setShowGatekeeperModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareMessage, setShareMessage] = useState<string>('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState(false);

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

  const handleDelegate = async (taskId: string) => {
    // Check if we already have a cached link for this task
    const cachedLink = taskLinkCache.get(taskId);
    if (cachedLink) {
      navigator.clipboard.writeText(cachedLink);
      showToast(`Link copied! Send this to a friend to let them handle this task.`);
      return;
    }

    // Find the task to get its details
    const task = [...MOCK_TASKS, ...dynamicTasks].find(t => t.id === taskId);
    if (!task) return;

    // Create a "live" SupportRequest in the database
    try {
      const result = await createSupportRequest(
        userState.name ? `user-${userState.name.replace(/\s+/g, '-').toLowerCase()}` : 'anonymous',
        `task-${taskId}@lighthouse.local`, // Placeholder email for task delegation
        `Task: ${task.title}`
      );

      if (result.success && result.magicLink) {
        // Cache the link for future use
        taskLinkCache.set(taskId, result.magicLink);
        navigator.clipboard.writeText(result.magicLink);
        showToast(`Link copied! Send this to a friend to let them handle: ${task.title}`);
      } else {
        // Fallback to static link if database creation fails
        const fallbackLink = `https://lighthouse.app/task/${taskId}/delegate`;
        taskLinkCache.set(taskId, fallbackLink);
        navigator.clipboard.writeText(fallbackLink);
        showToast(`Link copied! Send this to a friend to let them handle this task: ${fallbackLink}`);
      }
    } catch (err) {
      console.error('Failed to create support request:', err);
      // Fallback to static link
      const fallbackLink = `https://lighthouse.app/task/${taskId}/delegate`;
      taskLinkCache.set(taskId, fallbackLink);
      navigator.clipboard.writeText(fallbackLink);
      showToast(`Link copied! Send this to a friend to let them handle this task: ${fallbackLink}`);
    }

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
          case 'URGENT': return 'text-black bg-stone-200 border-2 border-black';
          case 'HIGH': return 'text-black bg-stone-200 border border-stone-400';
          default: return 'text-black bg-stone-100 border border-stone-300';
      }
  }

  const filteredTasks = activeCategory === 'ALL'
    ? tasks
    : tasks.filter(t => t.category === activeCategory);

  // Gatekeeper Mode: Generate Support Circle Link
  const handleGenerateSupportLink = async () => {
    setIsGeneratingLink(true);

    try {
      // Create a "General Support" request in the database
      // This generates a real UUID that volunteers can use to access the page
      const result = await createSupportRequest(
        userState.name ? `user-${userState.name.replace(/\s+/g, '-').toLowerCase()}` : 'anonymous',
        'general-support-link@example.com', // Placeholder for shared support links
        'General Family Support'
      );

      if (!result.success || !result.magicLink) {
        throw new Error(result.error || 'Failed to generate link');
      }

      // Use the real magic link from the database
      setGeneratedLink(result.magicLink);
      setShowGatekeeperModal(true);

      // Generate compassionate share message
      setIsGeneratingMessage(true);
      try {
        const deceasedName = userState.deceasedName || 'your loved one';
        const userName = userState.name || 'I';
        const message = await generateSupportShareMessage(userName, deceasedName, result.magicLink);
        setShareMessage(message);
        setEditedMessage(message);
      } catch (err) {
        console.error('Failed to generate share message:', err);
        // Set a default message if generation fails
        const deceasedName = userState.deceasedName || 'your loved one';
        const fallbackMessage = `Hi everyone, as we navigate this difficult time after ${deceasedName}'s passing, I wanted to share a way you can help. I've created a support link where you can see what needs to be done and pick up tasks that would mean a lot to me. Here's the link: ${result.magicLink} Thank you for being here for me.`;
        setShareMessage(fallbackMessage);
        setEditedMessage(fallbackMessage);
      } finally {
        setIsGeneratingMessage(false);
      }
    } catch (err) {
      console.error('Failed to create support link:', err);
      showToast('Could not generate link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopySupportLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyMessageAndLink = () => {
    if (editedMessage && generatedLink) {
      const fullContent = `${editedMessage}\n\n${generatedLink}`;
      navigator.clipboard.writeText(fullContent);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
      showToast('Message and link copied to clipboard!');
    }
  };

  // Check if user is in minimalist mode (high brain fog)
  const isMinimalistMode = userState.brainFogLevel >= 4;

return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 px-4 py-3 rounded-xl shadow-xl z-50 ${isDark ? 'bg-stone-800 text-white' : 'bg-stone-900 text-white'}`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200'}`}
       >
          <h2 className="text-xl font-bold mb-1">Restoration Plan</h2>
          <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
              You don't have to do this alone. Use the <span className="font-bold">Ask Support Circle</span> button to generate task links you can share with friends and family.
          </p>
       </motion.div>

       {/* Gatekeeper Mode - Share Your Support Circle Link */}
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`border-2 rounded-2xl p-6 ${isDark ? 'bg-stone-800 text-white border-stone-700' : 'bg-stone-100 text-black border-stone-200'}`}
       >
         <div className="flex items-start gap-4">
           <div className={`p-3 rounded-xl ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`}>
             <Users className="w-6 h-6" />
           </div>
           <div className="flex-1">
             <h3 className="font-bold mb-1">Gatekeeper Mode: Share Your Support Circle</h3>
             <p className="text-sm opacity-80 mb-4">
               Generate a private link for your friends and family. They can pick up tasks without you ever seeing the to-do list.
             </p>
             <motion.button
               whileHover={{ scale: isGeneratingLink ? 1 : 1.02 }}
               whileTap={{ scale: isGeneratingLink ? 1 : 0.98 }}
               onClick={handleGenerateSupportLink}
               disabled={isGeneratingLink}
               className={`px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white text-black hover:bg-stone-200' : 'bg-black text-white hover:bg-stone-800'}`}
             >
               {isGeneratingLink ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Generating...
                 </>
               ) : (
                 <>
                   <LinkIcon className="w-4 h-4" />
                   Generate Support Link
                 </>
               )}
             </motion.button>
           </div>
         </div>
       </motion.div>

       {/* Local Legal Guide - Only show for users with brain fog level < 4 */}
       {userState.brainFogLevel < 4 && (
         <LocalLegalGuide userState={userState} />
       )}

       {/* Category Filters - Hide in minimalist mode */}
       {!isMinimalistMode && (
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
           {categories.map(cat => (
             <motion.button
               key={cat}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setActiveCategory(cat)}
               className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                 activeCategory === cat
                   ? 'bg-black text-white border-black'
                   : 'bg-white text-black border-stone-300 hover:bg-stone-100'
               }`}
             >
               {cat.charAt(0) + cat.slice(1).toLowerCase()}
             </motion.button>
           ))}
         </div>
       )}

       {/* Brain fog notice and show hidden tasks button */}
       {userState.brainFogLevel > 3 && (
         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-stone-200 border border-stone-300 rounded-xl p-4"
         >
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <AlertTriangle className="w-4 h-4" />
               <p className="text-sm font-bold">
                 We've simplified your view to help you focus
               </p>
             </div>
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowHiddenTasks(!showHiddenTasks)}
               className="flex items-center gap-1 text-sm font-bold hover:bg-stone-300 px-3 py-1 rounded-full transition-colors"
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
             </motion.button>
           </div>
         </motion.div>
       )}

       <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No tasks in this category.
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm transition-all hover:shadow-md"
              >
                  <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                      </span>
                      {task.status === 'DELEGATED' ? (
                          <span className="text-xs font-bold flex items-center gap-1">
                              <Share2 className="w-3 h-3" /> Delegated
                          </span>
                      ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelegate(task.id)}
                            className="text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                              {TEXTS.delegate_action} <Share2 className="w-3 h-3" />
                          </motion.button>
                      )}
                  </div>

                  <div className="flex items-start gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleTaskComplete(task.id)}
                        className={`mt-1 ${task.status === 'COMPLETED' ? 'text-black' : 'text-stone-300 hover:text-black'} transition-colors`}
                      >
                          {task.status === 'COMPLETED' ? (
                              <CheckCircle className="w-5 h-5" />
                          ) : (
                              <Circle className="w-5 h-5" />
                          )}
                      </motion.button>
                      <div className={`${task.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
                          <h3 className={`font-bold ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>{task.title}</h3>
                          <p className="text-sm text-stone-700 mt-1 leading-relaxed">{task.description}</p>
                          {task.status === 'COMPLETED' && (
                            <p className="text-xs font-bold mt-1">✓ Completed</p>
                          )}
                      </div>
                  </div>
              </motion.div>
            ))
          )}
       </div>

       {/* Gatekeeper Modal */}
       <AnimatePresence>
         {showGatekeeperModal && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
             onClick={() => setShowGatekeeperModal(false)}
           >
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
               <div className="text-center mb-6">
                 <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Heart className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Your Support Circle Link</h3>
                 <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                   Share this link with trusted friends and family. They can pick up tasks without you seeing the details.
                 </p>
               </div>

               <div className="bg-stone-100 border-2 border-stone-300 rounded-xl p-4 mb-4">
                 <div className="flex items-center gap-2">
                   <LinkIcon className="w-4 h-4 text-stone-700 flex-shrink-0" />
                   <code className="text-sm truncate flex-1">
                     {generatedLink}
                   </code>
                 </div>
               </div>

               {/* Share Message Section */}
               <div className="mb-4">
                 <div className="flex items-center gap-2 mb-2">
                   <MessageSquare className="w-4 h-4 text-stone-700" />
                   <h4 className="font-bold text-sm">Share Message</h4>
                 </div>
                 <p className="text-xs text-stone-700 mb-2">
                   Edit this message before sending to friends and family
                 </p>

                 {isGeneratingMessage ? (
                   <div className="bg-stone-100 border border-stone-300 rounded-xl p-4 flex items-center justify-center min-h-[120px]">
                     <div className="flex items-center gap-2 text-stone-700">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span className="text-sm">Generating message...</span>
                     </div>
                   </div>
                 ) : (
                   <textarea
                     value={editedMessage}
                     onChange={(e) => setEditedMessage(e.target.value)}
                     className="w-full bg-stone-100 border-2 border-stone-300 rounded-xl p-4 text-sm leading-relaxed resize-none focus:border-black focus:outline-none transition-colors"
                     rows={5}
                     placeholder="Your message will appear here..."
                   />
                 )}
               </div>

               <div className="flex gap-3">
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleCopyMessageAndLink}
                   disabled={isGeneratingMessage}
                   className="flex-1 bg-black hover:bg-stone-800 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Copy className="w-4 h-4" />
                   {copiedMessage ? 'Copied!' : 'Copy Message + Link'}
                 </motion.button>
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setShowGatekeeperModal(false)}
                   className="px-6 py-3 bg-stone-200 hover:bg-stone-300 text-black rounded-xl font-bold transition-colors"
                 >
                   Close
                 </motion.button>
               </div>

               <p className="text-xs text-stone-700 mt-4 text-center flex items-center justify-center gap-1">
                 <Lock className="w-3 h-3" />
                 Only share with people you trust
               </p>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

export default DelegationHub;
