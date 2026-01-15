import React from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { useVoicePreferences } from '../../contexts/VoicePreferenceContext';
import { useTheme } from '../../contexts/ThemeContext';

interface VoiceToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 p-1.5',
  md: 'w-9 h-9 p-2',
  lg: 'w-10 h-10 p-2.5',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const VoiceToggle: React.FC<VoiceToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'md',
}) => {
  const { isDark } = useTheme();
  const { voiceEnabled, setVoiceEnabled } = useVoicePreferences();

  const handleClick = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`rounded-full transition-colors ${
        voiceEnabled
          ? 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
          : 'bg-stone-200 dark:bg-stone-700 text-stone-300 dark:text-stone-600'
      } ${sizeClasses[size]} ${className}`}
      title={voiceEnabled ? 'Voice guidance on' : 'Voice guidance off'}
      aria-label={voiceEnabled ? 'Voice guidance enabled' : 'Voice guidance disabled'}
      aria-pressed={voiceEnabled}
    >
      {voiceEnabled ? (
        <Volume2 className={iconSizes[size]} />
      ) : (
        <VolumeX className={iconSizes[size]} />
      )}
    </motion.button>
  );
};

export default VoiceToggle;
