/**
 * Phase 2: Checkpointed Narrative System
 *
 * Provides resilient auto-save of the user's story during VoiceIntro.
 * If the browser crashes or refreshes, the AI resumes with:
 * "I'm still here. You were telling me about [deceasedName]..."
 *
 * Auto-saves to localStorage every 10 seconds during active speech.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'lighthouse_narrative_checkpoint';
const CHECKPOINT_INTERVAL = 10000; // 10 seconds

export interface NarrativeCheckpoint {
  userTranscript: string;
  aiResponses: string[];
  extractedInfo: {
    userName?: string;
    deceasedName?: string;
    relationship?: string;
    userLocation?: string;
    deceasedLocation?: string;
  };
  lastUpdate: number;
  version: number; // For conflict resolution
}

interface CheckpointedNarrativeOptions {
  onRestore?: (checkpoint: NarrativeCheckpoint) => void;
  autoSave?: boolean; // Enable/disable auto-save
  initialCheckpoint?: NarrativeCheckpoint; // External checkpoint to restore
  getResumeGreeting?: (checkpoint?: NarrativeCheckpoint) => string; // Custom greeting generator
}

interface UseCheckpointedNarrativeResult {
  // State
  userTranscript: string;
  aiResponses: string[];
  hasCheckpoint: boolean;
  isAutoSaving: boolean;

  // Actions
  addUserSpeech: (speech: string) => void;
  addAiResponse: (response: string) => void;
  updateExtractedInfo: (info: Partial<NarrativeCheckpoint['extractedInfo']>) => void;
  clearCheckpoint: () => void;
  restoreCheckpoint: () => NarrativeCheckpoint | null;
  getResumeGreeting: () => string;
}

export function useCheckpointedNarrative(
  options: CheckpointedNarrativeOptions = {}
): UseCheckpointedNarrativeResult {
  const { onRestore, autoSave = true, initialCheckpoint, getResumeGreeting: customGetResumeGreeting } = options;

  // LAZY INITIALIZATION: Use initialCheckpoint for initial state
  // This prevents race conditions with useEffect
  const getInitialState = () => {
    if (initialCheckpoint) {
      return {
        userTranscript: initialCheckpoint.userTranscript,
        aiResponses: initialCheckpoint.aiResponses,
        extractedInfo: initialCheckpoint.extractedInfo,
      };
    }
    return {
      userTranscript: '',
      aiResponses: [],
      extractedInfo: {},
    };
  };

  const initialState = getInitialState();

  const [userTranscript, setUserTranscript] = useState(initialState.userTranscript);
  const [aiResponses, setAiResponses] = useState<string[]>(initialState.aiResponses);
  const [extractedInfo, setExtractedInfo] = useState<NarrativeCheckpoint['extractedInfo']>(initialState.extractedInfo);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const checkpointRef = useRef<NarrativeCheckpoint | null>(initialCheckpoint || null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const versionRef = useRef(0);

  // Check for existing checkpoint on mount (only if no initialCheckpoint)
  const [hasCheckpoint, setHasCheckpoint] = useState(false);

  useEffect(() => {
    // Skip if initialCheckpoint was already provided (lazy init handled it)
    if (initialCheckpoint) {
      // Trigger onRestore callback
      onRestore?.(initialCheckpoint);
      return;
    }

    // Otherwise, check localStorage for existing checkpoint
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const checkpoint = JSON.parse(saved) as NarrativeCheckpoint;
        // Only restore if less than 24 hours old
        const age = Date.now() - checkpoint.lastUpdate;
        if (age < 24 * 60 * 60 * 1000) {
          setHasCheckpoint(true);
          checkpointRef.current = checkpoint;
        } else {
          // Old checkpoint, clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('[CheckpointedNarrative] Failed to load checkpoint:', e);
    }
  }, [initialCheckpoint]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave) return;

    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer
    saveTimerRef.current = setTimeout(() => {
      saveCheckpoint();
    }, CHECKPOINT_INTERVAL);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [userTranscript, aiResponses, extractedInfo, autoSave]);

  const saveCheckpoint = useCallback(() => {
    const checkpoint: NarrativeCheckpoint = {
      userTranscript,
      aiResponses,
      extractedInfo,
      lastUpdate: Date.now(),
      version: ++versionRef.current,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoint));
      checkpointRef.current = checkpoint;
      setIsAutoSaving(true);
      setTimeout(() => setIsAutoSaving(false), 500); // Brief flash indicator
      console.log('[CheckpointedNarrative] Saved:', versionRef.current);
    } catch (e) {
      console.error('[CheckpointedNarrative] Failed to save:', e);
    }
  }, [userTranscript, aiResponses, extractedInfo]);

  const addUserSpeech = useCallback((speech: string) => {
    setUserTranscript(prev => prev + (prev ? ' ' : '') + speech);
  }, []);

  const addAiResponse = useCallback((response: string) => {
    setAiResponses(prev => [...prev, response]);
  }, []);

  const updateExtractedInfo = useCallback((info: Partial<NarrativeCheckpoint['extractedInfo']>) => {
    setExtractedInfo(prev => ({ ...prev, ...info }));
  }, []);

  const clearCheckpoint = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserTranscript('');
    setAiResponses([]);
    setExtractedInfo({});
    setHasCheckpoint(false);
    checkpointRef.current = null;
    versionRef.current = 0;
  }, []);

  const restoreCheckpoint = useCallback((): NarrativeCheckpoint | null => {
    const checkpoint = checkpointRef.current;
    if (checkpoint) {
      setUserTranscript(checkpoint.userTranscript);
      setAiResponses(checkpoint.aiResponses);
      setExtractedInfo(checkpoint.extractedInfo);
      setHasCheckpoint(false); // Don't show prompt again
      onRestore?.(checkpoint);
    }
    return checkpoint;
  }, [onRestore]);

  const getResumeGreeting = useCallback((): string => {
    // Use custom greeting generator if provided
    if (customGetResumeGreeting) {
      return customGetResumeGreeting(checkpointRef.current || undefined);
    }

    // Default greeting logic
    const info = checkpointRef.current?.extractedInfo;
    if (!info) {
      return "I'm still here. Take your time.";
    }

    const { deceasedName, userName } = info;
    if (deceasedName && userName) {
      return `I'm still here, ${userName}. You were telling me about ${deceasedName}...`;
    }
    if (deceasedName) {
      return `I'm still here. You were telling me about ${deceasedName}...`;
    }
    return "I'm still here. You can continue whenever you're ready.";
  }, [customGetResumeGreeting]);

  return {
    userTranscript,
    aiResponses,
    hasCheckpoint,
    isAutoSaving,
    addUserSpeech,
    addAiResponse,
    updateExtractedInfo,
    clearCheckpoint,
    restoreCheckpoint,
    getResumeGreeting,
  };
}

export default useCheckpointedNarrative;
