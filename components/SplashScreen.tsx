import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuroraBackground } from './ui/aurora-background';

interface SplashScreenProps {
  onComplete: () => void;
  ready?: boolean; // External signal that data is loaded
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, ready = true }) => {
  const [progress, setProgress] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Reveal message after a brief moment
    const messageTimer = setTimeout(() => setShowMessage(true), 500);

    // Progress animation - completes quickly when ready=true
    const duration = ready ? 1500 : 7000; // Fast if data ready, otherwise slow fallback
    const increment = ready ? 2 : 1.43;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Trigger exit animation
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onComplete(), 500); // Wait for exit animation
          }, 300);
          return 100;
        }
        return prev + increment;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(messageTimer);
    };
  }, [ready, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AuroraBackground className="fixed inset-0 z-50">
            <div className="relative z-10 flex flex-col items-center justify-center px-6 min-h-screen">
              {/* Lighthouse Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-8"
              >
                <svg className="relative w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L12 12" strokeLinecap="round" />
                  <path d="M12 12L5 20" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 12L19 20" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 20L15 20" strokeLinecap="round" />
                  <motion.g
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <path d="M12 2L8 6" strokeLinecap="round" opacity="0.5" />
                    <path d="M12 2L16 6" strokeLinecap="round" opacity="0.5" />
                  </motion.g>
                </svg>
              </motion.div>

              {/* Main Title */}
              {showMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center"
                >
                  <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-3">
                    Lighthouse
                  </h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="text-white/80 text-base md:text-lg font-light tracking-wide"
                  >
                    Guiding you through darkness into light
                  </motion.p>
                </motion.div>
              )}

              {/* Progress Bar */}
              {showMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-12 w-full max-w-xs"
                >
                  <div className="relative h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  <motion.p
                    className="text-center text-white/40 text-xs mt-4 font-light tracking-widest uppercase"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {progress < 100 ? 'Preparing your journey' : 'Welcome'}
                  </motion.p>
                </motion.div>
              )}
            </div>
          </AuroraBackground>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
