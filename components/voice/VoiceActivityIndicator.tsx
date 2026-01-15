import React from 'react';
import { motion } from 'motion/react';
import { Mic, Volume2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export type VoiceActivityState = 'idle' | 'listening' | 'speaking';

interface VoiceActivityIndicatorProps {
  state: VoiceActivityState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const ringSizes = {
  sm: 'w-8 h-8 -m-1',
  md: 'w-10 h-10 -m-1',
  lg: 'w-12 h-12 -m-1',
};

export const VoiceActivityIndicator: React.FC<VoiceActivityIndicatorProps> = ({
  state = 'idle',
  size = 'md',
  className = '',
}) => {
  const { isDark } = useTheme();

  if (state === 'idle') {
    return null;
  }

  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Pulse ring */}
      {(isListening || isSpeaking) && (
        <motion.div
          className={`absolute rounded-full ${ringSizes[size]} ${
            isListening
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-stone-200 dark:bg-stone-700'
          }`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main icon container */}
      <motion.div
        className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]} ${
          isListening
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
        }`}
        animate={
          isListening || isSpeaking
            ? {
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {isListening ? (
          <Mic className={iconSizes[size]} />
        ) : (
          <Volume2 className={iconSizes[size]} />
        )}
      </motion.div>
    </div>
  );
};

export default VoiceActivityIndicator;
