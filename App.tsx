import React, { useState, useEffect } from 'react';
import IntakeFlow from './components/IntakeFlow';
import TransitionView from './components/TransitionView';
import Dashboard from './components/Dashboard';
import SplashScreen from './components/SplashScreen';
import VolunteerPage from './components/VolunteerPage';
import { AppView, UserState, DocumentScan, Task, ServicePreference } from './types';
import { INITIAL_USER_STATE } from './constants';
import { isEncrypted, decryptObject, encryptObject, sanitizeData } from './utils/encryption';
import { ENCRYPTION_PASSWORD } from './constants';
import { ThemeProvider } from './contexts/ThemeContext';

const AppContent: React.FC = () => {
  const [splashScreenVisible, setSplashScreenVisible] = useState(true);
  const [view, setView] = useState<AppView>(AppView.INTAKE);
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [documentScans, setDocumentScans] = useState<DocumentScan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteerRequestId, setVolunteerRequestId] = useState<string | null>(null);

  // Check for Volunteer URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    // matches /volunteer/[uuid]
    if (path.startsWith('/volunteer/')) {
      const requestId = path.split('/volunteer/')[1];
      if (requestId) {
        setVolunteerRequestId(requestId);
        setView(AppView.VOLUNTEER);
        setSplashScreenVisible(false); // Skip splash for volunteers
        return;
      }
    }
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    // 1. IMMEDIATE CHECK: If this is a volunteer link, STOP loading user data.
    // Let the Volunteer Hijack take over - don't restore saved state.
    if (window.location.pathname.startsWith('/volunteer/')) {
      return;
    }

    // Hide splash screen after 7 seconds
    const splashTimer = setTimeout(() => {
      setSplashScreenVisible(false);
    }, 7000);

    const loadState = async () => {
      const savedView = localStorage.getItem('lighthouse_view');
      const savedUserState = localStorage.getItem('userState');
      const savedDocumentScans = localStorage.getItem('documentScans');
      const savedTasks = localStorage.getItem('tasks');
      const savedServiceOutline = localStorage.getItem('serviceOutline');

      if (savedView) {
        setView(savedView as AppView);
      }

      // Decrypt and load user state
      if (savedUserState) {
        try {
          const parsed = isEncrypted(JSON.parse(savedUserState))
            ? await decryptObject(JSON.parse(savedUserState), ENCRYPTION_PASSWORD)
            : JSON.parse(savedUserState);

          // Ensure servicePreference is set
          if (!parsed.servicePreference) {
            parsed.servicePreference = 'SECULAR';
          }
          setUserState(parsed);
        } catch (error) {
          console.error('Failed to decrypt user state:', error);
          // If decryption fails, use initial state
          setUserState(INITIAL_USER_STATE);
        }
      }

      // Decrypt and load document scans
      if (savedDocumentScans) {
        try {
          const parsed = isEncrypted(JSON.parse(savedDocumentScans))
            ? await decryptObject(JSON.parse(savedDocumentScans), ENCRYPTION_PASSWORD)
            : JSON.parse(savedDocumentScans);
          setDocumentScans(parsed);
        } catch (error) {
          console.error('Failed to decrypt document scans:', error);
          setDocumentScans([]);
        }
      }

      // Decrypt and load tasks
      if (savedTasks) {
        try {
          const parsed = isEncrypted(JSON.parse(savedTasks))
            ? await decryptObject(JSON.parse(savedTasks), ENCRYPTION_PASSWORD)
            : JSON.parse(savedTasks);
          setTasks(parsed);
        } catch (error) {
          console.error('Failed to decrypt tasks:', error);
          setTasks([]);
        }
      }

      // Decrypt and load service outline
      if (savedServiceOutline) {
        try {
          const parsed = isEncrypted(JSON.parse(savedServiceOutline))
            ? await decryptObject(JSON.parse(savedServiceOutline), ENCRYPTION_PASSWORD)
            : JSON.parse(savedServiceOutline);
          setUserState(prev => ({ ...prev, serviceOutline: parsed }));
        } catch (error) {
          console.error('Failed to decrypt service outline:', error);
        }
      }
    };

    loadState();
    return () => clearTimeout(splashTimer);
  }, []);

  // Save user state to localStorage when it changes
  useEffect(() => {
    if (userState.name) { // Only save after intake is started
      // Encrypt sensitive data before saving
      const sanitizedUserState = sanitizeData(userState);
      encryptObject(sanitizedUserState, ENCRYPTION_PASSWORD)
        .then(encrypted => {
          localStorage.setItem('userState', JSON.stringify(encrypted));
        })
        .catch(error => {
          console.error('Failed to encrypt user state:', error);
          localStorage.setItem('userState', JSON.stringify(sanitizedUserState));
        });
    }
  }, [userState]);

  // Save document scans to localStorage
  useEffect(() => {
    if (documentScans.length > 0) {
      encryptObject(documentScans, ENCRYPTION_PASSWORD)
        .then(encrypted => {
          localStorage.setItem('documentScans', JSON.stringify(encrypted));
        })
        .catch(error => {
          console.error('Failed to encrypt document scans:', error);
          localStorage.setItem('documentScans', JSON.stringify(documentScans));
        });
    }
  }, [documentScans]);

  // Save tasks to localStorage
  useEffect(() => {
    if (tasks.length > 0) {
      encryptObject(tasks, ENCRYPTION_PASSWORD)
        .then(encrypted => {
          localStorage.setItem('tasks', JSON.stringify(encrypted));
        })
        .catch(error => {
          console.error('Failed to encrypt tasks:', error);
          localStorage.setItem('tasks', JSON.stringify(tasks));
        });
    }
  }, [tasks]);

  // Save service outline to localStorage
  useEffect(() => {
    if (userState.serviceOutline) {
      encryptObject(userState.serviceOutline, ENCRYPTION_PASSWORD)
        .then(encrypted => {
          localStorage.setItem('serviceOutline', JSON.stringify(encrypted));
        })
        .catch(error => {
          console.error('Failed to encrypt service outline:', error);
          localStorage.setItem('serviceOutline', JSON.stringify(userState.serviceOutline));
        });
    }
  }, [userState.serviceOutline]);

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
      {splashScreenVisible && (
        <SplashScreen
          onComplete={() => setSplashScreenVisible(false)}
        />
      )}

      {!splashScreenVisible && (
        <>
          {view === AppView.INTAKE ? (
            <IntakeFlow onComplete={handleIntakeComplete} />
          ) : view === AppView.TRANSITION ? (
            <TransitionView
              userState={userState}
              onComplete={handleTransitionComplete}
            />
          ) : view === AppView.VOLUNTEER ? (
            <VolunteerPage requestId={volunteerRequestId} />
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
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;