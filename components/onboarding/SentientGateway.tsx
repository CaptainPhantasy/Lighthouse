/**
 * Phase 2: SentientGateway - The "Enter the Light" Bridge
 *
 * The user's first touch with Lighthouse v2.0.
 * A single-button entry point that transforms the app from a tool to a companion.
 *
 * Features:
 * - Discretion Toggle: Choose "Voice" or "Discretion" (text-only)
 * - Mobile-safe audio permission handling
 * - Stone palette (no gradients, no purple/indigo)
 * - Pulsing visual feedback
 * - Haptic empathy (navigator.vibrate on supported devices)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Eye, ArrowRight } from 'lucide-react';

interface SentientGatewayProps {
  onEnter: (mode: 'voice' | 'discretion') => void;
  hasCheckpoint?: boolean;
  onResumeCheckpoint?: () => void;
}

// ============================================================================
// BREATHING LIGHT CONFIGURATION
// ============================================================================

const BREATH_CYCLE_DURATION = 4000; // 4 seconds - slow, calming
const STONE_200_LIGHT = '#d6d3d4';  // Light mode
const STONE_400 = '#a8a29e';        // Mid tone
const STONE_700 = '#44403c';        // Dark tone

// ============================================================================
// COMPONENT
// ============================================================================

export default function SentientGateway({
  onEnter,
  hasCheckpoint = false,
  onResumeCheckpoint,
}: SentientGatewayProps) {
  const [selectedMode, setSelectedMode] = useState<'voice' | 'discretion' | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [audioPermissionDenied, setAudioPermissionDenied] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check for existing audio permission (only for voice mode)
  const checkAudioPermission = async (): Promise<boolean> => {
    try {
      // Try to get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If we get here, permission was granted
      stream.getTracks().forEach(track => track.stop());
      setAudioPermissionGranted(true);
      setAudioPermissionDenied(false);
      return true;
    } catch (error) {
      console.error('[SentientGateway] Audio permission denied:', error);
      setAudioPermissionDenied(true);
      setAudioPermissionGranted(false);

      // Haptic feedback for error (if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }

      return false;
    }
  };

  // Handle mode selection
  const handleModeSelect = async (mode: 'voice' | 'discretion') => {
    setSelectedMode(mode);

    // Haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    if (mode === 'voice') {
      // Request audio permission before entering
      const granted = await checkAudioPermission();
      if (granted) {
        // Brief pause for visual feedback
        setTimeout(() => onEnter('voice'), 800);
      } else {
        // Permission denied - show discretion option
        setTimeout(() => {
          setSelectedMode(null);
          setShowModeSelector(true);
        }, 1500);
      }
    } else {
      // Discretion mode - no audio needed
      setTimeout(() => onEnter('discretion'), 800);
    }
  };

  // Handle resume checkpoint
  const handleResume = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    onResumeCheckpoint?.();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black px-6">
      {/* Breathing Light Background Effect */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          opacity: [0.03, 0.08, 0.03],
        }}
        transition={{
          duration: BREATH_CYCLE_DURATION / 1000,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle at center, var(--stone-200, #d6d3d4) 0%, transparent 70%)',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 max-w-md w-full">
        {/* Breathing Orb */}
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: BREATH_CYCLE_DURATION / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 -m-8 rounded-full"
            style={{ backgroundColor: 'rgba(214, 211, 212, 0.15)' }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: BREATH_CYCLE_DURATION / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />

          {/* Main orb */}
          <div
            className="w-24 h-24 rounded-full"
            style={{
              backgroundColor: 'var(--stone-200, #d6d3d4)',
            }}
          />
        </motion.div>

        {/* Text Content */}
        <AnimatePresence mode="wait">
          {!showModeSelector && !selectedMode && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <h1 className="text-3xl font-light text-stone-800 dark:text-stone-200">
                Enter the Light
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-lg leading-relaxed">
                I'm Lighthouse. I'm here to help carry you through this.
              </p>

              {/* Resume Checkpoint Notice */}
              {hasCheckpoint && onResumeCheckpoint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 mb-4"
                >
                  <p className="text-stone-600 dark:text-stone-400 text-sm mb-3">
                    I remember your story from before.
                  </p>
                  <button
                    onClick={handleResume}
                    className="w-full px-4 py-2 bg-stone-800 dark:bg-stone-700 hover:bg-stone-700 dark:hover:bg-stone-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Continue where we left off
                  </button>
                </motion.div>
              )}

              {/* Primary Action Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowModeSelector(true)}
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-black dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-2xl transition-all duration-300"
              >
                <span>Begin</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}

          {showModeSelector && !selectedMode && (
            <motion.div
              key="mode-selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 w-full"
            >
              <div>
                <h2 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-2">
                  How would you like to share?
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Choose what feels right for you right now.
                </p>
              </div>

              {/* Mode Options */}
              <div className="space-y-4 w-full">
                {/* Voice Option */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModeSelect('voice')}
                  className="w-full flex items-center gap-4 p-5 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center group-hover:bg-stone-300 dark:group-hover:bg-stone-700 transition-colors">
                    <Mic className="w-6 h-6 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-stone-800 dark:text-stone-200">
                      Voice
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">
                      Speak naturally. I'll listen.
                    </div>
                  </div>
                </motion.button>

                {/* Discretion Option */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModeSelect('discretion')}
                  className="w-full flex items-center gap-4 p-5 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center group-hover:bg-stone-300 dark:group-hover:bg-stone-700 transition-colors">
                    <Eye className="w-6 h-6 text-stone-600 dark:text-stone-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-stone-800 dark:text-stone-200">
                      Discretion
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">
                      Text only. Quiet and private.
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Back Button */}
              <button
                onClick={() => setShowModeSelector(false)}
                className="text-stone-400 dark:text-stone-500 text-sm hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
              >
                Go back
              </button>
            </motion.div>
          )}

          {/* Audio Permission Denied */}
          {audioPermissionDenied && (
            <motion.div
              key="permission-denied"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center mx-auto">
                <Mic className="w-8 h-8 text-stone-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-light text-stone-800 dark:text-stone-200">
                  Microphone access needed
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  To use voice mode, please allow microphone access in your browser settings.
                </p>
              </div>

              {/* Discretion Fallback */}
              <button
                onClick={() => handleModeSelect('discretion')}
                className="px-6 py-3 bg-stone-800 dark:bg-stone-700 hover:bg-stone-700 dark:hover:bg-stone-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Continue with text only
              </button>

              <button
                onClick={() => {
                  setAudioPermissionDenied(false);
                  setShowModeSelector(false);
                }}
                className="text-stone-400 dark:text-stone-500 text-sm hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
              >
                Go back
              </button>
            </motion.div>
          )}

          {/* Processing State */}
          {selectedMode && !audioPermissionDenied && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center"
            >
              {/* Pulsing indicator */}
              <motion.div
                className="w-16 h-16 rounded-full mx-auto mb-4"
                style={{ backgroundColor: 'var(--stone-200, #d6d3d4)' }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <p className="text-stone-500 dark:text-stone-400">
                {selectedMode === 'voice' ? 'Connecting...' : 'Entering...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-save indicator (subtle) */}
        {isReady && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-stone-300 dark:text-stone-600 text-xs mt-8"
          >
            Your story is safe with me.
          </motion.p>
        )}
      </div>
    </div>
  );
}

// Export for use in App.tsx
export { SentientGateway };
