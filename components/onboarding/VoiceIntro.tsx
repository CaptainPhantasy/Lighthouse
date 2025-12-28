/**
 * Phase 2: Sentient Onboarding - VoiceIntro (v2.0)
 *
 * A zero-friction, sentient onboarding experience.
 * The app transforms from a tool to a companion.
 *
 * Features:
 * - Voice-first with discretion (text-only) fallback
 * - Checkpointed narrative system (auto-saves every 10s)
 * - Smart entity extraction with ambiguity detection
 * - "I'm still here" resume after crash/refresh
 * - Haptic empathy (navigator.vibrate)
 * - Mobile-safe audio handling
 *
 * The AI silently extracts:
 * - userName, deceasedName, relationship
 * - userLocation, deceasedLocation
 * - wishesKnowledgeLevel
 *
 * Only nudges for missing details after 15s of silence (reduced urgency for thoughtful input).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import useSpeechToText from '@/hooks/useSpeechToText';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { useCheckpointedNarrative, type NarrativeCheckpoint } from '@/hooks/useCheckpointedNarrative';
import { setStoryContext } from '@/services/geminiService';
import { UserState, WishesKnowledgeLevel } from '@/types';
import { deepResearchInterstateTransport } from '@/services/geminiService';
import { Send, Mic } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface VoiceIntroProps {
  onComplete: (userState: Partial<UserState>) => void;
  mode: 'voice' | 'discretion'; // From SentientGateway
  restoredCheckpoint?: NarrativeCheckpoint;
}

interface ExtractedInfo {
  userName?: string;
  deceasedName?: string;
  relationship?: string;
  userLocation?: string;
  deceasedLocation?: string;
  wishesKnowledgeLevel?: WishesKnowledgeLevel;
  isAmbiguous?: boolean; // For Implicit Extraction Trap
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BREATH_CYCLE_DURATION = 4000; // 4 seconds per breath - slow, calming
const SILENCE_THRESHOLD = 15000; // 15 seconds before gentle nudge (allows thoughtful pause)
const MAX_CONVERSATION_TURNS = 5; // Prevent infinite loops

// ============================================================================
// SENTIENT ONBOARDING COMPONENT
// ============================================================================

export default function VoiceIntro({ onComplete, mode, restoredCheckpoint }: VoiceIntroProps) {
  // State
  const [aiResponse, setAiResponse] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({});
  const [hasStarted, setHasStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationTurnRef = useRef(0);
  const lastTranscriptTimeRef = useRef(Date.now());

  // Checkpointed narrative hook
  const {
    userTranscript,
    aiResponses,
    isAutoSaving,
    addUserSpeech,
    addAiResponse,
    updateExtractedInfo,
    getResumeGreeting,
  } = useCheckpointedNarrative({
    autoSave: true,
    initialCheckpoint: restoredCheckpoint,
    onRestore: (checkpoint) => {
      setExtractedInfo(checkpoint.extractedInfo);
    },
  });

  // Speech hooks
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  } = useSpeechToText();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported,
  } = useTextToSpeech();

  // Determine if we're using voice or text mode
  const isVoiceMode = mode === 'voice' && browserSupportsSpeechRecognition;

  // ============================================================================
  // RESTORE CHECKPOINT ON MOUNT
  // ============================================================================

  useEffect(() => {
    if (restoredCheckpoint) {
      setExtractedInfo(restoredCheckpoint.extractedInfo);
      conversationTurnRef.current = 2; // Skip initial greeting
      setHasStarted(true);

      // getResumeGreeting() now works synchronously because hook uses lazy initialization
      const greeting = getResumeGreeting();
      setAiResponse(greeting);

      if (ttsSupported && isVoiceMode) {
        speak(greeting).then(() => {
          if (isVoiceMode) {
            startListening();
          }
        });
      } else if (isVoiceMode) {
        startListening();
      }
    }
  }, [restoredCheckpoint, getResumeGreeting, ttsSupported, isVoiceMode, speak, startListening]);

  // ============================================================================
  // INITIAL GREETING (if not restored)
  // ============================================================================

  const GREETING = `I'm Lighthouse. I'm here.

Tell me a bit about what's happening, who you lost, and where you are right now.

Take your time. I'm listening.`;

  useEffect(() => {
    if (!hasStarted && !restoredCheckpoint) {
      if (ttsSupported && isVoiceMode) {
        speak(GREETING).then(() => {
          setHasStarted(true);
          setAiResponse(GREETING);
          setTimeout(() => {
            startListening();
          }, 1000);
        });
      } else {
        setAiResponse(GREETING);
        setHasStarted(true);
        if (isVoiceMode) {
          startListening();
        }
      }
    }

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [hasStarted, restoredCheckpoint]);

  // ============================================================================
  // ENTITY EXTRACTION - Smart with Ambiguity Detection
  // ============================================================================

  const extractEntities = useCallback(async (text: string, context: string): Promise<ExtractedInfo> => {
    const extractionPrompt = `You are extracting information from a grieving person sharing their story.
Extract entities and identify location ambiguity.

TEXT: "${text}"
CONTEXT: "${context}"

CRITICAL RULES:
1. Distinguish between userLocation (where user IS) and deceasedLocation (where deceased IS)
2. If text says "I'm in Florida" -> userLocation = "Florida"
3. If text says "Mark is in Oregon" -> deceasedLocation = "Oregon"
4. If locations are ambiguous (e.g., "We're in Florida" - unclear if both are there), return isAmbiguous = true
5. wishesKnowledgeLevel: "NONE" (no wishes discussed), "VAGUE" (mentioned some ideas), "CLEAR" (written/final wishes mentioned)

Return ONLY valid JSON:
{
  "userName": "user's name or null",
  "deceasedName": "deceased person's name or null",
  "relationship": "spouse/child/parent/sibling/friend/other or null",
  "userLocation": "city, state where user is or null",
  "deceasedLocation": "where deceased is located or null",
  "wishesKnowledgeLevel": "NONE/VAGUE/CLEAR or null",
  "isAmbiguous": true/false (if locations unclear)
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: extractionPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        const cleaned = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        return JSON.parse(cleaned);
      }
    } catch (e) {
      console.error('[VoiceIntro] Extraction error:', e);
    }
    return {};
  }, []);

  // ============================================================================
  // AI RESPONSE HANDLER
  // ============================================================================

  const handleAiResponse = useCallback(
    async (responseText: string) => {
      setAiResponse(responseText);
      addAiResponse(responseText);

      if (isVoiceMode) {
        stopListening();
      }

      // Haptic empathy pulse: Single gentle tap when AI responds
      // Provides physical anchor for processing complex logic
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      if (ttsSupported && isVoiceMode) {
        await speak(responseText);
      }

      // Check if we have required info
      const hasRequired =
        extractedInfo.userName &&
        extractedInfo.deceasedName &&
        extractedInfo.relationship &&
        extractedInfo.userLocation;

      // Check for ambiguity - resolve before completing
      const hasAmbiguity = extractedInfo.isAmbiguous && !extractedInfo.deceasedLocation;

      if (hasRequired && !hasAmbiguity) {
        // Complete onboarding after a brief pause
        setTimeout(() => {
          completeOnboarding();
        }, 1500);
      } else {
        // Resume listening (or show text input)
        setTimeout(() => {
          if (isVoiceMode) {
            startListening();
          }
        }, 500);
      }
    },
    [extractedInfo, speak, startListening, stopListening, ttsSupported, isVoiceMode, addAiResponse]
  );

  // ============================================================================
  // COMPLETE ONBOARDING
  // ============================================================================

  const completeOnboarding = useCallback(async () => {
    const fullTranscript = `User: ${userTranscript}\n\nLighthouse: ${aiResponses.join('\n\n')}`;

    const userState: Partial<UserState> = {
      name: extractedInfo.userName || '',
      deceasedName: extractedInfo.deceasedName || '',
      relationshipToDeceased: extractedInfo.relationship || '',
      userLocation: extractedInfo.userLocation || '',
      deceasedLocation: mapToDeceasedLocation(extractedInfo.deceasedLocation),
      wishesKnowledgeLevel: extractedInfo.wishesKnowledgeLevel || 'VAGUE',
      initialStoryTranscript: fullTranscript,
      isSafe: true,
      deathPronounced: false,
      isVeteran: false,
      brainFogLevel: assessBrainFog(userTranscript),
    };

    // Cache story context for all future AI sessions
    setStoryContext(fullTranscript);

    // Check for interstate scenario
    if (extractedInfo.userLocation && extractedInfo.deceasedLocation) {
      const isInterstate = !isSameLocation(extractedInfo.userLocation, extractedInfo.deceasedLocation);

      if (isInterstate) {
        console.log('[VoiceIntro] Interstate detected - Deep Research initiated');
        try {
          const itinerary = await deepResearchInterstateTransport(
            extractedInfo.userLocation,
            extractedInfo.deceasedLocation
          );
          if (itinerary) {
            (userState as any).interstateItinerary = itinerary;
          }
        } catch (e) {
          console.error('[VoiceIntro] Deep research failed:', e);
        }
      }
    }

    // Stop any ongoing speech/listening
    stopSpeaking();
    if (isVoiceMode) {
      stopListening();
    }

    onComplete(userState);
  }, [
    extractedInfo,
    userTranscript,
    aiResponses,
    onComplete,
    stopSpeaking,
    isVoiceMode,
    stopListening,
  ]);

  // ============================================================================
  // PROCESS VOICE TRANSCRIPTS
  // ============================================================================

  useEffect(() => {
    if (!isListening && transcript && !isProcessing && isVoiceMode) {
      setIsProcessing(true);

      // Save to checkpointed narrative
      addUserSpeech(transcript);
      setCurrentTranscript(transcript);

      // Extract entities with context
      extractEntities(transcript, userTranscript).then((newInfo) => {
        setExtractedInfo((prev) => {
          const merged = { ...prev, ...newInfo };
          // Update checkpoint
          updateExtractedInfo(merged);
          return merged;
        });
        conversationTurnRef.current++;

        // Determine AI response
        const missing = getMissingInfo({ ...extractedInfo, ...newInfo });
        const turn = conversationTurnRef.current;
        const isAmbiguous = newInfo.isAmbiguous;

        let responseText = '';

        if (isAmbiguous && !newInfo.deceasedLocation && newInfo.userLocation) {
          // Implicit Extraction Trap: Ask clarifying question
          responseText = `Thank you for sharing. Just to make sure I understand — are you both in ${newInfo.userLocation}, or are they somewhere else?`;
        } else if (missing.length === 0) {
          responseText = `Thank you for sharing that with me. I understand you're ${newInfo.relationship} to ${newInfo.deceasedName}, and you're in ${newInfo.userLocation}. I'm ready to help you through this. Take a breath.`;
        } else if (turn >= MAX_CONVERSATION_TURNS) {
          // Max turns reached - proceed with what we have
          responseText = 'Thank you. I have enough to get started. Let me help you.';
        } else if (turn >= 2) {
          // Gentle nudge for missing info
          responseText = `I appreciate you sharing that. ${getNudgeText(missing)}`;
        } else {
          responseText = "I'm listening. Take your time.";
        }

        handleAiResponse(responseText).finally(() => {
          setIsProcessing(false);
        });
      });
    }

    // Clear silence timer on new transcript
    if (transcript) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      lastTranscriptTimeRef.current = Date.now();
    }
  }, [
    isListening,
    transcript,
    isProcessing,
    extractedInfo,
    extractEntities,
    handleAiResponse,
    userTranscript,
    addUserSpeech,
    updateExtractedInfo,
    isVoiceMode,
  ]);

  // ============================================================================
  // PROCESS TEXT INPUT (Discretion Mode)
  // ============================================================================

  const handleTextInput = useCallback(async () => {
    if (!textInput.trim()) return;

    const text = textInput.trim();
    setTextInput('');
    addUserSpeech(text);
    setCurrentTranscript(text);
    setIsProcessing(true);

    // Extract entities with context
    const newInfo = await extractEntities(text, userTranscript);
    setExtractedInfo((prev) => {
      const merged = { ...prev, ...newInfo };
      updateExtractedInfo(merged);
      return merged;
    });
    conversationTurnRef.current++;

    // Determine AI response
    const missing = getMissingInfo({ ...extractedInfo, ...newInfo });
    const turn = conversationTurnRef.current;
    const isAmbiguous = newInfo.isAmbiguous;

    let responseText = '';

    if (isAmbiguous && !newInfo.deceasedLocation && newInfo.userLocation) {
      responseText = `Thank you for sharing. Just to be sure — are you both in ${newInfo.userLocation}, or are they somewhere else?`;
    } else if (missing.length === 0) {
      responseText = `Thank you. I understand you're ${newInfo.relationship} to ${newInfo.deceasedName}. I'm ready to help you through this.`;
    } else if (turn >= MAX_CONVERSATION_TURNS) {
      responseText = 'Thank you. I have enough to get started.';
    } else if (turn >= 2) {
      responseText = `I appreciate you sharing that. ${getNudgeText(missing)}`;
    } else {
      responseText = 'Thank you. Please continue when you are ready.';
    }

    await handleAiResponse(responseText);
    setIsProcessing(false);
  }, [textInput, extractedInfo, userTranscript, extractEntities, addUserSpeech, updateExtractedInfo, handleAiResponse]);

  // ============================================================================
  // SILENCE DETECTION (5 seconds) - Voice mode only
  // ============================================================================

  useEffect(() => {
    if (!isVoiceMode || !isListening || !hasStarted || isSpeaking) return;

    silenceTimerRef.current = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - lastTranscriptTimeRef.current;

      if (timeSinceLastSpeech > SILENCE_THRESHOLD && !aiResponse) {
        const missing = getMissingInfo(extractedInfo);
        if (missing.length > 0 && conversationTurnRef.current < MAX_CONVERSATION_TURNS) {
          handleAiResponse(`I'm still here. Whenever you're ready${missing.includes('deceased') ? ' - who did you lose?' : ''}.`);
          clearInterval(silenceTimerRef.current!);
        }
      }
    }, 1000);

    return () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }
    };
  }, [isListening, hasStarted, isSpeaking, aiResponse, extractedInfo, handleAiResponse, isVoiceMode]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-16 px-8 max-w-lg w-full">
        {/* Breathing Light */}
        <div className="relative">
          {/* Outer glow ring */}
          {isListening && (
            <motion.div
              className="absolute inset-0 -m-4 rounded-full"
              style={{ backgroundColor: 'rgba(214, 211, 212, 0.2)' }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Main breathing orb */}
          <motion.div
            className="w-32 h-32 rounded-full"
            style={{
              backgroundColor: 'var(--stone-200, #d6d3d4)',
            }}
            animate={
              isListening || isProcessing
                ? {
                    scale: [1, 1.15, 1],
                    opacity: [0.7, 1, 0.7],
                  }
                : {
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.7, 0.5],
                  }
            }
            transition={{
              duration: BREATH_CYCLE_DURATION / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* AI Response / Greeting */}
        <AnimatePresence mode="wait">
          {aiResponse && (
            <motion.div
              key={aiResponse}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full text-center"
            >
              <p className="text-stone-800 dark:text-stone-200 text-xl leading-relaxed font-light">
                {aiResponse}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Transcript (voice mode) or Text Input (discretion mode) */}
        {isVoiceMode ? (
          // Voice mode: show live transcript
          transcript && !aiResponse && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="text-stone-400 dark:text-stone-500 text-base italic max-w-md text-center"
            >
              "{transcript}"
            </motion.p>
          )
        ) : (
          // Discretion mode: text input
          <div className="w-full max-w-md">
            <div className="flex gap-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleTextInput()}
                placeholder="Share what's happening..."
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-700 disabled:opacity-50"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleTextInput}
                disabled={isProcessing || !textInput.trim()}
                className="px-4 py-3 bg-black dark:bg-stone-800 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-stone-400 dark:text-stone-500 text-sm">
          {/* Listening status */}
          {isVoiceMode && isListening && (
            <div className="flex items-center gap-2">
              <motion.span
                className="w-2 h-2 bg-stone-400 dark:bg-stone-600 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span>Listening...</span>
            </div>
          )}

          {/* Speaking status */}
          {isSpeaking && <span>Speaking...</span>}

          {/* Processing status */}
          {isProcessing && <span>Thinking...</span>}

          {/* Auto-save indicator */}
          {isAutoSaving && <span>Saving...</span>}
        </div>

        {/* Error fallback */}
        {error && !browserSupportsSpeechRecognition && (
          <div className="text-center max-w-md">
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Voice input isn't supported in this browser. Please use Chrome or Edge.
            </p>
            <button
              onClick={() => {
                const text = prompt('Please share: Your name, who you lost, and your location.');
                if (text) {
                  addUserSpeech(text);
                  setCurrentTranscript(text);
                  extractEntities(text, '').then((newInfo) => {
                    setExtractedInfo(newInfo);
                    updateExtractedInfo(newInfo);
                    completeOnboarding();
                  });
                }
              }}
              className="px-6 py-2 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg"
            >
              Continue with text input
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMissingInfo(info: ExtractedInfo): string[] {
  const missing: string[] = [];
  if (!info.userName) missing.push('name');
  if (!info.deceasedName) missing.push('deceased');
  if (!info.relationship) missing.push('relationship');
  if (!info.userLocation) missing.push('location');
  return missing;
}

function getNudgeText(missing: string[]): string {
  if (missing.includes('deceased')) return ' - who did you lose?';
  if (missing.includes('name')) return ' - what should I call you?';
  if (missing.includes('relationship')) return ' - how were you related to them?';
  if (missing.includes('location')) return ' - where are you located right now?';
  return '';
}

function mapToDeceasedLocation(location?: string): 'HOME' | 'HOSPITAL' | 'OUT_OF_STATE' | 'UNKNOWN' {
  if (!location) return 'UNKNOWN';
  const loc = location.toLowerCase();
  if (loc.includes('hospital') || loc.includes('hospice') || loc.includes('facility')) return 'HOSPITAL';
  if (loc.includes('home')) return 'HOME';
  return 'OUT_OF_STATE';
}

function isSameLocation(loc1: string, loc2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  if (normalize(loc1) === normalize(loc2)) return true;
  if (loc1.toLowerCase().includes(loc2.toLowerCase())) return true;
  if (loc2.toLowerCase().includes(loc1.toLowerCase())) return true;
  return false;
}

function assessBrainFog(transcript: string): number {
  const text = transcript.toLowerCase();
  const fogIndicators = [
    "i don't know",
    'confused',
    'overwhelmed',
    "can't think",
    "don't remember",
    'everything is',
    'too much',
    'foggy',
    'numb',
    "can't focus",
    'all at once',
  ];

  const count = fogIndicators.filter((i) => text.includes(i)).length;
  if (count >= 3) return 5;
  if (count >= 2) return 4;
  if (count >= 1) return 3;
  return 2; // Baseline
}
