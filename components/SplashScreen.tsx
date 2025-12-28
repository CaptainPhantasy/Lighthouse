import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuroraBackground } from './ui/aurora-background';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Simple, reliable timing: show splash for 2 seconds then exit
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      // Call onComplete after exit animation
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 2000);

    return () => clearTimeout(exitTimer);
  }, [onComplete]);

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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-3">
                  Lighthouse
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="text-white/80 text-base md:text-lg font-light tracking-wide"
                >
                  Guiding you through darkness into light
                </motion.p>
              </motion.div>

              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-12"
              >
                <motion.p
                  className="text-center text-white/40 text-xs font-light tracking-widest uppercase"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Loading...
                </motion.p>
              </motion.div>
            </div>
          </AuroraBackground>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
