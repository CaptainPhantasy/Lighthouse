import React, { useState, useEffect } from 'react';
import { IntakeStep, UserState } from '../types';
import { TEXTS, INITIAL_USER_STATE } from '../constants';
import { ShieldCheck, MapPin, Stethoscope, User, BrainCircuit, CheckCircle, RotateCcw, Mic, MicOff } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';

interface IntakeFlowProps {
  onComplete: (data: UserState) => void;
}

const FadeIn = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-fade-in-up duration-500 ease-out">{children}</div>
);

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

  // Voice input for deceased name
  const { isListening: isListeningForVoice, transcript: voiceTranscript, startListening: startVoiceListening, stopListening: stopVoiceListening, browserSupportsSpeechRecognition } = useSpeechToText();

  // Auto-save effect
  useEffect(() => {
    localStorage.setItem('lighthouse_intake_step', step);
    localStorage.setItem('lighthouse_intake_data', JSON.stringify(formData));
  }, [step, formData]);

  const handleNext = (nextStep: IntakeStep, updates: Partial<UserState>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    
    setStep(nextStep);
    
    if (nextStep === IntakeStep.COMPLETE) {
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
  }

  const toggleVoiceInput = () => {
    if (isListeningForVoice) {
      stopVoiceListening();
    } else {
      setFormData({ ...formData, deceasedName: voiceTranscript });
      startVoiceListening({ continuous: true, interimResults: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 max-w-md mx-auto relative">
      
      {/* Progress Indicator */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full mb-8 fixed top-0 left-0 z-50">
        <div 
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-700" 
          style={{ width: `${(Object.keys(IntakeStep).indexOf(step) / 5) * 100}%` }}
        />
      </div>

      <button 
        onClick={handleReset}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        title="Reset Progress"
      >
          <RotateCcw className="w-4 h-4" />
      </button>

      {step === IntakeStep.SAFETY_CHECK && (
        <FadeIn>
          <div className="text-center space-y-6">
            <ShieldCheck className="w-16 h-16 text-blue-500 mx-auto opacity-80" />
            <h1 className="text-2xl font-serif text-slate-800">{TEXTS.safety_header}</h1>
            <p className="text-lg text-slate-600">{TEXTS.safety_question}</p>
            <div className="flex gap-4 justify-center mt-8">
              <button 
                onClick={() => handleNext(IntakeStep.IMMEDIATE_STATUS, { isSafe: true })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-blue-200"
              >
                Yes, I am safe
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-4">If not, please dial 911 immediately.</p>
          </div>
        </FadeIn>
      )}

      {step === IntakeStep.IMMEDIATE_STATUS && (
        <FadeIn>
          <div className="space-y-6">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-xl font-medium text-center text-slate-800">{TEXTS.location_question}</h2>
            <div className="space-y-3">
              {[
                { label: TEXTS.location_options.home, val: 'HOME' },
                { label: TEXTS.location_options.hospital, val: 'HOSPITAL' },
                { label: TEXTS.location_options.out_of_state, val: 'OUT_OF_STATE' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleNext(IntakeStep.LEGAL_TRIAGE, { deceasedLocation: opt.val as any })}
                  className="w-full p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-slate-700 font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {step === IntakeStep.LEGAL_TRIAGE && (
        <FadeIn>
          <div className="space-y-6">
            <Stethoscope className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-xl font-medium text-center text-slate-800">{TEXTS.legal_question}</h2>
             {formData.deceasedLocation === 'OUT_OF_STATE' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm mb-4">
                  {TEXTS.out_of_state_warning}
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleNext(IntakeStep.IDENTITY, { deathPronounced: true })}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => handleNext(IntakeStep.IDENTITY, { deathPronounced: false })}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all"
              >
                No / Not Sure
              </button>
            </div>
          </div>
        </FadeIn>
      )}

      {step === IntakeStep.IDENTITY && (
        <FadeIn>
          <div className="space-y-6 w-full">
            <User className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-xl font-medium text-center text-slate-800">{TEXTS.identity_question}</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Full Legal Name"
                value={formData.deceasedName || voiceTranscript}
                className="w-full p-4 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
              />
              {browserSupportsSpeechRecognition && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    isListeningForVoice
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isListeningForVoice ? "Stop voice input" : "Use voice input"}
                >
                  {isListeningForVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
            {isListeningForVoice && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Listening... Speak the full name</span>
                </div>
              </div>
            )}
            {voiceTranscript && formData.deceasedName === voiceTranscript && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-green-700 text-sm">Voice input recognized: "{voiceTranscript}"</p>
              </div>
            )}
            <div className="pt-4">
              <p className="text-slate-600 mb-2 text-center">{TEXTS.veteran_question}</p>
              <div className="flex gap-4 justify-center">
                 <button
                  onClick={() => handleNext(IntakeStep.BRAIN_FOG, { isVeteran: true })}
                  className={`px-6 py-2 rounded-full border transition-all ${formData.isVeteran ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-300 hover:bg-slate-50'}`}
                 >Yes</button>
                 <button
                  onClick={() => handleNext(IntakeStep.BRAIN_FOG, { isVeteran: false })}
                  className="px-6 py-2 rounded-full border border-slate-300 hover:bg-slate-50"
                 >No</button>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {step === IntakeStep.BRAIN_FOG && (
        <FadeIn>
          <div className="space-y-6 w-full text-center">
            <BrainCircuit className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-xl font-medium text-slate-800">{TEXTS.fog_question}</h2>
            <p className="text-sm text-slate-500">{TEXTS.fog_explainer}</p>
            
            <div className="flex justify-between items-center px-4">
               {[1, 2, 3, 4, 5].map((level) => (
                 <button
                  key={level}
                  onClick={() => handleNext(IntakeStep.COMPLETE, { brainFogLevel: level })}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    level > 3 ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                 >
                   {level}
                 </button>
               ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 px-4">
              <span>Clear Minded</span>
              <span>Heavy Fog</span>
            </div>
          </div>
        </FadeIn>
      )}

    </div>
  );
};

export default IntakeFlow;