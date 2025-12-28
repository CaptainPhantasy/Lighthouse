/**
 * Phase 2: Single-Focus Milestone View
 *
 * For users with brain fog level 4-5.
 * Hides the complex grid and shows ONE card for the next immediate milestone.
 *
 * Example: "The Hospital in Oregon needs a Release Form"
 *
 * Design principles:
 * - One thing at a time
 * - Large, readable text
 * - Calming stone colors
 * - Single action button
 * - Haptic feedback on interaction
 */

import { motion, AnimatePresence } from 'motion/react';
import { Task, UserState } from '../types';
import { ArrowRight, CheckCircle, Shield, Home, Plane, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SingleFocusMilestoneProps {
  tasks: Task[];
  userState: UserState;
  onTaskComplete: (taskId: string) => void;
  onTaskView?: (taskId: string) => void;
  onNextStep?: () => void;
}

const SingleFocusMilestone: React.FC<SingleFocusMilestoneProps> = ({
  tasks,
  userState,
  onTaskComplete,
  onTaskView,
  onNextStep,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Find the next immediate milestone
  // Priority: URGENT > HIGH > NORMAL, and status PENDING or IN_PROGRESS
  const nextMilestone = tasks
    .filter(t => t.status !== 'COMPLETED' && t.status !== 'DELEGATED')
    .sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
      const aPriority = priorityOrder[a.priority] ?? 99;
      const bPriority = priorityOrder[b.priority] ?? 99;
      return aPriority - bPriority;
    })[0];

  const hasMilestone = !!nextMilestone;

  // Get milestone icon based on category
  const getMilestoneIcon = () => {
    if (!nextMilestone) return Shield;

    switch (nextMilestone.category) {
      case 'LEGAL': return Shield;
      case 'LOGISTICS': return Plane;
      case 'FINANCIAL': return Home;
      case 'CEREMONY': return User;
      default: return CheckCircle;
    }
  };

  const MilestoneIcon = getMilestoneIcon();

  // Handle completion with haptic feedback
  const handleComplete = () => {
    if (nextMilestone) {
      // Haptic feedback for completion
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
      onTaskComplete(nextMilestone.id);
    }
  };

  // Generate contextual message based on situation
  const getContextMessage = (): string => {
    if (userState.deceasedLocation === 'OUT_OF_STATE') {
      const location = userState.userLocation || 'home';
      return `Your loved one is out of state. Let's bring them ${location}.`;
    }
    if (!userState.deathPronounced) {
      return 'First, we need to make the death official.';
    }
    if (hasMilestone) {
      return 'Here is your next step. Take your time.';
    }
    return 'You are doing wonderfully. Let me know when you are ready.';
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-black' : 'bg-stone-50'}`}>
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {hasMilestone && nextMilestone ? (
            <motion.div
              key={nextMilestone.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border-2 rounded-3xl p-8 shadow-lg`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}
                >
                  <MilestoneIcon className={`w-7 h-7 ${isDark ? 'text-white' : 'text-stone-700'}`} />
                </motion.div>
                <div>
                  <p className={`text-sm font-medium uppercase tracking-wide ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Next Step
                  </p>
                  <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    One thing at a time
                  </p>
                </div>
              </div>

              {/* Milestone Title */}
              <h1 className={`text-3xl font-light mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                {nextMilestone.title}
              </h1>

              {/* Description */}
              <p className={`text-lg mb-8 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                {nextMilestone.description}
              </p>

              {/* Priority Badge */}
              {nextMilestone.priority === 'URGENT' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-current"
                  />
                  <span className="text-sm font-medium">Needs attention soon</span>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Haptic feedback
                    if ('vibrate' in navigator) {
                      navigator.vibrate(30);
                    }
                    onTaskView?.(nextMilestone.id);
                  }}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-200 ${
                    isDark
                      ? 'bg-white text-black hover:bg-stone-200'
                      : 'bg-black text-white hover:bg-stone-800'
                  }`}
                >
                  <span className="text-lg font-medium">I'll do this now</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                {onNextStep && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNextStep}
                    className={`w-full px-6 py-4 rounded-2xl transition-all duration-200 ${
                      isDark
                        ? 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span className="text-lg">Show me more options</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Haptic feedback
                    if ('vibrate' in navigator) {
                      navigator.vibrate(20);
                    }
                    handleComplete();
                  }}
                  className={`w-full px-6 py-3 rounded-2xl transition-all duration-200 ${
                    isDark
                      ? 'text-stone-400 hover:text-stone-200'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <span className="text-sm">I've completed this step</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // No pending milestones - completion state
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border-2 rounded-3xl p-8 shadow-lg text-center`}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}
              >
                <CheckCircle className={`w-10 h-10 ${isDark ? 'text-white' : 'text-stone-700'}`} />
              </motion.div>
              <h1 className={`text-3xl font-light mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                You're doing wonderfully
              </h1>
              <p className={`text-lg mb-8 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                All immediate steps are complete. Take a breath.
              </p>
              {onNextStep && (
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onNextStep}
                  className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-200 ${
                    isDark
                      ? 'bg-white text-black hover:bg-stone-200'
                      : 'bg-black text-white hover:bg-stone-800'
                  }`}
                >
                  <span className="text-lg font-medium">See full overview</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Message - Below the card */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className={`text-center mt-8 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}
        >
          {getContextMessage()}
        </motion.p>
      </div>
    </div>
  );
};

export default SingleFocusMilestone;
