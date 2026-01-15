import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Volume2, CheckCircle } from 'lucide-react';
import { useVoicePreferences } from '../../contexts/VoicePreferenceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

interface VoiceWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceWelcomeModal: React.FC<VoiceWelcomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const { voiceEnabled, setVoiceEnabled, markWelcomeModalSeen } = useVoicePreferences();
  const { isSupported: ttsSupported } = useTextToSpeech();

  const handleGotIt = () => {
    markWelcomeModalSeen();
    onClose();
  };

  const handleToggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
            onClick={handleGotIt}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl p-8 ${
                isDark ? 'bg-stone-900 border border-stone-700' : 'bg-white border border-stone-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Mic className="w-8 h-8 text-stone-600 dark:text-stone-400" />
                </motion.div>
                <h2 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Voice is Here to Help
                </h2>
                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  When typing feels difficult, you can use your voice.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                    <Mic className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div>
                    <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      Tap the mic to speak
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      I'll transcribe what you say naturally.
                    </p>
                  </div>
                </div>

                {ttsSupported && (
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                      <Volume2 className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                    </div>
                    <div>
                      <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                        I'll read responses aloud
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        Follow along without reading if you prefer.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                    <CheckCircle className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div>
                    <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      Always optional
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      Toggle voice anytime from the header.
                    </p>
                  </div>
                </div>
              </div>

              {/* Voice Toggle Preview */}
              <div className={`flex items-center justify-center gap-4 p-4 rounded-xl mb-6 ${
                isDark ? 'bg-stone-800' : 'bg-stone-100'
              }`}>
                <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Voice guidance
                </span>
                <button
                  onClick={handleToggleVoice}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    voiceEnabled
                      ? 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-300 dark:text-stone-600'
                  }`}
                  aria-label={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {voiceEnabled ? 'On' : 'Off'}
                </span>
              </div>

              {/* Got It Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGotIt}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  isDark
                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                    : 'bg-black hover:bg-stone-800 text-white'
                }`}
              >
                Got it, thanks
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceWelcomeModal;
