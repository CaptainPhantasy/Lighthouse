import React, { useState, useEffect } from 'react';
import IntakeFlow from './components/IntakeFlow';
import TransitionView from './components/TransitionView';
import Dashboard from './components/Dashboard';
import SplashScreen from './components/SplashScreen';
import VolunteerPage from './components/VolunteerPage';
import SentientGateway from './components/onboarding/SentientGateway';
import VoiceIntro from './components/onboarding/VoiceIntro';
import { AppView, UserState, DocumentScan, Task, ServicePreference } from './types';
import { INITIAL_USER_STATE } from './constants';
import { isEncrypted, decryptObject, encryptObject, sanitizeData } from './utils/encryption';
import { ENCRYPTION_PASSWORD } from './constants';
import { ThemeProvider } from './contexts/ThemeContext';
import { type NarrativeCheckpoint } from './hooks/useCheckpointedNarrative';

const AppContent: React.FC = () => {
  const [splashScreenVisible, setSplashScreenVisible] = useState(true);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [view, setView] = useState<AppView>(AppView.SENTIENT_GATEWAY); // Phase 2: Start with Sentient Gateway
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [documentScans, setDocumentScans] = useState<DocumentScan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteerRequestId, setVolunteerRequestId] = useState<string | null>(null);

  // Phase 2: Sentient onboarding state
  const [voiceMode, setVoiceMode] = useState<'voice' | 'discretion'>('voice');
  const [restoredCheckpoint, setRestoredCheckpoint] = useState<NarrativeCheckpoint | undefined>(undefined);

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

  // Phase 2: Check for narrative checkpoint on mount
  useEffect(() => {
    if (view !== AppView.SENTIENT_GATEWAY) return;

    try {
      const savedCheckpoint = localStorage.getItem('lighthouse_narrative_checkpoint');
      if (savedCheckpoint) {
        const checkpoint = JSON.parse(savedCheckpoint) as NarrativeCheckpoint;
        // Only restore if less than 24 hours old
        const age = Date.now() - (checkpoint as any).lastUpdate;
        if (age < 24 * 60 * 60 * 1000) {
          setRestoredCheckpoint(checkpoint);
        }
      }
    } catch (e) {
      console.error('[App] Failed to load checkpoint:', e);
    }
  }, [view]);

  // Load state from localStorage on mount
  useEffect(() => {
    // 1. IMMEDIATE CHECK: If this is a volunteer link, STOP loading user data.
    // Let the Volunteer Hijack take over - don't restore saved state.
    if (window.location.pathname.startsWith('/volunteer/')) {
      // Skip loading, dismiss splash immediately
      setSplashScreenVisible(false);
      setIsInitialLoadComplete(true);
      return;
    }

    // 2. Load state asynchronously and dismiss splash when complete
    // No fake 7-second delay - dismiss as soon as data is ready
    const loadState = async () => {
      try {
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
      } finally {
        // Data loading complete - dismiss splash screen immediately
        setIsInitialLoadComplete(true);
        setSplashScreenVisible(false);
      }
    };

    loadState();
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

  // Phase 2: Sentient onboarding handlers
  const handleGatewayEnter = (mode: 'voice' | 'discretion') => {
    setVoiceMode(mode);
    setView(AppView.VOICE_INTRO);
  };

  const handleResumeCheckpoint = () => {
    setRestoredCheckpoint(restoredCheckpoint);
    setView(AppView.VOICE_INTRO);
  };

  const handleVoiceIntroComplete = (data: Partial<UserState>) => {
    // Merge with initial state for any missing fields
    const mergedData: UserState = {
      ...INITIAL_USER_STATE,
      ...data,
      servicePreference: 'SECULAR',
    } as UserState;

    setUserState(mergedData);
    setView(AppView.TRANSITION);
    localStorage.setItem('lighthouse_view', AppView.TRANSITION);

    // Clear the checkpoint after successful completion
    localStorage.removeItem('lighthouse_narrative_checkpoint');
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
          {view === AppView.SENTIENT_GATEWAY ? (
            <SentientGateway
              onEnter={handleGatewayEnter}
              hasCheckpoint={!!restoredCheckpoint}
              onResumeCheckpoint={handleResumeCheckpoint}
            />
          ) : view === AppView.VOICE_INTRO ? (
            <VoiceIntro
              mode={voiceMode}
              restoredCheckpoint={restoredCheckpoint}
              onComplete={handleVoiceIntroComplete}
            />
          ) : view === AppView.INTAKE ? (
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