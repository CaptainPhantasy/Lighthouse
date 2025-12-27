import React, { useState, useEffect } from 'react';
import splashscreen from '../images/splashscreen.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading for 7 seconds
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          setTimeout(() => onComplete(), 500); // Small delay before switching
          return 100;
        }
        return prev + (100 / 70); // 100% over 7 seconds (70 intervals of 100ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      {/* Splash Screen Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={splashscreen}
          alt="Lighthouse"
          className="max-w-full max-h-full object-contain"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
            {/* Progress Bar */}
            <div className="w-64 h-2 bg-white bg-opacity-30 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Loading Text */}
            <p className="text-white text-sm font-medium">
              {Math.round(progress)}% Loading...
            </p>

            {/* Subtle animation */}
            <div className="mt-4 flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;