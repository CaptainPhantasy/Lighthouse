/**
 * SentientDashboard - Life Command Center
 *
 * The main dashboard for proactive users planning their legacy.
 * Organized as a "Life Command Center" with two core modules:
 * - Life Architecture: Task list for proactive organization
 * - The Biographer: AI Chat interface for legacy curation
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, BookOpen, FileText, Mail, Plus, MessageSquare, CheckCircle, Circle, Clock, LogOut, Mic } from 'lucide-react';
import { SentientUserState, LegacyTask, RecordedMemory } from '../types';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useVoicePreferences } from '../contexts/VoicePreferenceContext';
import { VoiceToggle } from './voice';
import { useTheme } from '../contexts/ThemeContext';

interface SentientDashboardProps {
  userState: SentientUserState;
  onTaskAdd?: (task: LegacyTask) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<LegacyTask>) => void;
  onMemoryAdd?: (memory: RecordedMemory) => void;
  onStartOver?: () => void;
}

type Tab = 'architecture' | 'biographer';

// Sample biographer prompts
const BIOGRAPHER_PROMPTS = [
  "Tell me about the house you grew up in.",
  "What was your first job like?",
  "Describe a person who changed your life.",
  "What's a lesson you learned the hard way?",
  "What traditions do you hope to pass down?",
];

const SentientDashboard: React.FC<SentientDashboardProps> = ({
  userState,
  onTaskAdd,
  onTaskUpdate,
  onMemoryAdd,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('architecture');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [biographerInput, setBiographerInput] = useState('');
  const [isBiographerThinking, setIsBiographerThinking] = useState(false);

  // Global voice preference
  const { voiceEnabled } = useVoicePreferences();

  // Gemini-powered speech to text
  const taskVoice = useSpeechToText();
  const biographerVoice = useSpeechToText();

  // Gemini-powered text to speech
  const { speak: speakText, isSupported: ttsSupported } = useTextToSpeech();

  // Sync voice transcripts with inputs
  useEffect(() => {
    if (taskVoice.isListening && taskVoice.transcript) {
      setNewTaskTitle(taskVoice.transcript);
    }
  }, [taskVoice.transcript, taskVoice.isListening]);

  useEffect(() => {
    if (biographerVoice.isListening && biographerVoice.transcript) {
      setBiographerInput(biographerVoice.transcript);
    }
  }, [biographerVoice.transcript, biographerVoice.isListening]);

  // Voice confirmation helper
  const speakConfirmation = useCallback(async (text: string) => {
    if (voiceEnabled && ttsSupported) {
      await speakText(text);
    }
  }, [voiceEnabled, ttsSupported, speakText]);

  // Load/save from localStorage with sentient_ prefix
  useEffect(() => {
    const saved = localStorage.getItem('sentient_user_state');
    if (saved) {
      // Merge with props if needed
    }
  }, []);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: LegacyTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      category: 'PERSONAL',
      status: 'PENDING',
      priority: 'NORMAL',
    };

    onTaskAdd?.(newTask);
    setNewTaskTitle('');

    // Update local storage
    const updated = {
      ...userState,
      tasks: [...userState.tasks, newTask],
    };
    localStorage.setItem('sentient_user_state', JSON.stringify(updated));

    // Voice confirmation
    speakConfirmation('Task added successfully.');
  };

  const handleTaskToggle = (taskId: string) => {
    const task = userState.tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    onTaskUpdate?.(taskId, { status: updatedStatus });

    const updated = {
      ...userState,
      tasks: userState.tasks.map(t =>
        t.id === taskId ? { ...t, status: updatedStatus } : t
      ),
    };
    localStorage.setItem('sentient_user_state', JSON.stringify(updated));

    // Voice confirmation
    if (updatedStatus === 'COMPLETED') {
      speakConfirmation('Task completed. Well done.');
    } else {
      speakConfirmation('Task marked as pending.');
    }
  };

  const handleBiographerSubmit = () => {
    if (!biographerInput.trim()) return;

    setIsBiographerThinking(true);

    // Simulate biographer response
    setTimeout(() => {
      const memory: RecordedMemory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: biographerInput,
        transcript: `[User's response to: "${biographerInput}"]`,
        tags: ['biographer-session'],
      };

      onMemoryAdd?.(memory);

      const updated = {
        ...userState,
        memories: [...userState.memories, memory],
      };
      localStorage.setItem('sentient_user_state', JSON.stringify(updated));

      setBiographerInput('');
      setIsBiographerThinking(false);

      // Voice confirmation
      speakConfirmation('Your memory has been saved. What else would you like to share?');
    }, 1500);
  };

  const getTaskIcon = (category: string) => {
    switch (category) {
      case 'LEGAL': return FileText;
      case 'FINANCIAL': return Circle;
      case 'DIGITAL': return Clock;
      default: return CheckCircle;
    }
  };

  const pendingTasks = userState.tasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = userState.tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-stone-800 dark:text-stone-200">
                {userState.name}'s Legacy
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Life Command Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice guidance toggle */}
            {ttsSupported && <VoiceToggle />}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (confirm('Return to gateway?')) {
                  localStorage.removeItem('sentient_user_state');
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            <TabButton
              active={activeTab === 'architecture'}
              onClick={() => setActiveTab('architecture')}
              icon={FileText}
              label="Life Architecture"
            />
            <TabButton
              active={activeTab === 'biographer'}
              onClick={() => setActiveTab('biographer')}
              icon={BookOpen}
              label="The Biographer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Life Architecture Tab */}
          {activeTab === 'architecture' && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={FileText} label="Documents" value={userState.documents.length} />
                <StatCard icon={Mail} label="Messages" value={userState.messages.length} />
                <StatCard icon={BookOpen} label="Memories" value={userState.memories.length} />
                <StatCard icon={CheckCircle} label="Completed" value={completedTasks.length} />
              </div>

              {/* Add Task */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200 mb-4">
                  Add to Your Legacy Plan
                </h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="e.g., Upload my will, List password manager..."
                    className="flex-1 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 text-stone-800 dark:text-stone-200"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (taskVoice.isListening) {
                        taskVoice.stopListening();
                      } else {
                        taskVoice.startListening();
                      }
                    }}
                    className={`p-3 rounded-xl transition-colors ${
                      taskVoice.isListening
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                    title={taskVoice.isListening ? 'Stop recording' : 'Voice input'}
                  >
                    <Mic className={`w-5 h-5 ${taskVoice.isListening ? 'animate-pulse' : ''}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="px-6 py-3 bg-black dark:bg-stone-700 hover:bg-stone-800 dark:hover:bg-stone-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </motion.button>
                </div>
              </div>

              {/* Task Lists */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pending Tasks */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    In Progress ({pendingTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingTasks.length === 0 ? (
                      <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                        <Sprout className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No pending tasks</p>
                        <p className="text-xs">Your legacy is just beginning</p>
                      </div>
                    ) : (
                      pendingTasks.map(task => {
                        const Icon = getTaskIcon(task.category);
                        return (
                          <motion.div
                            key={task.id}
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center gap-3 p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:border-stone-300 dark:hover:border-stone-700"
                            onClick={() => handleTaskToggle(task.id)}
                          >
                            <Circle className="w-5 h-5 text-stone-400" />
                            <Icon className="w-4 h-4 text-stone-400" />
                            <span className="flex-1 text-stone-700 dark:text-stone-300">{task.title}</span>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Completed Tasks */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Completed ({completedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {completedTasks.map(task => {
                      const Icon = getTaskIcon(task.category);
                      return (
                        <motion.div
                          key={task.id}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-100 dark:border-stone-800 cursor-pointer opacity-60"
                          onClick={() => handleTaskToggle(task.id)}
                        >
                          <CheckCircle className="w-5 h-5 text-stone-400" />
                          <Icon className="w-4 h-4 text-stone-400" />
                          <span className="flex-1 text-stone-500 dark:text-stone-400 line-through">{task.title}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Biographer Tab */}
          {activeTab === 'biographer' && (
            <motion.div
              key="biographer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">
                      The Biographer
                    </h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      Your personal archivist, ready to listen.
                    </p>
                  </div>
                </div>

                {/* Sample Prompts */}
                <div className="mb-6">
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                    Conversation Starters
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BIOGRAPHER_PROMPTS.map(prompt => (
                      <motion.button
                        key={prompt}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setBiographerInput(prompt)}
                        className="px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="flex gap-3">
                  <textarea
                    value={biographerInput}
                    onChange={(e) => setBiographerInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleBiographerSubmit())}
                    placeholder="Tell me a story, or answer one of the prompts above..."
                    rows={3}
                    className="flex-1 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 text-stone-800 dark:text-stone-200 resize-none"
                  />
                  <div className="flex gap-2 self-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (biographerVoice.isListening) {
                          biographerVoice.stopListening();
                        } else {
                          biographerVoice.startListening();
                        }
                      }}
                      className={`p-3 rounded-xl transition-colors ${
                        biographerVoice.isListening
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                      title={biographerVoice.isListening ? 'Stop recording' : 'Voice input'}
                    >
                      <Mic className={`w-5 h-5 ${biographerVoice.isListening ? 'animate-pulse' : ''}`} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBiographerSubmit}
                      disabled={!biographerInput.trim() || isBiographerThinking}
                      className="px-4 py-3 bg-black dark:bg-stone-700 hover:bg-stone-800 dark:hover:bg-stone-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {isBiographerThinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-sm"
                  >
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Recording your story...
                    </motion.span>
                  </motion.div>
                )}
              </div>

              {/* Memories List */}
              {userState.memories.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">
                    Recorded Memories ({userState.memories.length})
                  </h3>
                  {userState.memories.map(memory => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800"
                    >
                      <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
                        {memory.prompt}
                      </p>
                      <p className="text-stone-700 dark:text-stone-300">
                        {memory.transcript}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
        : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </motion.button>
);

// Stat Card Component
const StatCard: React.FC<{
  icon: typeof FileText;
  label: string;
  value: number;
}> = ({ icon: Icon, label, value }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-800"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <Icon className="w-5 h-5 text-stone-500 dark:text-stone-400" />
      </div>
      <div>
        <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">{value}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
      </div>
    </div>
  </motion.div>
);

export default SentientDashboard;
