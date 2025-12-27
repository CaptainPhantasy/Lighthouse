import React, { useState, useEffect } from 'react';
import IntakeFlow from './components/IntakeFlow';
import TransitionView from './components/TransitionView';
import Dashboard from './components/Dashboard';
import { AppView, UserState, DocumentScan, Task, ServicePreference } from './types';
import { INITIAL_USER_STATE } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.INTAKE);
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [documentScans, setDocumentScans] = useState<DocumentScan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('lighthouse_view');
    const savedUserState = localStorage.getItem('userState');
    const savedDocumentScans = localStorage.getItem('documentScans');
    const savedTasks = localStorage.getItem('tasks');
    const savedServiceOutline = localStorage.getItem('serviceOutline');

    if (savedView) {
      setView(savedView as AppView);
    }

    if (savedUserState) {
      const parsed = JSON.parse(savedUserState);
      // Ensure servicePreference is set
      if (!parsed.servicePreference) {
        parsed.servicePreference = 'SECULAR';
      }
      setUserState(parsed);
    }

    if (savedDocumentScans) {
      setDocumentScans(JSON.parse(savedDocumentScans));
    }

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save user state to localStorage when it changes
  useEffect(() => {
    if (userState.name) { // Only save after intake is started
      localStorage.setItem('userState', JSON.stringify(userState));
    }
  }, [userState]);

  // Save document scans and tasks to localStorage
  useEffect(() => {
    if (documentScans.length > 0) {
      localStorage.setItem('documentScans', JSON.stringify(documentScans));
    }
  }, [documentScans]);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleIntakeComplete = (data: UserState) => {
    setUserState(data);
    setView(AppView.TRANSITION);
    localStorage.setItem('lighthouse_view', AppView.TRANSITION);
  };

  const handleTransitionComplete = () => {
    setView(AppView.DASHBOARD);
    localStorage.setItem('lighthouse_view', AppView.DASHBOARD);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  };

  const handleDocumentScan = (document: DocumentScan) => {
    setDocumentScans(prev => [...prev, document]);
  };

  const handleServicePreferenceChange = (preference: ServicePreference) => {
    setUserState(prev => ({ ...prev, servicePreference: preference }));
  };

  const handleServiceOutlineChange = (outline: string) => {
    setUserState(prev => ({ ...prev, serviceOutline: outline }));
    // Also save to localStorage
    localStorage.setItem('serviceOutline', outline);
  };

  return (
    <>
      {view === AppView.INTAKE ? (
        <IntakeFlow onComplete={handleIntakeComplete} />
      ) : view === AppView.TRANSITION ? (
        <TransitionView
          userState={userState}
          onComplete={handleTransitionComplete}
        />
      ) : (
        <Dashboard
          userState={userState}
          tasks={tasks}
          documentScans={documentScans}
          onTaskCreated={handleTaskCreated}
          onDocumentScan={handleDocumentScan}
          onServicePreferenceChange={handleServicePreferenceChange}
          onServiceOutlineChange={handleServiceOutlineChange}
        />
      )}
    </>
  );
};

export default App;