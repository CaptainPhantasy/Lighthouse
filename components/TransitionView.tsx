import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import { CheckCircle, Heart, MapPin, AlertTriangle } from 'lucide-react';

interface TransitionViewProps {
  userState: UserState;
  onComplete: () => void;
}

const TransitionView: React.FC<TransitionViewProps> = ({ userState, onComplete }) => {
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    // Auto-advance after showing the summary
    const timer = setTimeout(() => {
      setShowContinue(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const getPriorityCrisis = () => {
    if (userState.deceasedLocation === 'OUT_OF_STATE' && !userState.deathPronounced) {
      return 'Body Transport';
    }
    if (userState.deceasedLocation === 'HOSPITAL' && !userState.deathPronounced) {
      return 'Hospital Release';
    }
    if (userState.deceasedLocation === 'HOME' && !userState.deathPronounced) {
      return 'Pronouncement Coordination';
    }
    return 'Initial Care Arrangements';
  };

  const getHiddenCategories = () => {
    const categories = [];
    if (userState.brainFogLevel > 3) {
      categories.push('paperwork', 'financial matters');
    }
    return categories;
  };

  const renderCrisisIcon = () => {
    switch (userState.deceasedLocation) {
      case 'OUT_OF_STATE':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'HOSPITAL':
        return <MapPin className="h-6 w-6 text-blue-500" />;
      case 'HOME':
        return <Heart className="h-6 w-6 text-red-500" />;
      default:
        return <MapPin className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
        </div>

        {/* Main message */}
        <div className="space-y-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            We have your plan ready, <span className="text-blue-600">{userState.name}</span>.
          </h1>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-center mb-4">
              {renderCrisisIcon()}
            </div>
            <p className="text-lg text-gray-700">
              Based on what you told us, we've prioritized <span className="font-semibold text-blue-600">
                {getPriorityCrisis()}
              </span> and hidden complex paperwork for now so you can focus on what matters.
            </p>
          </div>

          {/* Hidden tasks info */}
          {getHiddenCategories().length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-amber-800">
                We've temporarily hidden {getHiddenCategories().join(' and ')} to reduce cognitive load.
              </p>
            </div>
          )}

          {/* Brain fog notice */}
          {userState.brainFogLevel >= 4 && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-purple-800">
                We've simplified your experience based on your current needs. You can show more details anytime.
              </p>
            </div>
          )}
        </div>

        {/* Continue button or auto-advance message */}
        {showContinue ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">
              Your personalized Restoration Plan is ready to help you navigate this difficult time.
            </p>
            <button
              onClick={onComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 transform hover:scale-105"
            >
              Begin Your Restoration Journey
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
            <p className="text-gray-600">Preparing your personalized plan...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransitionView;