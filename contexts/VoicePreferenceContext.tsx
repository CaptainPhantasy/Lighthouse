import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VoicePreferences } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('VoicePreferenceContext');
const VOICE_PREFERENCES_KEY = 'lighthouse_voice_preferences';

interface VoicePreferenceContextValue {
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  hasSeenWelcomeModal: boolean;
  markWelcomeModalSeen: () => void;
  resetVoicePreferences: () => void;
}

const VoicePreferenceContext = createContext<VoicePreferenceContextValue | undefined>(undefined);

const defaultPreferences: VoicePreferences = {
  voiceGuidanceEnabled: true,
  hasSeenWelcomeModal: false,
};

const loadPreferences = (): VoicePreferences => {
  if (typeof window === 'undefined') return defaultPreferences;
  try {
    const saved = localStorage.getItem(VOICE_PREFERENCES_KEY);
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (e) {
    logger.error('Failed to load preferences:', e);
  }
  return defaultPreferences;
};

const savePreferences = (prefs: VoicePreferences) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (e) {
    logger.error('Failed to save preferences:', e);
  }
};

interface VoicePreferenceProviderProps {
  children: React.ReactNode;
}

export const VoicePreferenceProvider: React.FC<VoicePreferenceProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<VoicePreferences>(defaultPreferences);

  // Load preferences on mount
  useEffect(() => {
    const loaded = loadPreferences();
    setPreferences(loaded);
  }, []);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev, voiceGuidanceEnabled: enabled };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const markWelcomeModalSeen = useCallback(() => {
    setPreferences(prev => {
      const updated = { ...prev, hasSeenWelcomeModal: true };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const resetVoicePreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    savePreferences(defaultPreferences);
  }, []);

  const value: VoicePreferenceContextValue = {
    voiceEnabled: preferences.voiceGuidanceEnabled,
    setVoiceEnabled,
    hasSeenWelcomeModal: preferences.hasSeenWelcomeModal,
    markWelcomeModalSeen,
    resetVoicePreferences,
  };

  return (
    <VoicePreferenceContext.Provider value={value}>
      {children}
    </VoicePreferenceContext.Provider>
  );
};

export const useVoicePreferences = (): VoicePreferenceContextValue => {
  const context = useContext(VoicePreferenceContext);
  if (!context) {
    throw new Error('useVoicePreferences must be used within VoicePreferenceProvider');
  }
  return context;
};

export default VoicePreferenceContext;
