import React from 'react';
import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', variant = 'default' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'minimal') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isDark ? 'bg-stone-800 text-white' : 'bg-stone-200 text-black'
        } ${className}`}
        aria-label="Toggle theme"
      >
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </motion.div>
      </motion.button>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className={`relative w-14 h-8 rounded-full flex items-center transition-colors ${
          isDark ? 'bg-black' : 'bg-stone-200'
        } ${className}`}
        aria-label="Toggle theme"
      >
        <motion.div
          className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
          animate={{ x: isDark ? 28 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-black" strokeWidth={2.5} />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" strokeWidth={2.5} />
          )}
        </motion.div>
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={toggleTheme}
      className={`relative w-20 h-10 rounded-full flex items-center transition-colors ${
        isDark ? 'bg-black' : 'bg-stone-200'
      } ${className}`}
      aria-label="Toggle theme"
    >
      <motion.div
        className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
        animate={{ x: isDark ? 42 : 6 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-black" strokeWidth={2.5} />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
        )}
      </motion.div>
      <span className={`absolute text-xs font-bold ${isDark ? 'right-3 text-white/60' : 'left-3 text-stone-500'}`}>
        {isDark ? 'DARK' : 'LIGHT'}
      </span>
    </motion.button>
  );
};

export default ThemeToggle;
