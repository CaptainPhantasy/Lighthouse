import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudioWithGemini } from '../services/geminiService';

interface SpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

interface SpeechToTextHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: (options?: SpeechToTextOptions) => void;
  stopListening: () => void;
  clearTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

/**
 * Speech-to-Text Hook with Google Cloud STT + Browser Fallback
 *
 * Primary: Google Cloud Speech-to-Text API (high accuracy, transcribes on stop)
 * Fallback: Browser SpeechRecognition (real-time interim results)
 * Works in all modern browsers.
 */
export const useSpeechToText = (): SpeechToTextHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => Promise<void>) | null>(null);
  const recognitionRef = useRef<any>(null);
  const usingCloudSttRef = useRef(false);
  const isMountedRef = useRef(true);

  // Check for microphone access
  const browserSupportsSpeechRecognition = typeof navigator !== 'undefined' && 'mediaDevices' in navigator;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up any ongoing recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Browser SpeechRecognition fallback (real-time interim results)
  const startBrowserRecognition = useCallback((options: SpeechToTextOptions) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (isMountedRef.current) {
        setError('Speech recognition not supported in this browser.');
        setIsListening(false);
      }
      return;
    }

    console.log('[useSpeechToText] Using browser SpeechRecognition fallback');

    // Clean up any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language || 'en-US';

    recognition.onresult = (event: any) => {
      if (!isMountedRef.current) return;
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      if (!isMountedRef.current) return;
      console.error('[Browser STT] Error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError(event.error || 'Speech recognition error');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!isMountedRef.current) return;
      if (!recognition.continuous) {
        setIsListening(false);
      }
    };

    recognition.start();
    setIsListening(true);
  }, []);

  const startListening = useCallback(async (options: SpeechToTextOptions = {}) => {
    if (!browserSupportsSpeechRecognition) {
      if (isMountedRef.current) {
        setError('Microphone access is not available in this browser.');
      }
      return;
    }

    // Reset state
    setError(null);
    setTranscript('');
    setIsListening(true);

    // Check if browser SpeechRecognition is available for fallback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasBrowserFallback = !!SpeechRecognition;

    // Try Google Cloud STT first (better accuracy, transcribes on stop)
    try {
      console.log('[useSpeechToText] Attempting Google Cloud Speech-to-Text...');
      usingCloudSttRef.current = true;

      const cleanup = await transcribeAudioWithGemini({
        language: options.language || 'en-US',
        onTranscript: (text: string) => {
          if (!isMountedRef.current) return;
          console.log('[useSpeechToText] Cloud STT transcript received:', text);
          setTranscript(text);
          setIsListening(false); // Cloud STT returns final result
        },
        onComplete: (finalText: string) => {
          if (!isMountedRef.current) return;
          console.log('[useSpeechToText] Cloud STT complete:', finalText);
          setTranscript(finalText);
          setIsListening(false);
        },
        onError: (err: string) => {
          if (!isMountedRef.current) return;
          console.warn('[useSpeechToText] Cloud STT error, falling back to browser:', err);
          usingCloudSttRef.current = false;
          // Auto-fallback to browser recognition
          if (hasBrowserFallback) {
            startBrowserRecognition(options);
          } else {
            setError('Speech recognition failed. Please type your response.');
            setIsListening(false);
          }
        },
      });

      cleanupRef.current = cleanup;
    } catch (err: any) {
      console.error('[useSpeechToText] Cloud STT failed, using browser fallback:', err);
      usingCloudSttRef.current = false;
      // Fall back to browser recognition
      if (hasBrowserFallback) {
        startBrowserRecognition(options);
      } else {
        if (isMountedRef.current) {
          setError('Speech recognition failed. Please type your response.');
          setIsListening(false);
        }
      }
    }
  }, [browserSupportsSpeechRecognition, startBrowserRecognition]);

  const stopListening = useCallback(async () => {
    console.log('[useSpeechToText] stopListening called, usingCloudStt:', usingCloudSttRef.current);

    // Stop Cloud STT
    if (cleanupRef.current && usingCloudSttRef.current) {
      try {
        console.log('[useSpeechToText] Stopping Cloud STT...');
        await cleanupRef.current();
      } catch (e) {
        console.error('[useSpeechToText] Error stopping Cloud STT:', e);
      }
      cleanupRef.current = null;
      usingCloudSttRef.current = false;
    }

    // Stop browser recognition and clean up event listeners
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        // Already stopped or not started
      }
      recognitionRef.current = null;
    }

    if (isMountedRef.current) {
      setIsListening(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
    browserSupportsSpeechRecognition,
  };
};

export default useSpeechToText;
