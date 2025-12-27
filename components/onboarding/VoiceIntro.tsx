/**
 * Phase 2: Sentient Onboarding - VoiceIntro
 *
 * A zero-friction, voice-first onboarding experience.
 * No buttons. No forms. Just a breathing light and a listening presence.
 *
 * The AI silently extracts:
 * - userName, deceasedName, relationship
 * - userLocation, deceasedLocation
 * - wishesKnowledgeLevel
 *
 * Only nudges for missing details after 5s of silence.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import useSpeechToText from '@/hooks/useSpeechToText';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { setStoryContext } from '@/services/geminiService';
import { UserState, WishesKnowledgeLevel } from '@/types';
import { deepResearchInterstateTransport, DeepResearchItinerary } from '@/services/geminiService';

// ============================================================================
// TYPES
// ============================================================================

interface VoiceIntroProps {
  onComplete: (userState: Partial<UserState>) => void;
}

interface ExtractedInfo {
  userName?: string;
  deceasedName?: string;
  relationship?: string;
  userLocation?: string;
  deceasedLocation?: string;
  wishesKnowledgeLevel?: WishesKnowledgeLevel;
}

// ============================================================================
// BREATHING ANIMATION CONFIGURATION
// ============================================================================

const BREATH_CYCLE_DURATION = 4000; // 4 seconds per breath - slow, calming
const STONE_200_LIGHT = '#d6d3d4';  // Light mode
const STONE_200_DARK = '#292524';   // Dark mode

// ============================================================================
// SENTIENT ONBOARDING COMPONENT
// ============================================================================

export default function VoiceIntro({ onComplete }: VoiceIntroProps) {
  // State
  const [aiResponse, setAiResponse] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({});
  const [hasStarted, setHasStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationTurnRef = useRef(0);

  // Speech hooks
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition
  } = useSpeechToText();

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported
  } = useTextToSpeech();

  // ============================================================================
  // GREETING - The Handshake
  // ============================================================================

  const GREETING = `I'm Lighthouse. I'm here.

Tell me a bit about what's happening, who you lost, and where you are right now.

Take your time. I'm listening.`;

  // Speak the greeting on mount
  useEffect(() => {
    if (ttsSupported && !hasStarted) {
      speak(GREETING).then(() => {
        setHasStarted(true);
        // Start listening after greeting
        setTimeout(() => {
          startListening();
        }, 1000);
      });
    } else if (!ttsSupported && !hasStarted) {
      // Fallback: show greeting text and start listening
      setAiResponse(GREETING);
      setHasStarted(true);
      startListening();
    }

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  // ============================================================================
  // ENTITY EXTRACTION - Silent Analysis via gemini-3-flash
  // ============================================================================

  const extractEntities = useCallback(async (text: string): Promise<ExtractedInfo> => {
    const extractionPrompt = `Extract information from this text. Return ONLY valid JSON:

Text: "${text}"

Return format:
{
  "userName": "user's name or null",
  "deceasedName": "deceased person's name or null",
  "relationship": "spouse/child/parent/sibling/friend/other or null",
  "userLocation": "city, state where user is or null",
  "deceasedLocation": "where deceased is located (home/hospital/city/state) or null",
  "wishesKnowledgeLevel": "NONE" (no wishes known), "VAGUE" (some ideas), "CLEAR" (written/final wishes) or null
}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: extractionPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        })
      });

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

  const handleAiResponse = useCallback(async (responseText: string) => {
    setAiResponse(responseText);
    stopListening();

    if (ttsSupported) {
      await speak(responseText);
    }

    // Check if we have required info
    const hasRequired =
      extractedInfo.userName &&
      extractedInfo.deceasedName &&
      extractedInfo.relationship &&
      extractedInfo.userLocation;

    if (hasRequired) {
      // Complete onboarding after a brief pause
      setTimeout(() => {
        completeOnboarding();
      }, 1500);
    } else {
      // Resume listening
      setTimeout(() => {
        startListening();
      }, 500);
    }
  }, [extractedInfo, speak, startListening, stopListening, ttsSupported]);

  // ============================================================================
  // COMPLETE ONBOARDING
  // ============================================================================

  const completeOnboarding = useCallback(async () => {
    const fullTranscript = `User: ${userTranscript}\n\nLighthouse: ${aiResponse}`;

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

    // Cache story context
    setStoryContext(fullTranscript);

    // Check for interstate scenario
    if (extractedInfo.userLocation && extractedInfo.deceasedLocation) {
      const isInterstate = !isSameLocation(extractedInfo.userLocation, extractedInfo.deceasedLocation);

      if (isInterstate) {
        console.log('[VoiceIntro] Interstate detected - Deep Research initiated');
        const itinerary = await deepResearchInterstateTransport(
          extractedInfo.userLocation,
          extractedInfo.deceasedLocation
        );
        if (itinerary) {
          (userState as any).interstateItinerary = itinerary;
        }
      }
    }

    onComplete(userState);
  }, [extractedInfo, userTranscript, aiResponse, onComplete]);

  // ============================================================================
  // PROCESS FINAL TRANSCRIPTS
  // ============================================================================

  useEffect(() => {
    if (!isListening && transcript && !isProcessing) {
      setIsProcessing(true);

      // Save transcript
      setUserTranscript(prev => prev + (prev ? ' ' : '') + transcript);

      // Extract entities
      extractEntities(transcript).then(newInfo => {
        setExtractedInfo(prev => ({ ...prev, ...newInfo }));
        conversationTurnRef.current++;

        // Determine AI response
        const missing = getMissingInfo({ ...extractedInfo, ...newInfo });
        const turn = conversationTurnRef.current;

        let responseText = '';
        if (missing.length === 0) {
          responseText = `Thank you for sharing that with me. I understand you're ${newInfo.relationship} to ${newInfo.deceasedName}, and you're in ${newInfo.userLocation}. I'm ready to help you through this. Take a breath.`;
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
      // Reset silence detection
      lastTranscriptTimeRef.current = Date.now();
    }
  }, [isListening, transcript, isProcessing, extractedInfo, extractEntities, handleAiResponse]);

  // ============================================================================
  // SILENCE DETECTION (5 seconds)
  // ============================================================================

  const lastTranscriptTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isListening || !hasStarted || isSpeaking) return;

    silenceTimerRef.current = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - lastTranscriptTimeRef.current;

      if (timeSinceLastSpeech > 5000 && !aiResponse) {
        // 5 seconds of silence - gentle nudge
        const missing = getMissingInfo(extractedInfo);
        if (missing.length > 0 && conversationTurnRef.current < 3) {
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
  }, [isListening, hasStarted, isSpeaking, aiResponse, extractedInfo, handleAiResponse]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-16 px-8">
        {/* Breathing Light - Stone-200 */}
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
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7],
            }}
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
              className="max-w-lg text-center"
            >
              <p className="text-stone-800 dark:text-stone-200 text-xl leading-relaxed font-light">
                {aiResponse}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Transcript (subtle) */}
        {transcript && !aiResponse && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="text-stone-400 dark:text-stone-500 text-base italic max-w-md text-center"
          >
            "{transcript}"
          </motion.p>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
          {isListening && (
            <>
              <motion.span
                className="w-2 h-2 bg-stone-400 dark:bg-stone-600 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm">Listening...</span>
            </>
          )}
          {isSpeaking && (
            <span className="text-sm">Speaking...</span>
          )}
        </div>

        {/* Error fallback */}
        {error && !browserSupportsSpeechRecognition && (
          <div className="text-center max-w-md">
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Voice input isn't supported in this browser. Please use Chrome or Edge.
            </p>
            <button
              onClick={() => {
                const text = prompt("Please share: Your name, who you lost, and your location.");
                if (text) {
                  setUserTranscript(text);
                  extractEntities(text).then(newInfo => {
                    setExtractedInfo(newInfo);
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
    "i don't know", "confused", "overwhelmed", "can't think",
    "don't remember", "everything is", "too much", "foggy",
    "numb", "can't focus", "all at once"
  ];

  const count = fogIndicators.filter(i => text.includes(i)).length;
  if (count >= 3) return 5;
  if (count >= 2) return 4;
  if (count >= 1) return 3;
  return 2; // Baseline
}
