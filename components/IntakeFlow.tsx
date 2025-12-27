import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IntakeStep, UserState } from '../types';
import { TEXTS, INITIAL_USER_STATE } from '../constants';
import { ShieldCheck, MapPin, Stethoscope, User, BrainCircuit, CheckCircle, RotateCcw, Mic, MicOff } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';
import { AuroraBackground } from './ui/aurora-background';
import { MultiStepLoader } from './ui/multi-step-loader';
import ColourfulText from './ui/colourful-text';

interface IntakeFlowProps {
  onComplete: (data: UserState) => void;
}

// Progress steps for the multi-step loader
const STEPS = [
  { label: 'Safety', icon: ShieldCheck },
  { label: 'Location', icon: MapPin },
  { label: 'Legal', icon: Stethoscope },
  { label: 'Identity', icon: User },
  { label: 'Comfort', icon: BrainCircuit },
];

// Loading states for MultiStepLoader
const LOADING_STATES = [
  { text: "Creating your personalized plan" },
  { text: "Understanding your situation" },
  { text: "Preparing compassionate guidance" },
  { text: "Almost ready..." },
];

// Elegant card wrapper
const GracefulCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.98 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-900/5 border border-white/20 p-8 ${className}`}
  >
    {children}
  </motion.div>
);

// Compassionate button with smooth animations
const CompassionateButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gentle';
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false, fullWidth = false }) => {
  const baseStyles = "rounded-2xl font-medium transition-all duration-500 transform";
  const widthClass = fullWidth ? "w-full" : "";

  const variantStyles = {
    primary: "bg-black hover:bg-stone-800 text-white shadow-lg",
    secondary: "bg-white/80 hover:bg-white border-2 border-stone-200 hover:border-stone-300 hover:shadow-lg text-stone-700 backdrop-blur-sm",
    gentle: "bg-stone-100/80 hover:bg-stone-200/80 text-stone-600 backdrop-blur-sm",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthClass} px-6 py-3.5 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </motion.button>
  );
};

const IntakeFlow: React.FC<IntakeFlowProps> = ({ onComplete }) => {
  // Initialize state from localStorage if available
  const [step, setStep] = useState<IntakeStep>(() => {
    if (typeof window !== 'undefined') {
        const savedStep = localStorage.getItem('lighthouse_intake_step');
        return (savedStep as IntakeStep) || IntakeStep.SAFETY_CHECK;
    }
    return IntakeStep.SAFETY_CHECK;
  });

  const [formData, setFormData] = useState<UserState>(() => {
    if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('lighthouse_intake_data');
        return savedData ? JSON.parse(savedData) : INITIAL_USER_STATE;
    }
    return INITIAL_USER_STATE;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  // Voice input for deceased name
  const { isListening: isListeningForVoice, transcript: voiceTranscript, startListening: startVoiceListening, stopListening: stopVoiceListening, browserSupportsSpeechRecognition } = useSpeechToText();

  // Auto-save effect
  useEffect(() => {
    localStorage.setItem('lighthouse_intake_step', step);
    localStorage.setItem('lighthouse_intake_data', JSON.stringify(formData));
  }, [step, formData]);

  const handleNext = (nextStep: IntakeStep, updates: Partial<UserState>) => {
    const newData = { ...formData, ...updates };

    // Show loader during transition
    if (nextStep !== IntakeStep.COMPLETE) {
      setShowLoader(true);
      setTimeout(() => {
        setFormData(newData);
        setStep(nextStep);
        setShowLoader(false);
      }, 1200);
    } else {
      setFormData(newData);
      setStep(nextStep);
      onComplete(newData);
    }
  };

  const handleReset = () => {
      if(confirm("Are you sure you want to restart? This will clear your current progress.")) {
          localStorage.removeItem('lighthouse_intake_step');
          localStorage.removeItem('lighthouse_intake_data');
          setStep(IntakeStep.SAFETY_CHECK);
          setFormData(INITIAL_USER_STATE);
      }
  };

  const toggleVoiceInput = () => {
    if (isListeningForVoice) {
      stopVoiceListening();
    } else {
      setFormData({ ...formData, deceasedName: voiceTranscript });
      startVoiceListening({ continuous: true, interimResults: true });
    }
  };

  // Get current step index for progress
  const stepIndex = Object.values(IntakeStep).indexOf(step);
  const isMinimalistMode = formData.brainFogLevel >= 4;

  return (
    <>
      <MultiStepLoader
        loadingStates={LOADING_STATES}
        loading={showLoader}
        duration={1000}
        loop={false}
      />
      <AuroraBackground>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        {/* Fixed progress indicator - elegant top bar */}
        {!isMinimalistMode && (
          <div className="fixed top-0 left-0 right-0 z-40 px-6 pt-6">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isComplete = i < stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <React.Fragment key={s.label}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            isComplete ? 'bg-black text-white shadow-lg' :
                            isCurrent ? 'bg-white text-black shadow-lg ring-2 ring-stone-300' :
                            'bg-white/40 text-slate-400'
                          }`}
                          animate={isCurrent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                          transition={{ duration: 2, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }}
                        >
                          {isComplete ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </motion.div>
                        <span className={`text-xs mt-1.5 font-medium hidden sm:block transition-colors ${
                          isCurrent ? 'text-white' : 'text-white/60'
                        }`}>
                          {s.label}
                        </span>
                      </motion.div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 mx-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white"
                            initial={{ width: i < stepIndex ? '100%' : '0%' }}
                            animate={{ width: i < stepIndex ? '100%' : '0%' }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Reset button - subtle */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleReset}
          className="absolute top-6 right-6 text-white/40 hover:text-white/80 transition-colors z-40"
          title="Reset Progress"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>

        {/* Main content area */}
        <div className="w-full max-w-md mx-auto mt-16">
          <AnimatePresence mode="wait">
            {step === IntakeStep.SAFETY_CHECK && (
              <GracefulCard key="safety">
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <ShieldCheck className="w-10 h-10 text-black" />
                </motion.div>
                <h1 className="text-2xl font-light text-slate-800 text-center mb-2">
                  <ColourfulText text={TEXTS.safety_header} />
                </h1>
                <p className="text-slate-500 text-center mb-8 leading-relaxed">
                  {TEXTS.safety_question}
                </p>
                <CompassionateButton
                  onClick={() => handleNext(IntakeStep.IMMEDIATE_STATUS, { isSafe: true })}
                  variant="primary"
                  fullWidth
                  className="py-4 text-lg"
                >
                  I am safe
                </CompassionateButton>
                <p className="text-center text-slate-400 text-sm mt-4">
                  If you are not safe, please dial 911
                </p>
              </GracefulCard>
            )}

            {step === IntakeStep.IMMEDIATE_STATUS && (
              <GracefulCard key="location" delay={0.1}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <MapPin className="w-8 h-8 text-black" />
                </motion.div>
                <h2 className="text-xl font-light text-slate-800 text-center mb-6">
                  <ColourfulText text={TEXTS.location_question} />
                </h2>
                <div className="space-y-3">
                  {[
                    { label: TEXTS.location_options.home, val: 'HOME' as const, emoji: '🏠' },
                    { label: TEXTS.location_options.hospital, val: 'HOSPITAL' as const, emoji: '🏥' },
                    { label: TEXTS.location_options.out_of_state, val: 'OUT_OF_STATE' as const, emoji: '✈️' },
                  ].map((opt, idx) => (
                    <motion.button
                      key={opt.val}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNext(IntakeStep.LEGAL_TRIAGE, { deceasedLocation: opt.val })}
                      className="w-full p-4 bg-gradient-to-r from-white/50 to-white/30 hover:from-white/80 hover:to-white/60 border border-slate-200/50 hover:border-stone-300 rounded-2xl text-left transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div>
                          <div className="font-medium text-slate-700">{opt.label}</div>
                          <div className="text-xs text-slate-400 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            {opt.val === 'HOME' && TEXTS.location_acknowledgments.home}
                            {opt.val === 'HOSPITAL' && TEXTS.location_acknowledgments.hospital}
                            {opt.val === 'OUT_OF_STATE' && TEXTS.location_acknowledgments.out_of_state}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </GracefulCard>
            )}

            {step === IntakeStep.LEGAL_TRIAGE && (
              <GracefulCard key="legal" delay={0.1}>
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Stethoscope className="w-8 h-8 text-black" />
                </div>

                {/* Acknowledgment message */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-stone-100 border border-stone-200 p-4 rounded-2xl text-center mb-6"
                >
                  <p className="text-black text-sm">
                    {formData.deceasedLocation === 'HOME' && TEXTS.location_acknowledgments.home}
                    {formData.deceasedLocation === 'HOSPITAL' && TEXTS.location_acknowledgments.hospital}
                    {formData.deceasedLocation === 'OUT_OF_STATE' && TEXTS.location_acknowledgments.out_of_state}
                  </p>
                </motion.div>

                <h2 className="text-xl font-light text-slate-800 text-center mb-4">
                  <ColourfulText text={TEXTS.legal_question} />
                </h2>

                {formData.deceasedLocation === 'OUT_OF_STATE' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-700 text-sm text-center mb-6"
                  >
                    {TEXTS.out_of_state_warning}
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <CompassionateButton
                    onClick={() => handleNext(IntakeStep.IDENTITY, { deathPronounced: true })}
                    variant="secondary"
                  >
                    Yes
                  </CompassionateButton>
                  <CompassionateButton
                    onClick={() => handleNext(IntakeStep.IDENTITY, { deathPronounced: false })}
                    variant="secondary"
                  >
                    No / Not Sure
                  </CompassionateButton>
                </div>
              </GracefulCard>
            )}

            {step === IntakeStep.IDENTITY && (
              <GracefulCard key="identity" delay={0.1}>
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-xl font-light text-slate-800 text-center mb-6">
                  <ColourfulText text={TEXTS.identity_question} />
                </h2>

                <div className="relative mb-6">
                  <PlaceholdersAndVanishInput
                    placeholders={["Enter their full legal name...", "Their name as it appears on documents"]}
                    value={formData.deceasedName || voiceTranscript}
                    onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                    className="w-full"
                  />
                  {browserSupportsSpeechRecognition && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 rounded-xl transition-all duration-300 ${
                        isListeningForVoice
                          ? 'bg-red-100 text-red-500 hover:bg-red-200 shadow-lg shadow-red-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={isListeningForVoice ? "Stop voice input" : "Use voice input"}
                    >
                      {isListeningForVoice ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </motion.button>
                  )}
                </div>

                {isListeningForVoice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-stone-100 border border-stone-200 rounded-2xl p-4 text-center mb-4"
                  >
                    <div className="flex items-center justify-center gap-2 text-black">
                      <motion.div
                        className="w-2 h-2 bg-black rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-sm">Listening... Speak the full name</span>
                    </div>
                  </motion.div>
                )}

                {voiceTranscript && formData.deceasedName === voiceTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center mb-4"
                  >
                    <p className="text-green-700 text-sm">"{voiceTranscript}"</p>
                  </motion.div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-slate-500 mb-4 text-center text-sm">{TEXTS.veteran_question}</p>
                  <div className="flex gap-4">
                    <CompassionateButton
                      onClick={() => handleNext(IntakeStep.BRAIN_FOG, { isVeteran: true })}
                      variant="secondary"
                      className="flex-1"
                    >
                      Yes
                    </CompassionateButton>
                    <CompassionateButton
                      onClick={() => handleNext(IntakeStep.BRAIN_FOG, { isVeteran: false })}
                      variant="secondary"
                      className="flex-1"
                    >
                      No
                    </CompassionateButton>
                  </div>
                </div>
              </GracefulCard>
            )}

            {step === IntakeStep.BRAIN_FOG && (
              <GracefulCard key="brainfog" delay={0.1}>
                <motion.div
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <BrainCircuit className="w-8 h-8 text-black" />
                </motion.div>
                <h2 className="text-xl font-light text-slate-800 text-center mb-2">
                  <ColourfulText text={TEXTS.fog_question} />
                </h2>
                <p className="text-sm text-slate-500 text-center mb-8">
                  {TEXTS.fog_explainer}
                </p>

                <div className="flex justify-between items-center px-2 mb-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.1, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNext(IntakeStep.COMPLETE, { brainFogLevel: level })}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 shadow-md ${
                        level > 3
                          ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 px-2 mb-6">
                  <span>Clear</span>
                  <span>Foggy</span>
                </div>

                {isMinimalistMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stone-100 border border-stone-200 p-4 rounded-2xl"
                  >
                    <p className="text-black text-sm">{TEXTS.fog_minimal_message}</p>
                  </motion.div>
                )}
              </GracefulCard>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuroraBackground>
    </>
  );
};

export default IntakeFlow;
