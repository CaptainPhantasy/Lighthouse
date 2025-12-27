import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserState } from '../types';
import { CheckCircle, Heart, MapPin, AlertTriangle, Sparkles, ArrowRight, Feather } from 'lucide-react';
import { AuroraBackground } from './ui/aurora-background';
import { ColourfulText } from './ui/colourful-text';

interface TransitionViewProps {
  userState: UserState;
  onComplete: () => void;
}

const TransitionView: React.FC<TransitionViewProps> = ({ userState, onComplete }) => {
  const [showContinue, setShowContinue] = useState(false);
  const [showPriorityCard, setShowPriorityCard] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowPriorityCard(true), 800);
    const timer2 = setTimeout(() => setShowContinue(true), 2500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

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
              <h1 className="text-3xl md:text-4xl font-light text-slate-800 leading-tight">
                Take a breath, <span className="font-semibold text-black">{userState.name || 'friend'}</span>.
              </h1>
              <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
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

                  <p className="text-sm text-slate-500 uppercase tracking-wide mb-2">Your Focus Right Now</p>
                  <p className="text-2xl font-semibold text-slate-800 mb-3">
                    {priority.title}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
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
                    <Sparkles className="w-5 h-5 text-stone-600" />
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
