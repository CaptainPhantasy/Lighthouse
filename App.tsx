import React, { useState, useEffect } from 'react';
import IntakeFlow from './components/IntakeFlow';
import TransitionView from './components/TransitionView';
import Dashboard from './components/Dashboard';
import SplashScreen from './components/SplashScreen';
import VolunteerPage from './components/VolunteerPage';
import SentientGateway from './components/onboarding/SentientGateway';
import SentientIntake from './components/onboarding/SentientIntake';
import SentientDashboard from './components/SentientDashboard';
import VoiceIntro from './components/onboarding/VoiceIntro';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  AppView,
  UserState,
  DocumentScan,
  Task,
  ServicePreference,
  SentientUserState,
  LegacyTask,
  RecordedMemory,
} from './types';
import { INITIAL_USER_STATE } from './constants';
import { isEncrypted, decryptObject, encryptObject, sanitizeData } from './utils/encryption';
import { ENCRYPTION_PASSWORD } from './constants';
import { ThemeProvider } from './contexts/ThemeContext';
import { VoicePreferenceProvider } from './contexts/VoicePreferenceContext';
import { type NarrativeCheckpoint } from './hooks/useCheckpointedNarrative';

// ============================================================================
// VIEW VALIDATION - Prevents blank screen from invalid localStorage state
// ============================================================================

function isValidView(value: string): value is AppView {
  return Object.values(AppView).includes(value as AppView);
}

function sanitizeView(savedView: string | null): AppView {
  if (savedView && isValidView(savedView)) {
    console.log('[App] Loaded valid view from localStorage:', savedView);
    return savedView as AppView;
  }
  // Reset to safe default if view is invalid or missing
  if (savedView && !isValidView(savedView)) {
    console.warn('[App] Invalid view in localStorage, resetting to SENTIENT_GATEWAY:', savedView);
    localStorage.removeItem('lighthouse_view');
  }
  return AppView.SENTIENT_GATEWAY;
}

