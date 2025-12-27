import { useState, useCallback, useEffect, useRef } from 'react';

interface TextToSpeechHook {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  browserSupportsSpeechSynthesis: boolean;
}

export const useTextToSpeech = (): TextToSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  const browserSupportsSpeechSynthesis =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!browserSupportsSpeechSynthesis) {
      console.warn('Text-to-speech not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure for a calm, empathetic voice
      utterance.rate = 0.85; // Slightly slower
      utterance.pitch = 0.95; // Slightly deeper
      utterance.volume = 1.0;

      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (e) => {
        console.error('TTS error:', e);
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve(); // Resolve anyway to not block
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [browserSupportsSpeechSynthesis]);

  const stop = useCallback(() => {
    if (browserSupportsSpeechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, [browserSupportsSpeechSynthesis]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: browserSupportsSpeechSynthesis,
    browserSupportsSpeechSynthesis,
  };
};

export default useTextToSpeech;
