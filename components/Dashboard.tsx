import React, { useState } from 'react';
import { UserState, DocumentScan, Task, ServicePreference } from '../types';
import { TEXTS } from '../constants';
import SmartVault from './SmartVault';
import CompassionateAssistant from './CompassionateAssistant';
import DelegationHub from './DelegationHub';
import TransportNavigator from './TransportNavigator';
import ResolutionReport from './ResolutionReport';
import SupportCircleDashboard from './SupportCircleDashboard';
import { LayoutDashboard, FileText, HeartHandshake, AlertTriangle, Plane, Award, Users } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  tasks: Task[];
  documentScans: DocumentScan[];
  onTaskCreated?: (task: Task) => void;
  onDocumentScan?: (document: DocumentScan) => void;
  onServicePreferenceChange?: (preference: ServicePreference) => void;
  onServiceOutlineChange?: (outline: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, tasks, documentScans, onTaskCreated, onDocumentScan, onServicePreferenceChange, onServiceOutlineChange }) => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'VAULT' | 'ASSIST' | 'TRANSPORT' | 'RESOLUTION' | 'SUPPORT'>('TASKS');

  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-lg font-serif font-medium text-slate-800">
             {userState.deceasedLocation === 'OUT_OF_STATE' && activeTab === 'TASKS' ? 'Transport Navigator' : TEXTS.app_name}
           </h1>
           {userState.name && <p className="text-xs text-slate-500">For {userState.name}</p>}
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            {userState.brainFogLevel > 3 ? '☁️' : '☀️'}
        </div>
      </header>

      {/* Priority Banner for Out-of-State Deceased */}
      {userState.deceasedLocation === 'OUT_OF_STATE' && activeTab !== 'TASKS' && (
        <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-800 text-sm">Body Transport Navigator</h3>
            <p className="text-xs text-amber-600 mt-0.5">
              Your loved one is out of state. Tap the Plan tab for transport guidance.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('TASKS')}
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            View Guide
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 pt-6">
        {/* Primary Crisis: Body Transport for Out-of-State */}
        {userState.deceasedLocation === 'OUT_OF_STATE' && !userState.deathPronounced && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <h3 className="font-medium text-amber-900">Primary Crisis</h3>
              </div>
              <TransportNavigator userState={userState} />
            </div>
          </div>
        )}

        {userState.deceasedLocation === 'OUT_OF_STATE' && activeTab === 'TASKS' ? (
          <TransportNavigator userState={userState} />
        ) : (
          <>
            {activeTab === 'TASKS' && <DelegationHub userState={userState} tasks={tasks} />}
            {activeTab === 'VAULT' && <SmartVault onTaskCreated={onTaskCreated} onDocumentScan={onDocumentScan} />}
            {activeTab === 'ASSIST' && (
              <CompassionateAssistant
                userState={userState}
                documentScans={documentScans}
                onServicePreferenceChange={onServicePreferenceChange}
                onServiceOutlineChange={onServiceOutlineChange}
              />
            )}
            {activeTab === 'TRANSPORT' && <TransportNavigator userState={userState} />}
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
      </main>

      {/* Bottom Nav */}
      {/* Show Resolution tab only when all tasks are completed */}
      {allTasksCompleted && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">All tasks completed! View Resolution Report</span>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
            onClick={() => setActiveTab('TASKS')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'TASKS' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Plan</span>
        </button>
        <button
            onClick={() => setActiveTab('VAULT')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'VAULT' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Vault</span>
        </button>
        <button
            onClick={() => setActiveTab('ASSIST')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ASSIST' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <HeartHandshake className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Guide</span>
        </button>
        <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'SUPPORT' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">Support</span>
        </button>
        {allTasksCompleted && (
          <button
              onClick={() => setActiveTab('RESOLUTION')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'RESOLUTION' ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
              <Award className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-wide">Complete</span>
          </button>
        )}
      </nav>
    </div>
  );
};

export default Dashboard;