const AppContent: React.FC = () => {
  const [splashScreenVisible, setSplashScreenVisible] = useState(true);
  const [view, setView] = useState<AppView>(AppView.SENTIENT_GATEWAY); // Phase 2: Start with Sentient Gateway
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [documentScans, setDocumentScans] = useState<DocumentScan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteerRequestId, setVolunteerRequestId] = useState<string | null>(null);

  // Clear all app data and start over
  const handleStartOver = () => {
    console.log('[App] Starting over - clearing all data');
    localStorage.removeItem('lighthouse_view');
    localStorage.removeItem('userState');
    localStorage.removeItem('documentScans');
    localStorage.removeItem('tasks');
    localStorage.removeItem('serviceOutline');
    localStorage.removeItem('lighthouse_narrative_checkpoint');
    localStorage.removeItem('lighthouse_intake_step');
    localStorage.removeItem('lighthouse_intake_data');
    localStorage.removeItem('sentient_intake_data');
    localStorage.removeItem('voicePreferences');
    // Reset to initial state
    setUserState(INITIAL_USER_STATE);
    setDocumentScans([]);
    setTasks([]);
    setView(AppView.SENTIENT_GATEWAY);
    window.location.reload();
  };

  // Phase 2: Sentient onboarding state
  const [voiceMode, setVoiceMode] = useState<'voice' | 'discretion'>('voice');
  const [restoredCheckpoint, setRestoredCheckpoint] = useState<NarrativeCheckpoint | undefined>(undefined);

  // Sentient Path state (proactive/legacy planning)
  const [sentientUserState, setSentientUserState] = useState<SentientUserState>({
    name: '',
    lifeStage: 'YOUNG_ADULT',
    primaryGoal: 'ALL',
    memories: [],
    documents: [],
    messages: [],
    tasks: [],
    voiceEnabled: true,
  });

  // Phase 2: Check for narrative checkpoint on mount
  useEffect(() => {
    if (view !== AppView.SENTIENT_GATEWAY) return;

    try {
      const savedCheckpoint = localStorage.getItem('lighthouse_narrative_checkpoint');
      if (savedCheckpoint) {
        const checkpoint = JSON.parse(savedCheckpoint) as NarrativeCheckpoint;
        // Only restore if less than 24 hours old
        const age = Date.now() - checkpoint.lastUpdate;
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
      return;
    }

    // 2. Load state asynchronously
    const loadState = async () => {
      try {
        const savedView = localStorage.getItem('lighthouse_view');
        const savedUserState = localStorage.getItem('userState');
        const savedDocumentScans = localStorage.getItem('documentScans');
        const savedTasks = localStorage.getItem('tasks');
        const savedServiceOutline = localStorage.getItem('serviceOutline');

        if (savedView) {
          setView(sanitizeView(savedView));
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
      } catch (error) {
        console.error('Error loading state:', error);
      }
      // Note: Don't dismiss splash here - let the SplashScreen component handle its own timing
    };

    loadState();
  }, []);

  // Update document title based on current view
  useEffect(() => {
    const titles: Record<AppView, string> = {
      [AppView.SENTIENT_GATEWAY]: 'Lighthouse - Welcome',
      [AppView.VOICE_INTRO]: 'Lighthouse - Share Your Story',
      [AppView.INTAKE]: 'Lighthouse - Getting Started',
      [AppView.TRANSITION]: 'Lighthouse - Preparing Your Space',
      [AppView.DASHBOARD]: `Lighthouse${userState.name ? ` - For ${userState.name}` : ''}`,
      [AppView.VOLUNTEER]: 'Lighthouse - Support Circle',
      [AppView.SENTIENT_INTAKE]: 'Lighthouse - Legacy Planning',
      [AppView.SENTIENT_DASHBOARD]: `Lighthouse - ${sentientUserState.name ? `${sentientUserState.name}'s` : ''} Legacy`,
    };
    document.title = titles[view] || 'Lighthouse';
  }, [view, userState.name, sentientUserState.name]);

  // Save user state to localStorage when it changes
  useEffect(() => {
    if (userState.name) { // Only save after intake is started
      // Encrypt sensitive data before saving
      const sanitizedUserState = sanitizeData(userState);
      let cancelled = false;

      encryptObject(sanitizedUserState, ENCRYPTION_PASSWORD)
        .then(encrypted => {
          if (!cancelled) {
            try {
              localStorage.setItem('userState', JSON.stringify(encrypted));
            } catch (e) {
              console.error('localStorage quota exceeded or error:', e);
            }
          }
        })
        .catch(error => {
          if (!cancelled) {
            console.error('Failed to encrypt user state:', error);
            try {
              localStorage.setItem('userState', JSON.stringify(sanitizedUserState));
            } catch (e) {
              console.error('localStorage error:', e);
            }
          }
        });

      return () => { cancelled = true; };
    }
  }, [userState]);

  // Save tasks to localStorage when they change
  useEffect(() => {
    if (tasks.length > 0) {
      let cancelled = false;
      const encrypted = encryptObject(tasks, ENCRYPTION_PASSWORD);
      encrypted.then(result => {
        if (!cancelled) {
          try {
            localStorage.setItem('tasks', JSON.stringify(result));
          } catch (e) {
            console.error('localStorage quota exceeded or error:', e);
          }
        }
      }).catch(error => {
        if (!cancelled) {
          console.error('Failed to encrypt tasks:', error);
          try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
          } catch (e) {
            console.error('localStorage error:', e);
          }
        }
      });

      return () => { cancelled = true; };
    }
  }, [tasks]);

  // Save document scans to localStorage when they change
  useEffect(() => {
    if (documentScans.length > 0) {
      let cancelled = false;
      const encrypted = encryptObject(documentScans, ENCRYPTION_PASSWORD);
      encrypted.then(result => {
        if (!cancelled) {
          try {
            localStorage.setItem('documentScans', JSON.stringify(result));
          } catch (e) {
            console.error('localStorage quota exceeded or error:', e);
          }
        }
      }).catch(error => {
        if (!cancelled) {
          console.error('Failed to encrypt document scans:', error);
          try {
            localStorage.setItem('documentScans', JSON.stringify(documentScans));
          } catch (e) {
            console.error('localStorage error:', e);
          }
        }
      });

      return () => { cancelled = true; };
    }
  }, [documentScans]);

  // Extract volunteer request ID from URL if present
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'volunteer' && pathParts[2]) {
      setVolunteerRequestId(pathParts[2]);
      setView(AppView.VOLUNTEER);
    }
  }, []);

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleDocumentScan = (scan: DocumentScan) => {
    setDocumentScans(prev => [...prev, scan]);
  };

  const handleServicePreferenceChange = (preference: ServicePreference) => {
    setUserState(prev => ({ ...prev, servicePreference: preference }));
  };

  // Phase 2: Sentient onboarding handlers
  const handleGatewayEnter = (mode: 'voice' | 'discretion') => {
    console.log('[App] handleGatewayEnter called with mode:', mode);
    setVoiceMode(mode);
    setView(AppView.VOICE_INTRO);
    localStorage.setItem('lighthouse_view', AppView.VOICE_INTRO);
  };

  const handleResumeCheckpoint = () => {
    console.log('[App] handleResumeCheckpoint called');
    setView(AppView.VOICE_INTRO);
    localStorage.setItem('lighthouse_view', AppView.VOICE_INTRO);
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

  const handleTransitionComplete = () => {
    setView(AppView.DASHBOARD);
    localStorage.setItem('lighthouse_view', AppView.DASHBOARD);
  };

  const handleIntakeComplete = (data: Partial<UserState>) => {
    setUserState(prev => ({ ...prev, ...data }));
    setView(AppView.TRANSITION);
    localStorage.setItem('lighthouse_view', AppView.TRANSITION);
  };

  const handleServiceOutlineChange = (outline: string) => {
    setUserState(prev => ({ ...prev, serviceOutline: outline }));
    // Also save to localStorage
    localStorage.setItem('serviceOutline', outline);
  };

  // ============================================================================
  // SENTIENT PATH HANDLERS (Proactive/Legacy Planning)
  // ============================================================================

  const handlePathSelect = (path: 'bereaved' | 'sentient') => {
    console.log('[App] handlePathSelect called with path:', path);
    if (path === 'sentient') {
      setView(AppView.SENTIENT_INTAKE);
      localStorage.setItem('lighthouse_view', AppView.SENTIENT_INTAKE);
    }
    // For bereaved, the gateway shows mode selector, then calls handleGatewayEnter
  };

  const handleSentientIntakeComplete = (data: SentientUserState) => {
    setSentientUserState(data);
    setView(AppView.SENTIENT_DASHBOARD);
    localStorage.setItem('lighthouse_view', AppView.SENTIENT_DASHBOARD);
  };

  const handleSentientTaskAdd = (task: LegacyTask) => {
    setSentientUserState(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));
  };

  const handleSentientTaskUpdate = (taskId: string, updates: Partial<LegacyTask>) => {
    setSentientUserState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t)),
    }));
  };

  const handleSentientMemoryAdd = (memory: RecordedMemory) => {
    setSentientUserState(prev => ({
      ...prev,
      memories: [...prev.memories, memory],
    }));
  };

  return (
    <>
      {splashScreenVisible ? (
        <SplashScreen onComplete={() => setSplashScreenVisible(false)} />
      ) : (
        <>
          {/* Global Reset Button - always available, safely positioned */}
          <button
            onClick={() => {
              if (confirm('Start over? This will clear all your data and begin fresh.')) {
                handleStartOver();
              }
            }}
            className="fixed bottom-6 right-6 sm:bottom-4 sm:right-4 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 text-xs px-3 py-2 rounded-lg z-[100] cursor-pointer shadow-lg border border-stone-300 dark:border-stone-700 safe-area-inset-bottom"
            title="Clear all data and start over"
            aria-label="Reset application and clear all data"
          >
            Reset
          </button>

          {(() => {
            console.log('[App] Rendering view:', view);
            return (
              <ErrorBoundary key={view}>
              {view === AppView.SENTIENT_GATEWAY ? (
                <SentientGateway
                  onEnter={handleGatewayEnter}
                  onPathSelect={handlePathSelect}
                  hasCheckpoint={!!restoredCheckpoint}
                  onResumeCheckpoint={handleResumeCheckpoint}
                  onStartOver={handleStartOver}
                />
              ) : view === AppView.SENTIENT_INTAKE ? (
                <SentientIntake onComplete={handleSentientIntakeComplete} />
              ) : view === AppView.SENTIENT_DASHBOARD ? (
                <SentientDashboard
                  userState={sentientUserState}
                  onTaskAdd={handleSentientTaskAdd}
                  onTaskUpdate={handleSentientTaskUpdate}
                  onMemoryAdd={handleSentientMemoryAdd}
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
              ) : view === AppView.DASHBOARD ? (
                <Dashboard
                  userState={userState}
                  tasks={tasks}
                  documentScans={documentScans}
                  onTaskCreated={handleTaskCreated}
                  onDocumentScan={handleDocumentScan}
                  onServicePreferenceChange={handleServicePreferenceChange}
                  onServiceOutlineChange={handleServiceOutlineChange}
                  onStartOver={handleStartOver}
                />
              ) : (
                // Fallback: This should never happen with view validation, but ensures we always render something
                <SentientGateway
                  onEnter={handleGatewayEnter}
                  hasCheckpoint={!!restoredCheckpoint}
                  onResumeCheckpoint={handleResumeCheckpoint}
                  onStartOver={handleStartOver}
                />
              )}
            </ErrorBoundary>
            );
          })()}
        </>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <VoicePreferenceProvider>
        <AppContent />
      </VoicePreferenceProvider>
    </ThemeProvider>
  );
};

export default App;
