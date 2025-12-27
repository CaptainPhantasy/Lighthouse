import React from 'react';
import { Tabs } from './ui/tabs';
import { BentoGrid, BentoCard } from './ui/bento-grid';
import { FloatingDock } from './ui/floating-dock';
import { ColourfulText } from './ui/colourful-text';
import { Sparkles, FileText, HeartHandshake, Users, Bell, Compass, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import SmartVault from './SmartVault';
import CompassionateAssistant from './CompassionateAssistant';
import DelegationHub from './DelegationHub';
import { UserState, Task, DocumentScan } from '../types';

interface AceternityDashboardProps {
  userState: UserState;
  tasks: Task[];
  documentScans: DocumentScan[];
}

const AceternityDashboard: React.FC<AceternityDashboardProps> = ({
  userState,
  tasks,
  documentScans,
}) => {
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const dashboardTabs = [
    {
      title: 'Overview',
      value: 'overview',
      content: (
        <div className="w-full overflow-hidden">
          {/* Welcome Section with ColourfulText */}
          <div className="mb-10 px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome back, <ColourfulText text={userState.name || 'Friend'} />
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              Your compassionate guide through this journey
            </p>
          </div>

          {/* BentoGrid Overview - Using default Aceternity styling */}
          <BentoGrid>
            <BentoCard
              title="Progress"
              description={`${progress}% complete`}
              className="col-span-3 row-span-2"
              header={
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
                  <span className="text-5xl font-bold">{progress}%</span>
                </div>
              }
              icon={<Clock className="w-6 h-6" />}
            />
            <BentoCard
              title="Tasks Done"
              description={`${completedTasks} of ${tasks.length}`}
              className="col-span-1"
              icon={<CheckCircle2 className="w-6 h-6" />}
            />
            <BentoCard
              title="Pending"
              description={`${pendingTasks} remaining`}
              className="col-span-1"
              icon={<Clock className="w-6 h-6" />}
            />
            <BentoCard
              title="Documents"
              description={`${documentScans.length} scanned`}
              className="col-span-1"
              icon={<FileText className="w-6 h-6" />}
            />
            <BentoCard
              title="AI Guide"
              description="Get help anytime"
              className="col-span-2"
              icon={<Sparkles className="w-6 h-6" />}
            />
            <BentoCard
              title="Support Circle"
              description="Family & friends"
              className="col-span-1"
              icon={<Users className="w-6 h-6" />}
            />
          </BentoGrid>
        </div>
      ),
    },
    {
      title: 'Tasks',
      value: 'tasks',
      content: <DelegationHub userState={userState} tasks={tasks} />,
    },
    {
      title: 'Vault',
      value: 'vault',
      content: (
        <SmartVault
          onTaskCreated={() => {}}
          onDocumentScan={() => {}}
          onDocumentFinding={() => {}}
        />
      ),
    },
    {
      title: 'Guide',
      value: 'guide',
      content: <CompassionateAssistant userState={userState} />,
    },
  ];

  // FloatingDock items
  const dockItems = [
    {
      title: 'Overview',
      icon: <Compass className="w-6 h-6" />,
      onClick: () => {},
    },
    {
      title: 'Tasks',
      icon: <CheckCircle2 className="w-6 h-6" />,
      onClick: () => {},
    },
    {
      title: 'Vault',
      icon: <FileText className="w-6 h-6" />,
      onClick: () => {},
    },
    {
      title: 'Guide',
      icon: <Sparkles className="w-6 h-6" />,
      onClick: () => {},
    },
    {
      title: 'Support',
      icon: <Users className="w-6 h-6" />,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center">
              <Compass className="w-5 h-5 text-white dark:text-black" />
            </div>
            <h1 className="text-xl font-bold">
              <ColourfulText text="Lighthouse" />
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="pt-24 pb-32 px-4">
        <Tabs
          tabs={dashboardTabs}
          containerClassName="max-w-7xl mx-auto mb-8"
          tabClassName="bg-neutral-100 dark:bg-neutral-900"
          activeTabClassName="bg-neutral-900 dark:bg-neutral-100"
        />
      </main>

      {/* FloatingDock for Mobile Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <FloatingDock
          items={dockItems}
          mobileClassName="bg-neutral-200/50 dark:bg-neutral-800/50 backdrop-blur-xl border border-neutral-300 dark:border-neutral-700"
        />
      </div>
    </div>
  );
};

export default AceternityDashboard;
