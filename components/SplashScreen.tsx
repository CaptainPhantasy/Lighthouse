import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AuroraBackground } from './ui/aurora-background';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Reveal message after a brief moment
    const messageTimer = setTimeout(() => setShowMessage(true), 800);

    // Gentle loading over 7 seconds
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 800);
          return 100;
        }
        return prev + 1.43; // 100% over ~70 intervals
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(messageTimer);
    };
  }, [onComplete]);

  return (
    <AuroraBackground className="fixed inset-0 z-50">
      <div className="relative z-10 flex flex-col items-center justify-center px-6 min-h-screen">
        {/* Lighthouse Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8"
        >
          {/* Lighthouse SVG */}
          <svg className="relative w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L12 12" strokeLinecap="round" />
            <path d="M12 12L5 20" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 12L19 20" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 20L15 20" strokeLinecap="round" />
            {/* Light beams */}
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
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-3">
              Lighthouse
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="text-white/80 text-base md:text-lg font-light tracking-wide"
            >
              Guiding you through darkness into light
            </motion.p>
          </motion.div>
        )}

        {/* Gentle Progress Bar */}
        {showMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 w-full max-w-xs"
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

        {/* Decorative particles - very subtle */}
        {showMessage && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 0,
                }}
                animate={{
                  x: `${40 + Math.random() * 20}%`,
                  y: `${40 + Math.random() * 20}%`,
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AuroraBackground>
  );
};

export default SplashScreen;
