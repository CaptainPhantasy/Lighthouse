import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, DocumentScan, Task, ServicePreference } from '../types';
import { TEXTS } from '../constants';
import SmartVault from './SmartVault';
import CompassionateAssistant from './CompassionateAssistant';
import DelegationHub from './DelegationHub';
import TransportNavigator from './TransportNavigator';
import ResolutionReport from './ResolutionReport';
import SupportCircleDashboard from './SupportCircleDashboard';
import { BentoGrid, BentoCard } from './ui/bento-grid';
import { FloatingDock } from './ui/floating-dock';
import { Tabs } from './ui/tabs';
import ColourfulText from './ui/colourful-text';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, FileText, HeartHandshake, AlertTriangle, Plane, Award, Users, Bell, Sparkles, Compass, CheckCircle2, Clock, TrendingUp, ArrowRight, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  userState: UserState;
  tasks: Task[];
  documentScans: DocumentScan[];
  onTaskCreated?: (task: Task) => void;
  onDocumentScan?: (document: DocumentScan) => void;
  onServicePreferenceChange?: (preference: ServicePreference) => void;
  onServiceOutlineChange?: (outline: string) => void;
}

// Toast notification
const ToastNotification: React.FC<{
  message: string;
  type?: 'info' | 'success' | 'warning';
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
}> = ({ message, type = 'info', onClose, actionLabel, onAction, isDark = false }) => {
  const colors = {
    info: isDark
      ? 'bg-stone-900 border-stone-700 text-white'
      : 'bg-white border-stone-300 text-black',
    success: isDark
      ? 'bg-stone-800 border-stone-700 text-white'
      : 'bg-stone-100 border-stone-300 text-black',
    warning: isDark
      ? 'bg-stone-800 border-stone-700 text-white'
      : 'bg-stone-100 border-stone-300 text-black',
  };
  const iconColors = {
    info: isDark ? 'bg-white text-black' : 'bg-black text-white',
    success: isDark ? 'bg-stone-600 text-white' : 'bg-stone-800 text-white',
    warning: isDark ? 'bg-stone-600 text-white' : 'bg-stone-800 text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed top-6 right-6 z-50 rounded-2xl border-2 p-4 shadow-2xl ${colors[type]}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[type]}`}>
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{message}</p>
          {actionLabel && onAction && (
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              className="mt-2 text-xs font-bold underline decoration-2 underline-offset-2 hover:no-underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-stone-200 hover:bg-stone-300'}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Bento Grid Overview Component
const BentoGridOverview: React.FC<{
  tasks: Task[];
  documentScans: DocumentScan[];
  userState: UserState;
  onTabChange: (tab: 'TASKS' | 'VAULT' | 'ASSIST' | 'TRANSPORT' | 'RESOLUTION' | 'SUPPORT' | 'OVERVIEW') => void;
  isDark?: boolean;
}> = ({ tasks, documentScans, userState, onTabChange, isDark = false }) => {
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const hasTasks = tasks.length > 0;

  const isTransportPriority = userState.deceasedLocation === 'OUT_OF_STATE' && !userState.deathPronounced;

  let cardIndex = 0;
  const getNextIndex = () => cardIndex++;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border rounded-2xl p-6 shadow-sm`}
      >
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : ''}`}>
          Welcome back, <ColourfulText text={userState.name || 'Friend'} />
        </h2>
        <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
          {isTransportPriority
            ? "You have an urgent task requiring attention. Let's take this one step at a time."
            : !hasTasks
            ? "Let's begin by creating your restoration plan. Take your time—we'll guide you through each step."
            : progress === 100
            ? "You've completed all your tasks. You're doing amazing."
            : "You're making progress. Let's continue together."}
        </p>
      </motion.div>

      {/* Bento Grid */}
      <BentoGrid cols={3}>
        {/* Progress Card - Large */}
        <BentoCard
          colSpan={2}
          type="primary"
          className="min-h-[160px]"
          index={getNextIndex()}
          isDark={isDark}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">Overall Progress</p>
              <p className="text-4xl font-bold">{hasTasks ? `${progress}%` : '—'}</p>
              <p className="text-sm opacity-70 mt-2">
                {hasTasks
                  ? `${completedTasks} of ${tasks.length} tasks completed`
                  : 'Start by adding your first task'}
              </p>
            </div>
            {hasTasks && (
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="opacity-20"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${251.2 * (progress / 100)} 251.2`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {progress === 100 ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <TrendingUp className="w-10 h-10" />
                  )}
                </div>
              </div>
            )}
          </div>
        </BentoCard>

        {/* Quick Actions Card */}
        <BentoCard
          type={isDark ? "primary" : "default"}
          className="min-h-[160px]"
          index={getNextIndex()}
          isDark={isDark}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <motion.button
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange('ASSIST')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-stone-800 hover:bg-stone-700' : 'bg-stone-100 hover:bg-stone-200'}`}
            >
              <span>Ask AI Guide</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange('VAULT')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-stone-800 hover:bg-stone-700' : 'bg-stone-100 hover:bg-stone-200'}`}
            >
              <span>Scan Document</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </BentoCard>

        {/* Pending Tasks Card */}
        <BentoCard
          type={pendingTasks > 0 ? "warning" : "success"}
          onClick={() => onTabChange('TASKS')}
          index={getNextIndex()}
          isDark={isDark}
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-70">Pending Tasks</p>
              <p className="text-2xl font-bold">{pendingTasks}</p>
            </div>
            {pendingTasks > 0 && (
              <ArrowRight className="w-4 h-4 ml-auto" />
            )}
          </div>
        </BentoCard>

        {/* High Priority Card */}
        {highPriorityTasks > 0 && (
          <BentoCard
            type="warning"
            onClick={() => onTabChange('TASKS')}
            index={getNextIndex()}
            isDark={isDark}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-70">High Priority</p>
                <p className="text-2xl font-bold">{highPriorityTasks}</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </div>
          </BentoCard>
        )}

        {/* Documents Card */}
        <BentoCard
          type="default"
          onClick={() => onTabChange('VAULT')}
          index={getNextIndex()}
          isDark={isDark}
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-70">Documents</p>
              <p className="text-2xl font-bold">{documentScans.length}</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </div>
        </BentoCard>

        {/* Support Card */}
        <BentoCard
          type="primary"
          rowSpan={2}
          onClick={() => onTabChange('SUPPORT')}
          index={getNextIndex()}
          isDark={isDark}
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Support Circle</h3>
          </div>
          <p className="text-sm opacity-70 mb-4">
            Your loved ones are here to help. Delegate tasks when you need support.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>View Support</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </BentoCard>

        {/* Transport Alert Card */}
        {isTransportPriority && (
          <BentoCard
            colSpan={2}
            type="warning"
            onClick={() => onTabChange('TRANSPORT')}
            index={getNextIndex()}
            isDark={isDark}
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`}
              >
                <Plane className="w-7 h-7" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm opacity-70">Urgent Attention Needed</p>
                <p className="font-bold">Body Transport Required</p>
                <p className="text-xs opacity-60 mt-1">
                  Your loved one is out of state. We've prepared a guide to help.
                </p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
          </BentoCard>
        )}

        {/* Resolution Card */}
        {hasTasks && progress === 100 && (
          <BentoCard
            colSpan={2}
            type="success"
            onClick={() => onTabChange('RESOLUTION')}
            index={getNextIndex()}
            isDark={isDark}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`}>
                <Award className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-70">All Tasks Complete</p>
                <p className="font-bold">View Resolution Report</p>
                <p className="text-xs opacity-60 mt-1">
                  You've completed your restoration plan. See your journey.
                </p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
          </BentoCard>
        )}
      </BentoGrid>
    </div>
  );
};

// Navigation sidebar item
const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  notification?: boolean;
  isDark?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, notification, isDark = false }) => (
  <motion.button
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? isDark
          ? 'bg-white text-black font-medium'
          : 'bg-black text-white font-medium'
        : isDark
          ? 'hover:bg-stone-800 text-stone-300'
          : 'hover:bg-stone-200 text-stone-600'
    }`}
  >
    <Icon className="w-5 h-5" strokeWidth={2} />
    <span>{label}</span>
    {notification && (
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`ml-auto w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`}
      />
    )}
  </motion.button>
);

const Dashboard: React.FC<DashboardProps> = ({
  userState,
  tasks,
  documentScans,
  onTaskCreated,
  onDocumentScan,
  onServicePreferenceChange,
  onServiceOutlineChange,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TASKS' | 'VAULT' | 'ASSIST' | 'TRANSPORT' | 'RESOLUTION' | 'SUPPORT'>('OVERVIEW');
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'warning'; actionLabel?: string; onAction?: () => void } | null>(null);

  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === 'COMPLETED');

  const showToast = (message: string, type?: 'info' | 'success' | 'warning', actionLabel?: string, onAction?: () => void) => {
    setToast({ message, type, actionLabel, onAction });
    setTimeout(() => setToast(null), 8000);
  };

  const isMinimalistMode = userState.brainFogLevel >= 4;

  const visibleTabs = isMinimalistMode
    ? ['OVERVIEW', 'TASKS', 'ASSIST', 'SUPPORT'] as const
    : ['OVERVIEW', 'TASKS', 'VAULT', 'ASSIST', 'TRANSPORT', 'RESOLUTION', 'SUPPORT'] as const;

  const allNavItems = [
    { id: 'OVERVIEW' as const, icon: Sparkles, label: 'Overview' },
    { id: 'TASKS' as const, icon: LayoutDashboard, label: 'Plan' },
    { id: 'VAULT' as const, icon: FileText, label: 'Vault' },
    { id: 'ASSIST' as const, icon: HeartHandshake, label: 'Guide' },
    { id: 'TRANSPORT' as const, icon: Plane, label: 'Transport' },
    { id: 'RESOLUTION' as const, icon: Award, label: 'Complete' },
    { id: 'SUPPORT' as const, icon: Users, label: 'Support' },
  ];

  const navItems = allNavItems.filter(item => visibleTabs.includes(item.id as any));

  const isTransportPriority = userState.deceasedLocation === 'OUT_OF_STATE' && !userState.deathPronounced;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-stone-100'}`}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => setToast(null)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* Desktop Layout - 3 Columns */}
      <div className="hidden lg:flex">
        {/* Left Sidebar - Navigation */}
        <aside className={`w-64 fixed left-0 top-0 h-screen ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border-r p-6 flex flex-col`}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}><ColourfulText text={TEXTS.app_name} /></h1>
              {userState.name && <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>For {userState.name}</p>}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isHighlighted = isTransportPriority && item.id === 'TASKS';
              return (
                <div key={item.id} className="relative">
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    onClick={() => setActiveTab(item.id)}
                    notification={isHighlighted}
                    isDark={isDark}
                  />
                </div>
              );
            })}
          </nav>

          {/* Brain Fog Indicator & Theme Toggle */}
          <div className="mt-auto pt-4 border-t border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
              <div className="text-2xl">{userState.brainFogLevel > 3 ? '☁️' : '☀️'}</div>
              <div className="text-sm">
                <p className="font-medium">Mode</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{userState.brainFogLevel > 3 ? 'Calm' : 'Clear'}</p>
              </div>
            </div>
            {/* Theme Toggle */}
            <div className="flex items-center justify-center">
              <ThemeToggle variant="floating" />
            </div>
          </div>
        </aside>

        {/* Center - Main Content */}
        <main className="flex-1 ml-64 mr-80 p-6 pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Priority Alert for Transport */}
            {isTransportPriority && activeTab !== 'TASKS' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-black text-white border-2 border-stone-800 rounded-2xl p-5 shadow-lg flex items-center gap-4"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0"
                >
                  <AlertTriangle className="w-6 h-6" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-bold">Body Transport Requires Attention</h3>
                  <p className="text-sm opacity-80">Your loved one is out of state. We've prepared a guide to help.</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('TASKS')}
                  className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  View Guide
                </motion.button>
              </motion.div>
            )}

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {isTransportPriority && activeTab === 'TASKS' ? (
                  <div className="bg-black text-white border-2 border-stone-800 rounded-2xl p-6">
                    <TransportNavigator userState={userState} />
                  </div>
                ) : activeTab === 'OVERVIEW' ? (
                  <BentoGridOverview
                    tasks={tasks}
                    documentScans={documentScans}
                    userState={userState}
                    onTabChange={setActiveTab}
                    isDark={isDark}
                  />
                ) : (
                  <>
                    {activeTab === 'TASKS' && <DelegationHub userState={userState} tasks={tasks} />}
                    {activeTab === 'VAULT' && (
                      <SmartVault
                        onTaskCreated={onTaskCreated}
                        onDocumentScan={onDocumentScan}
                        onDocumentFinding={(finding) => showToast(
                          finding.message,
                          'success',
                          'View in Guide',
                          () => setActiveTab('ASSIST')
                        )}
                      />
                    )}
                    {activeTab === 'ASSIST' && (
                      <CompassionateAssistant
                        userState={userState}
                        documentScans={documentScans}
                        onServicePreferenceChange={onServicePreferenceChange}
                        onServiceOutlineChange={onServiceOutlineChange}
                      />
                    )}
                    {activeTab === 'TRANSPORT' && (
                      <div className="bg-white border border-stone-200 rounded-2xl p-6">
                        <TransportNavigator userState={userState} />
                      </div>
                    )}
                    {activeTab === 'RESOLUTION' && (
                      <ResolutionReport
                        userState={userState}
                        tasks={tasks}
                        documentScans={documentScans}
                        serviceOutline={userState.serviceOutline}
                      />
                    )}
                    {activeTab === 'SUPPORT' && (
                      <SupportCircleDashboard
                        userState={userState}
                        tasks={tasks}
                        supportMessages={['Thinking of you during this difficult time.', 'Let us know how we can help.']}
                      />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Right Panel - AI Assistant */}
        <aside className={`w-80 fixed right-0 top-0 h-screen ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border-l p-6`}>
          <div className={`flex items-center gap-2 mb-6 ${isDark ? 'text-white' : ''}`}>
            <Sparkles className="w-5 h-5" />
            <h2 className="font-bold">Lighthouse AI</h2>
          </div>
          <div className={`rounded-2xl p-4 mb-6 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
            <p className={`text-sm mb-4 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              I'm your compassionate assistant. I can help guide you through this difficult time.
            </p>
            <div className="space-y-2">
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('ASSIST')}
                className={`w-full text-left px-4 py-2 ${isDark ? 'bg-stone-700 hover:bg-stone-600 border-stone-600' : 'bg-white hover:bg-stone-50 border-stone-200'} rounded-xl text-sm font-medium border transition-all`}
              >
                Open Assistant
              </motion.button>
            </div>
          </div>

          {/* Quick Tasks Summary */}
          <div>
            <h3 className={`text-sm font-bold mb-3 uppercase tracking-wide ${isDark ? 'text-stone-400' : ''}`}>Quick Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Total</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                <p className={`text-xs uppercase ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Done</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'COMPLETED').length}</p>
              </div>
            </div>
            {allTasksCompleted && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('RESOLUTION')}
                className={`w-full mt-4 py-3 rounded-xl font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
              >
                View Resolution →
              </motion.button>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Layout - Single Column with Bottom Nav */}
      <div className="lg:hidden">
        {/* Header */}
        <header className={`sticky top-0 z-40 px-6 py-4 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} border-b`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center`}>
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : ''}`}><ColourfulText text={TEXTS.app_name} /></h1>
                {userState.name && <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>For {userState.name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100'}`}>
                {userState.brainFogLevel > 3 ? '☁️ Calm' : '☀️ Clear'}
              </div>
              <ThemeToggle variant="minimal" />
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="max-w-3xl mx-auto p-4 pb-24">
          {/* Priority Alert */}
          {isTransportPriority && activeTab !== 'TASKS' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-black text-white border-2 border-stone-800 rounded-2xl p-5 shadow-lg flex items-center gap-4"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0"
              >
                <AlertTriangle className="w-6 h-6" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">Body Transport Requires Attention</h3>
                <p className="text-xs opacity-80 mt-1">Your loved one is out of state.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('TASKS')}
                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl"
              >
                View
              </motion.button>
            </motion.div>
          )}

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {isTransportPriority && activeTab === 'TASKS' ? (
                <div className="bg-black text-white border-2 border-stone-800 rounded-2xl p-6">
                  <TransportNavigator userState={userState} />
                </div>
              ) : activeTab === 'OVERVIEW' ? (
                <BentoGridOverview
                  tasks={tasks}
                  documentScans={documentScans}
                  userState={userState}
                  onTabChange={setActiveTab}
                  isDark={isDark}
                />
              ) : (
                <>
                  {activeTab === 'TASKS' && <DelegationHub userState={userState} tasks={tasks} />}
                  {activeTab === 'VAULT' && (
                    <SmartVault
                      onTaskCreated={onTaskCreated}
                      onDocumentScan={onDocumentScan}
                      onDocumentFinding={(finding) => showToast(finding.message, 'success', 'View', () => setActiveTab('ASSIST'))}
                    />
                  )}
                  {activeTab === 'ASSIST' && (
                    <CompassionateAssistant
                      userState={userState}
                      documentScans={documentScans}
                      onServicePreferenceChange={onServicePreferenceChange}
                      onServiceOutlineChange={onServiceOutlineChange}
                    />
                  )}
                  {activeTab === 'TRANSPORT' && (
                    <div className="bg-white border border-stone-200 rounded-2xl p-6">
                      <TransportNavigator userState={userState} />
                    </div>
                  )}
                  {activeTab === 'RESOLUTION' && (
                    <ResolutionReport
                      userState={userState}
                      tasks={tasks}
                      documentScans={documentScans}
                      serviceOutline={userState.serviceOutline}
                    />
                  )}
                  {activeTab === 'SUPPORT' && (
                    <SupportCircleDashboard
                      userState={userState}
                      tasks={tasks}
                      supportMessages={['Thinking of you.', 'Let us know how we can help.']}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* FloatingDock Navigation */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
          <FloatingDock
            items={navItems.map((item) => ({
              title: item.label,
              icon: <item.icon className="w-5 h-5" strokeWidth={2} />,
              onClick: () => setActiveTab(item.id),
            }))}
            mobileClassName={`${isDark ? 'bg-stone-900/90 border-stone-700' : 'bg-white/90 border-stone-200'} backdrop-blur-xl border`}
          />
        </div>
      </div>

      {/* Completion Banner */}
      {allTasksCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-6 right-6 lg:left-auto lg:right-6 lg:w-80 z-30"
        >
          <div className={`${isDark ? 'bg-white text-black' : 'bg-black text-white'} rounded-2xl p-5 shadow-xl`}>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="font-bold">Ready for Next Step</p>
                <button
                  onClick={() => setActiveTab('RESOLUTION')}
                  className="text-sm opacity-80 hover:opacity-100 underline"
                >
                  View Resolution Report →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
