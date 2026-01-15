/**
 * SentientIntake - Legacy Architect Onboarding
 *
 * The intake flow for proactive users planning their legacy.
 * Replaces the trauma-informed triage with a "Legacy Architect" experience.
 *
 * Questions:
 * - Life Stage: Young Adult, Mid-Life, Senior, Terminal Diagnosis
 * - Primary Goal: Organize Documents, Record Memories, Message Loved Ones
 * - The "Biographer" Setup: Name and Core Memory (voice input)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, FileText, Mic, BookOpen, Mail, ArrowRight, ArrowLeft, CheckCircle, HeartHandshake, Volume2, VolumeX } from 'lucide-react';
import { AuroraBackground } from '../ui/aurora-background';
import { SentientUserState, LifeStage, PrimaryGoal } from '../../types';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useVoicePreferences } from '../../contexts/VoicePreferenceContext';
import { VoiceWelcomeModal } from '../voice';
import { VoiceToggle } from '../voice';

interface SentientIntakeProps {
  onComplete: (data: SentientUserState) => void;
}

type Step = 'life-stage' | 'primary-goal' | 'biographer-setup' | 'processing';

// Life stage options
const LIFE_STAGES: { value: LifeStage; label: string; description: string; icon: typeof Sprout }[] = [
  { value: 'YOUNG_ADULT', label: 'Young Adult', description: 'Building your foundation', icon: Sprout },
  { value: 'MID_LIFE', label: 'Mid-Life', description: 'Established and growing', icon: BookOpen },
  { value: 'SENIOR', label: 'Senior', description: 'Preserving your legacy', icon: FileText },
  { value: 'TERMINAL_DIAGNOSIS', label: 'Facing Illness', description: 'Planning with intention', icon: HeartHandshake },
];

// Primary goal options
const GOALS: { value: PrimaryGoal; label: string; description: string; icon: typeof Sprout }[] = [
  { value: 'ORGANIZE_DOCUMENTS', label: 'Organize Documents', description: 'Wills, insurance, passwords', icon: FileText },
  { value: 'RECORD_MEMORIES', label: 'Record Memories', description: 'Your stories and wisdom', icon: BookOpen },
  { value: 'MESSAGE_LOVED_ONES', label: 'Message Loved Ones', description: 'Words for the future', icon: Mail },
  { value: 'ALL', label: 'All of the Above', description: 'Build a complete legacy', icon: Sprout },
];

// Elegant card wrapper (reused from IntakeFlow)
const GracefulCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.98 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-900/5 border border-stone-200/20 dark:border-stone-700/20 p-8 ${className}`}
  >
    {children}
  </motion.div>
);

const CompassionateButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}> = ({ onClick, children, variant = 'primary', disabled = false, fullWidth = false }) => {
  const baseStyles = "rounded-2xl font-medium transition-all duration-500 transform";
  const widthClass = fullWidth ? "w-full" : "";

  const variantStyles = {
    primary: "bg-black dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white shadow-lg",
    secondary: "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant as keyof typeof variantStyles]} ${widthClass} px-6 py-3.5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </motion.button>
  );
};

const SentientIntake: React.FC<SentientIntakeProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('life-stage');
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [userName, setUserName] = useState('');
  const [coreMemory, setCoreMemory] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Prevent duplicate speech from React Strict Mode
  const lastSpokenStepRef = useRef<Step | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear any pending speech timeouts
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
    };
  }, []);

  // Global voice preference
  const { voiceEnabled, hasSeenWelcomeModal } = useVoicePreferences();

  // Gemini 3 Flash-powered speech to text
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  // Gemini 3 Flash-powered text to speech
  const { speak: speakText, isSpeaking, stop: stopSpeaking, isSupported: ttsSupported } = useTextToSpeech();

  // Sync transcript with core memory when listening, and extract name
  useEffect(() => {
    if (isListening && transcript) {
      setCoreMemory(transcript);

      // Extract name from transcript if userName is empty
      if (!userName && transcript.length > 5) {
        extractNameFromTranscript(transcript);
      }
    }
  }, [transcript, isListening]);

  // Extract name from speech using Gemini
  const extractNameFromTranscript = async (text: string) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Extract ONLY the user's name from this text. Return just the name, nothing else.\n\nText: "${text}"`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50,
            },
          }),
        }
      );

      const data = await response.json();
      const extractedName = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (extractedName && extractedName.length > 0 && extractedName.length < 50) {
        // Remove common prefixes
        const cleanName = extractedName
          .replace(/^(my name is|i'm|i am|call me|you can call me)\s+/i, '')
          .replace(/^["']|["']$/g, '')
          .trim();
        if (cleanName) {
          setUserName(cleanName);
        }
      }
    } catch (e) {
      console.error('[SentientIntake] Name extraction failed:', e);
    }
  };

  // Voice guidance for each step
  const speakGuidance = useCallback(async (text: string) => {
    if (voiceEnabled && ttsSupported) {
      await speakText(text);
    }
  }, [voiceEnabled, ttsSupported, speakText]);

  // Speak guidance when step changes
  useEffect(() => {
    const guidance: Record<Step, string> = {
      'life-stage': "Where are you in life right now? This helps me understand your planning needs.",
      'primary-goal': "What matters most to you? You can choose multiple areas to focus on.",
      'biographer-setup': "Let's set up your personal biographer. Tap the microphone and tell me your name, and share a memory that makes you smile. I'll fill it in for you.",
      'processing': "Processing your information...",
    };

    if (step && guidance[step] && step !== lastSpokenStepRef.current) {
      // Prevent duplicate speech for the same step
      lastSpokenStepRef.current = step;

      // Clear any pending speech
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }

      // Small delay to allow UI to render first
      speechTimeoutRef.current = setTimeout(() => {
        speakGuidance(guidance[step]);
      }, 500);
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [step, speakGuidance]);

  // Save progress to localStorage
  useEffect(() => {
    const data = { step, lifeStage, primaryGoal, userName, coreMemory };
    localStorage.setItem('sentient_intake_data', JSON.stringify(data));
  }, [step, lifeStage, primaryGoal, userName, coreMemory]);

  // Handle voice recording toggle
  const handleVoiceRecord = async () => {
    if (isListening) {
      await stopListening();
    } else {
      setCoreMemory(''); // Clear previous
      await startListening();
    }
  };

  const handleComplete = () => {
    setIsProcessing(true);

    // Simulate processing
    setTimeout(() => {
      const sentientData: SentientUserState = {
        name: userName || 'Friend',
        lifeStage: lifeStage!,
        primaryGoal: primaryGoal!,
        coreMemory,
        memories: coreMemory ? [{
          id: Date.now().toString(),
          timestamp: new Date(),
          prompt: 'Tell me about a core memory.',
          transcript: coreMemory,
          tags: ['core-memory'],
        }] : [],
        documents: [],
        messages: [],
        tasks: [],
        voiceEnabled: true,
      };

      // Clear temp storage
      localStorage.removeItem('sentient_intake_data');
      // Save with sentient_ prefix to avoid collision
      localStorage.setItem('sentient_user_state', JSON.stringify(sentientData));

      // Show welcome modal if first time, otherwise complete directly
      if (!hasSeenWelcomeModal) {
        setIsProcessing(false);
        setShowWelcomeModal(true);
      } else {
        onComplete(sentientData);
      }
    }, 2000);
  };

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    // Proceed to dashboard after modal closes
    const sentientData: SentientUserState = {
      name: userName || 'Friend',
      lifeStage: lifeStage!,
      primaryGoal: primaryGoal!,
      coreMemory,
      memories: coreMemory ? [{
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: 'Tell me about a core memory.',
        transcript: coreMemory,
        tags: ['core-memory'],
      }] : [],
      documents: [],
      messages: [],
      tasks: [],
      voiceEnabled: true,
    };
    onComplete(sentientData);
  };

  const canProceedFromBiographer = () => {
    return userName.trim().length > 0 && (coreMemory.trim().length > 0 || lifeStage === 'YOUNG_ADULT');
  };

  return (
    <AuroraBackground className="fixed inset-0 z-0">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Progress indicator with voice toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-4"
        >
          {/* Voice guidance toggle */}
          {ttsSupported && <VoiceToggle />}
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  (step === 'life-stage' && i === 1) ||
                  (step === 'primary-goal' && i === 2) ||
                  (step === 'biographer-setup' && i === 3) ||
                  step === 'processing'
                    ? 'bg-stone-800 dark:bg-stone-200'
                    : 'bg-stone-300 dark:bg-stone-700'
                }`}
                animate={{
                  scale: ((step === 'life-stage' && i === 1) ||
                         (step === 'primary-goal' && i === 2) ||
                         (step === 'biographer-setup' && i === 3)) ? 1.2 : 1,
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Life Stage */}
          {step === 'life-stage' && (
            <GracefulCard key="life-stage" className="max-w-md w-full">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4"
                >
                  <Sprout className="w-8 h-8 text-stone-600 dark:text-stone-400" />
                </motion.div>
                <h2 className="text-2xl font-light text-stone-800 dark:text-stone-200 mb-2">
                  Where are you in life?
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  This helps me tailor your legacy planning experience.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {LIFE_STAGES.map((stage) => {
                  const Icon = stage.icon;
                  const isSelected = lifeStage === stage.value;
                  return (
                    <motion.button
                      key={stage.value}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLifeStage(stage.value);
                        setTimeout(() => setStep('primary-goal'), 300);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'bg-stone-800 border-stone-800 text-white dark:bg-stone-700 dark:border-stone-600'
                          : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-stone-700 dark:bg-stone-600'
                          : 'bg-stone-200 dark:bg-stone-800'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{stage.label}</div>
                        <div className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                          {stage.description}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-stone-300" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Skip to next step
                    setTimeout(() => setStep('primary-goal'), 300);
                  }}
className="text-stone-500 dark:text-stone-400 text-sm hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                >
                  Skip for now
                </motion.button>
              </div>
            </GracefulCard>
          )}

          {/* Step 2: Primary Goal */}
          {step === 'primary-goal' && (
            <GracefulCard key="primary-goal" className="max-w-md w-full">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4"
                >
                  <Sprout className="w-8 h-8 text-stone-600 dark:text-stone-400" />
                </motion.div>
                <h2 className="text-2xl font-light text-stone-800 dark:text-stone-200 mb-2">
                  What matters most to you?
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Select your main focus. You can always add more later.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = primaryGoal === goal.value;
                  return (
                    <motion.button
                      key={goal.value}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setPrimaryGoal(goal.value);
                        setTimeout(() => setStep('biographer-setup'), 300);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'bg-stone-800 border-stone-800 text-white dark:bg-stone-700 dark:border-stone-600'
                          : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-stone-700 dark:bg-stone-600'
                          : 'bg-stone-200 dark:bg-stone-800'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{goal.label}</div>
                        <div className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                          {goal.description}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-stone-300" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <CompassionateButton
                  variant="secondary"
                  onClick={() => setStep('life-stage')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </CompassionateButton>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('biographer-setup')}
className="flex-1 text-stone-500 dark:text-stone-400 text-sm hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                >
                  Skip for now
                </motion.button>
              </div>
            </GracefulCard>
          )}

          {/* Step 3: Biographer Setup */}
          {step === 'biographer-setup' && (
            <GracefulCard key="biographer-setup" className="max-w-md w-full">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4"
                >
                  <Mic className="w-8 h-8 text-stone-600 dark:text-stone-400" />
                </motion.div>
                <h2 className="text-2xl font-light text-stone-800 dark:text-stone-200 mb-2">
                  Meet Your Biographer
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  I'll help you record your story. Let's start with a hello.
                </p>
              </div>

              <div className="space-y-6">
                {/* Name input */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    What should I call you?
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 text-stone-800 dark:text-stone-200"
                    autoFocus
                  />
                </div>

                {/* Core memory prompt */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Tell me about a memory that makes you smile.
                  </label>
                  <textarea
                    value={coreMemory}
                    onChange={(e) => setCoreMemory(e.target.value)}
                    placeholder="A moment you'd want future generations to know..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 text-stone-800 dark:text-stone-200 resize-none"
                  />
                </div>

                {/* Voice recording button */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: isListening ? 1 : 1.02 }}
                    whileTap={{ scale: isListening ? 1 : 0.98 }}
                    onClick={handleVoiceRecord}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border transition-all ${
                      isListening
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                        : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                    <span>{isListening ? 'Tap to stop' : 'Or speak it'}</span>
                  </motion.button>

                  {/* Listening indicator */}
                  {isListening && (
                    <div className="text-center">
                      <p className="text-sm text-stone-500 dark:text-stone-400 animate-pulse">
                        Listening with Gemini AI...
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <CompassionateButton
                    variant="secondary"
                    onClick={() => setStep('primary-goal')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </CompassionateButton>
                  <CompassionateButton
                    fullWidth
                    onClick={handleComplete}
                    disabled={!canProceedFromBiographer() || isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          ⚬
                        </motion.span>
                        Setting up your space...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Begin My Legacy
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </CompassionateButton>
                </div>
              </div>
            </GracefulCard>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Welcome Modal */}
      <VoiceWelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeModalClose}
      />
    </AuroraBackground>
  );
};

export default SentientIntake;
