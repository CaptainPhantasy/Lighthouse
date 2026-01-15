import { useState, useCallback, useEffect, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';

interface TextToSpeechHook {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * Gemini 3 Flash Powered Text-to-Speech Hook
 *
 * Replaces browser's built-in speech synthesis with Gemini 2.0 Flash TTS.
 * Provides high-quality, empathetic voice output for guiding users.
 */
export const useTextToSpeech = (): TextToSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  // Prevent duplicate calls from React Strict Mode double effect invocation
  const speakInProgressRef = useRef(false);
  const isMountedRef = useRef(true);

  // Gemini TTS is supported if we have audio context and API key
  const isSupported = typeof window !== 'undefined' && 'AudioContext' in window;

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text?.trim() || !isMountedRef.current) return;

    // Prevent concurrent speak calls (React Strict Mode can double-invoke effects)
    if (speakInProgressRef.current) {
      console.log('[useTTS] Speak already in progress, skipping duplicate call');
      return;
    }

    // Stop any ongoing speech
    stop();

    speakInProgressRef.current = true;
    if (isMountedRef.current) {
      setIsSpeaking(true);
    }

    try {
      const audioBuffer = await generateSpeech(text);

      if (!audioBuffer) {
        console.warn('[useTTS] No audio generated, falling back to browser TTS');
        speakInProgressRef.current = false;
        if (isMountedRef.current) {
          setIsSpeaking(false);
        }
        return;
      }

      // Create AudioContext with error handling
      let ctx: AudioContext | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('AudioContext not supported');
        }
        ctx = new AudioContextClass();
      } catch (e) {
        console.error('[useTTS] AudioContext creation failed:', e);
        speakInProgressRef.current = false;
        if (isMountedRef.current) {
          setIsSpeaking(false);
        }
        return;
      }

      if (!isMountedRef.current) {
        // Component unmounted while generating speech
        try {
          ctx.close();
        } catch {}
        return;
      }

      audioContextRef.current = ctx;

      // Resume AudioContext if suspended (required by autoplay policy)
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (e) {
          console.error('[useTTS] Failed to resume AudioContext:', e);
        }
      }

      // Create a promise that resolves when audio finishes
      await new Promise<void>((resolve, reject) => {
        try {
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);

          source.onended = () => {
            speakInProgressRef.current = false;
            if (isMountedRef.current) {
              setIsSpeaking(false);
            }
            audioContextRef.current = null;
            audioSourceRef.current = null;
            resolve(); // Resolve when audio finishes
          };

          audioSourceRef.current = source;

          try {
            source.start(0);
          } catch (e) {
            console.error('[useTTS] Failed to start audio source:', e);
            speakInProgressRef.current = false;
            if (isMountedRef.current) {
              setIsSpeaking(false);
            }
            reject(e);
          }
        } catch (e) {
          reject(e);
        }
      });

    } catch (error) {
      console.error('[useTTS] Speech generation failed:', error);
      speakInProgressRef.current = false;
      if (isMountedRef.current) {
        setIsSpeaking(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    speakInProgressRef.current = false;
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {}
      audioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (isMountedRef.current) {
      setIsSpeaking(false);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
};

export default useTextToSpeech;
