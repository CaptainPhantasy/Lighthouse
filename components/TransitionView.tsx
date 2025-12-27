import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { UserState } from '../types';
import { CheckCircle, Heart, MapPin, AlertTriangle, Sparkles, ArrowRight, Feather, Volume1, VolumeX, RotateCcw, Play, Headphones } from 'lucide-react';
import { AuroraBackground } from './ui/aurora-background';
import ColourfulText from './ui/colourful-text';
import { generateSpeech } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';

interface TransitionViewProps {
  userState: UserState;
  onComplete: () => void;
}

const TransitionView: React.FC<TransitionViewProps> = ({ userState, onComplete }) => {
  const { isDark } = useTheme();

  const [showContinue, setShowContinue] = useState(false);
  const [showPriorityCard, setShowPriorityCard] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showAudioButton, setShowAudioButton] = useState(false);
  const [audioGenerated, setAudioGenerated] = useState(false);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check for user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
          audioSourceRef.current.disconnect();
        } catch (e) {
          // Audio may have already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Generate and play speech on mount
  useEffect(() => {
    const generateAndPlaySpeech = async () => {
      const welcomeMessage = `Take a breath, ${userState.name || 'friend'}. We've heard you. You don't have to carry this alone.`;

      try {
        const buffer = await generateSpeech(welcomeMessage);
        if (buffer) {
          audioBufferRef.current = buffer;
          setAudioGenerated(true);

          // Only auto-play if user has interacted and not muted
          if (hasUserInteracted && !isMuted) {
            const played = await playAudio(buffer);
            if (!played) {
              // Auto-play was blocked, show the button
              setShowAudioButton(true);
            }
          } else {
            // No interaction yet, show the button
            setShowAudioButton(true);
          }
        }
      } catch (error) {
        console.error('Error generating speech:', error);
        // Show the button as a fallback
        setShowAudioButton(true);
      }
    };

    generateAndPlaySpeech();
  }, [userState.name, hasUserInteracted]);

  const playAudio = async (buffer: AudioBuffer): Promise<boolean> => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Try to resume the audio context if it's suspended
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (e) {
        console.error('Failed to resume audio context:', e);
        return false;
      }
    }

    // Stop any currently playing audio
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {
        // Audio may have already stopped
      }
    }

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        setAudioPlaying(false);
        audioSourceRef.current = null;
      };

      source.start(0);
      audioSourceRef.current = source;
      setAudioPlaying(true);
      return true;
    } catch (e) {
      console.error('Failed to play audio:', e);
      return false;
    }
  };

  const handleReplay = async () => {
    if (audioBufferRef.current) {
      await playAudio(audioBufferRef.current);
    }
  };

  const handleListenToMessage = async () => {
    if (audioBufferRef.current) {
      const played = await playAudio(audioBufferRef.current);
      if (played) {
        setShowAudioButton(false);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioSourceRef.current) {
      try {
        if (isMuted) {
          // Unmute - replay if we have a buffer
          if (audioBufferRef.current) {
            playAudio(audioBufferRef.current);
          }
        } else {
          // Mute - stop current audio
          audioSourceRef.current.stop();
          audioSourceRef.current.disconnect();
          audioSourceRef.current = null;
          setAudioPlaying(false);
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  };

  const getPriorityCrisis = () => {
    if (userState.deceasedLocation === 'OUT_OF_STATE' && !userState.deathPronounced) {
      return {
        title: 'Body Transport Coordination',
        description: 'We\'ll guide you through bringing your loved one home, step by step.',
        icon: AlertTriangle,
        gradient: 'from-amber-400 to-orange-400',
        bgGradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-200'
      };
    }
    if (userState.deceasedLocation === 'HOSPITAL' && !userState.deathPronounced) {
      return {
        title: 'Hospital Release Coordination',
        description: 'The hospital staff will help with pronouncement. We\'ll prepare what comes next.',
        icon: MapPin,
        gradient: 'from-blue-400 to-cyan-400',
        bgGradient: 'from-blue-50 to-cyan-50',
        borderColor: 'border-stone-300'
      };
    }
    if (userState.deceasedLocation === 'HOME' && !userState.deathPronounced) {
      return {
        title: 'Pronouncement & Transport',
        description: 'We\'ll help you contact the right authorities for home pronouncement.',
        icon: Heart,
        gradient: 'from-stone-600 to-stone-700',
        bgGradient: 'from-stone-100 to-stone-200',
        borderColor: 'border-stone-300'
      };
    }
    return {
      title: 'Initial Care Arrangements',
      description: 'Let\'s take this one step at a time. We\'re here with you.',
      icon: Heart,
      gradient: 'from-stone-700 to-stone-800',
      bgGradient: 'from-stone-100 to-stone-200',
      borderColor: 'border-stone-300'
    };
  };

  const getHiddenCategories = () => {
    const categories = [];
    if (userState.brainFogLevel > 3) {
      categories.push('paperwork', 'financial matters');
    }
    return categories;
  };

  const priority = getPriorityCrisis();
  const Icon = priority.icon;
  const hiddenCategories = getHiddenCategories();

  return (
    <AuroraBackground>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-stone-900/10 p-8 md:p-14 text-center border border-white/40"
          >
            {/* Success Icon - Gentle Pulse */}
            <motion.div
              className="flex justify-center mb-10"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="relative">
                {/* Outer glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full blur-2xl opacity-40"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-7 shadow-xl">
                  <CheckCircle className="h-16 w-16 text-white" strokeWidth={2} />
                </div>
              </div>
            </motion.div>

            {/* Compassionate Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-5 mb-10"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Feather className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-400 uppercase tracking-widest">A Moment of Relief</span>
                <Feather className="w-5 h-5 text-slate-400" />
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-2">
                {/* Fallback "Listen to message" button for autoplay blocking */}
                {showAudioButton && audioGenerated && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleListenToMessage}
                    className={`flex items-center gap-2 px-5 py-3 ${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-black hover:bg-stone-800'} text-white rounded-full transition-colors shadow-lg`}
                  >
                    <Headphones className="w-5 h-5" />
                    <span className="font-medium">Listen to a message</span>
                  </motion.button>
                )}

                {/* Standard audio controls when audio is playing or was played */}
                {!showAudioButton && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleMute}
                      className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-200"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-black" />
                      ) : (
                        <Volume1 className="w-4 h-4 text-black" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReplay}
                      disabled={!audioBufferRef.current}
                      className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Replay message"
                    >
                      <RotateCcw className="w-4 h-4 text-black" />
                    </motion.button>
                    {audioPlaying && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-stone-700 flex items-center gap-1"
                      >
                        <span className="relative flex h-2 w-2">
                          <motion.span
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="absolute inline-flex h-full w-full rounded-full bg-stone-400"
                          />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-500" />
                        </span>
                        Playing
                      </motion.span>
                    )}
                  </>
                )}
              </div>

              <h1 className={`text-3xl md:text-4xl font-light leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Take a breath, <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{userState.name || 'friend'}</span>.
              </h1>
              <p className={`text-lg max-w-md mx-auto leading-relaxed ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                We've heard everything you shared. You don't have to carry this alone anymore.
              </p>
            </motion.div>

            {/* Priority Card */}
            {showPriorityCard && (
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-10"
              >
                <div className={`bg-gradient-to-br ${priority.bgGradient} rounded-3xl p-8 border-2 ${priority.borderColor} shadow-lg`}>
                  <motion.div
                    className="flex justify-center mb-5"
                    animate={{ rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${priority.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" strokeWidth={2} />
                    </div>
                  </motion.div>

                  <p className={`text-sm uppercase tracking-wide mb-2 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>Your Focus Right Now</p>
                  <p className={`text-2xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {priority.title}
                  </p>
                  <p className={isDark ? 'text-stone-400 leading-relaxed' : 'text-slate-600 leading-relaxed'}>
                    {priority.description}
                  </p>

                  {/* Hidden tasks notice */}
                  {hiddenCategories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-5 bg-white/60 rounded-2xl p-4 text-sm text-slate-600 border border-white/60"
                    >
                      We've temporarily hidden <strong>{hiddenCategories.join(' and ')}</strong> so you can focus on what matters most.
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Brain Fog Acknowledgment */}
            {userState.brainFogLevel >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="bg-stone-100 rounded-2xl p-5 border border-stone-200 mb-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <p className="text-stone-700 text-sm text-left">
                    We've simplified everything to help you through this, one moment at a time.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Continue Button */}
            {showContinue && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <p className="text-slate-500 mb-6">
                  Your personalized restoration plan is ready when you are.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onComplete}
                  className="group w-full bg-black hover:bg-stone-800 text-white font-medium py-5 px-8 rounded-2xl transition-all duration-500 shadow-lg flex items-center justify-center gap-4"
                >
                  <span>Begin Your Restoration Journey</span>
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-5 h-5" strokeWidth={2} />
                  </motion.div>
                </motion.button>

                <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  You can always return here
                </p>
              </motion.div>
            )}

            {/* Loading State */}
            {!showContinue && (
              <motion.div
                className="space-y-5 py-8"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="h-1.5 bg-slate-200 rounded-full w-3/4 mx-auto overflow-hidden">
                  <motion.div
                    className="h-full bg-black"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.5, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-slate-500">Preparing your personalized plan...</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default TransitionView;
