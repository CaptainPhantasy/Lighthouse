import { useState, useRef, useCallback, useEffect } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('useSpeechToText');

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
 * Speech-to-Text Hook using Browser SpeechRecognition API
 *
 * Uses the native Web Speech API for speech-to-text.
 * Provides real-time transcription with interim results.
 * Works in Chrome, Edge, and Safari.
 */
export const useSpeechToText = (): SpeechToTextHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const isMountedRef = useRef(true);

  // Check for browser SpeechRecognition API support
  const browserSupportsSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

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

  // Start listening using browser SpeechRecognition
  const startListening = useCallback((options: SpeechToTextOptions = {}) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (isMountedRef.current) {
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        setIsListening(false);
      }
      return;
    }

    // Reset state
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');

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

    logger.info('Starting browser SpeechRecognition');
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language || 'en-US';
    recognition.maxAlternatives = 1;

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

      // Accumulate final transcripts and show interim results
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        setTranscript(finalTranscriptRef.current.trim());
      } else if (interimTranscript) {
        // Show interim results appended to final transcript
        const combined = finalTranscriptRef.current + interimTranscript;
        setTranscript(combined.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (!isMountedRef.current) return;
      logger.error('[SpeechRecognition] Error:', event.error);

      let errorMessage = 'Speech recognition error.';
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please connect a microphone.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!isMountedRef.current) return;
      logger.info('[SpeechRecognition] Ended');

      // If not continuous, stop listening
      if (!recognition.continuous) {
        setIsListening(false);
      }
    };

    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    logger.info('stopListening called');

    // Stop browser recognition and clean up event listeners
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        // Already stopped or not started - ignore
      }
      recognitionRef.current = null;
    }

    if (isMountedRef.current) {
      setIsListening(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
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
