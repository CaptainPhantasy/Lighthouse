import React, { useState, useEffect } from 'react';
import { getLocalProbateRequirements, getDualJurisdictionProbate, DualJurisdictionProbateResult } from '../services/geminiService';
import { UserState } from '../types';
import { MapPin, Clock, FileText, AlertTriangle, CheckCircle, Loader2, ArrowRight, GitCompare, Layers } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LocalLegalGuideProps {
  userState: UserState;
}

interface ProbateInfo {
  location: string;
  requirements: string;
  timeframe: string;
  documents: string[];
  notes?: string;
  isLoading?: boolean;
  error?: string;
}

interface DualJurisdictionInfo {
  result: DualJurisdictionProbateResult;
  isLoading?: boolean;
  error?: string;
}

const LocalLegalGuide: React.FC<LocalLegalGuideProps> = ({ userState }) => {
  const { isDark } = useTheme();

  const [probateInfo, setProbateInfo] = useState<ProbateInfo>({
    location: '',
    requirements: '',
    timeframe: '',
    documents: [],
    isLoading: true,
    error: null
  });

  const [dualJurisdictionInfo, setDualJurisdictionInfo] = useState<DualJurisdictionInfo | null>(null);

  // Phase 2: Check if locations differ for dual-jurisdiction analysis
  const locationsDiffer = userState.userLocation &&
    userState.deceasedLocation &&
    userState.userLocation.toLowerCase() !== userState.deceasedLocation.toLowerCase();

  useEffect(() => {
    const fetchLegalInfo = async () => {
      if (!userState.deceasedLocation) return;

      setProbateInfo(prev => ({ ...prev, isLoading: true, error: null }));
      setDualJurisdictionInfo(null);

      try {
        // Phase 2: Dual-Jurisdiction Engine
        if (locationsDiffer && userState.userLocation) {
          console.log('[LocalLegalGuide] Using Dual-Jurisdiction analysis');
          const dualResult = await getDualJurisdictionProbate(
            userState.userLocation,
            userState.deceasedLocation
          );

          if (dualResult) {
            setDualJurisdictionInfo({ result: dualResult, isLoading: false });
            setProbateInfo({
              location: `${userState.userLocation} ↔ ${userState.deceasedLocation}`,
              requirements: dualResult.overlap.recommendedPath,
              timeframe: `Varies by jurisdiction. See details below.`,
              documents: dualResult.overlap.sharedDocuments,
              notes: dualResult.summary,
              isLoading: false
            });
            return;
          }
        }

        // Fallback to single jurisdiction
        const info = await getLocalProbateRequirements(userState.deceasedLocation);
        setProbateInfo({
          location: userState.deceasedLocation,
          requirements: info.requirements,
          timeframe: info.timeframe,
          documents: info.documents,
          notes: info.notes,
          isLoading: false
        });
      } catch (error) {
        setProbateInfo(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unable to retrieve legal requirements. Please check with your local court.'
        }));
      }
    };

    // Only fetch for users with brain fog level < 4
    if (userState.brainFogLevel < 4) {
      fetchLegalInfo();
    }
  }, [userState.deceasedLocation, userState.userLocation, userState.brainFogLevel, locationsDiffer]);

  // Only show for users with brain fog level < 4
  if (userState.brainFogLevel >= 4) {
    return null;
  }

  if (probateInfo.isLoading) {
    return (
      <div className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'} rounded-xl p-6`}>
        <div className="flex items-center gap-3">
          <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
          <p className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>Loading local legal requirements...</p>
        </div>
      </div>
    );
  }

  if (probateInfo.error) {
    return (
      <div className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'} rounded-xl p-6`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-white' : 'text-black'}`} />
          <div>
            <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Local Legal Guide</h3>
            <p className={`text-sm mb-3 ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>
              {probateInfo.error}
            </p>
            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
              <MapPin className="w-3 h-3" />
              <span>For {userState.deceasedLocation}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Dual-Jurisdiction View
  if (dualJurisdictionInfo && dualJurisdictionInfo.result) {
    return (
      <div className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} rounded-xl p-6 shadow-sm`}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-100'} p-2 rounded-lg`}>
            <GitCompare className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Interstate Probate Guide</h3>
            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
              <span>{userState.userLocation} ↔ {userState.deceasedLocation}</span>
              <span className={`${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'} px-2 py-1 rounded-full`}>
                Dual Jurisdiction
              </span>
            </div>
          </div>
        </div>

        {/* Summary - TTS optimized */}
        {dualJurisdictionInfo.result.summary && (
          <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-100'} p-4 rounded-xl mb-4`}>
            <p className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>
              {dualJurisdictionInfo.result.summary}
            </p>
          </div>
        )}

        {/* Two-column comparison */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* User Jurisdiction */}
          <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-50'} p-4 rounded-xl`}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} />
              <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                Your Location
              </h4>
            </div>
            <p className={`text-xs mb-2 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              {dualJurisdictionInfo.result.userJurisdiction.location}
            </p>
            <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              {dualJurisdictionInfo.result.userJurisdiction.requirements}
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
              Timeline: {dualJurisdictionInfo.result.userJurisdiction.timeframe}
            </p>
          </div>

          {/* Deceased Jurisdiction */}
          <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-50'} p-4 rounded-xl`}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} />
              <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                Where They Passed
              </h4>
            </div>
            <p className={`text-xs mb-2 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              {dualJurisdictionInfo.result.deceasedJurisdiction.location}
            </p>
            <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              {dualJurisdictionInfo.result.deceasedJurisdiction.requirements}
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
              Timeline: {dualJurisdictionInfo.result.deceasedJurisdiction.timeframe}
            </p>
          </div>
        </div>

        {/* Overlap Section */}
        <div className={`${isDark ? 'border-stone-700' : 'border-stone-200'} border-t pt-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Layers className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
            <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}>Recommended Path</h4>
          </div>
          <p className={`text-sm leading-relaxed mb-3 ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>
            {dualJurisdictionInfo.result.overlap.recommendedPath}
          </p>

          {/* Shared Documents */}
          {dualJurisdictionInfo.result.overlap.sharedDocuments.length > 0 && (
            <div className="mb-3">
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                Documents valid in both states:
              </p>
              <div className="flex flex-wrap gap-2">
                {dualJurisdictionInfo.result.overlap.sharedDocuments.map((doc, i) => (
                  <span
                    key={i}
                    className={`${isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'} px-3 py-1 rounded-full text-xs`}
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conflicts */}
          {dualJurisdictionInfo.result.overlap.conflictingRequirements.length > 0 && (
            <div className={`${isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} border p-3 rounded-xl`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                Important Differences:
              </p>
              <ul className="space-y-1">
                {dualJurisdictionInfo.result.overlap.conflictingRequirements.map((conflict, i) => (
                  <li key={i} className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    • {conflict}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action for low brain fog */}
        {userState.brainFogLevel <= 2 && (
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-stone-700' : 'border-stone-200'}`}>
            <button
              onClick={() => {
                window.open(`https://www.google.com/search?q=interstate+probate+lawyer+near+${encodeURIComponent(userState.userLocation)}`, '_blank');
              }}
              className={`w-full flex items-center justify-center gap-2 ${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-black hover:bg-stone-800'} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors`}
            >
              <span>Find Interstate Probate Lawyer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} rounded-xl p-6 shadow-sm`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-100'} p-2 rounded-lg`}>
          <MapPin className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Local Legal Guide</h3>
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
            <span>For {probateInfo.location}</span>
            {userState.brainFogLevel <= 2 && (
              <span className={`${isDark ? 'bg-stone-800 text-white' : 'bg-stone-200 text-black'} px-2 py-1 rounded-full`}>
                Detailed View
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Requirements */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
            <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}>Probate Requirements</h4>
          </div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>
            {probateInfo.requirements}
          </p>
        </div>

        {/* Timeframe */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
            <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}>Expected Timeline</h4>
          </div>
          <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>
            {probateInfo.timeframe}
          </p>
        </div>

        {/* Required Documents */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
            <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}>Typical Required Documents</h4>
          </div>
          <ul className="space-y-1">
            {probateInfo.documents.map((doc, index) => (
              <li key={index} className={`text-sm flex items-start gap-2 ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>
                <span className={`mt-1 ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>•</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Additional Notes */}
        {probateInfo.notes && (
          <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-100'} p-3 rounded-lg`}>
            <p className={`text-xs ${isDark ? 'text-white' : 'text-black'}`}>
              <strong>Note:</strong> {probateInfo.notes}
            </p>
          </div>
        )}

        {/* Action for low brain fog */}
        {userState.brainFogLevel <= 2 && (
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
            <button
              onClick={() => {
                // In a real implementation, this would open:
                // - Local probate court website
                // - Phone number link
                // - Contact form
                window.open(`https://www.google.com/search?q=probate+court+near+${encodeURIComponent(userState.deceasedLocation)}`, '_blank');
              }}
              className={`w-full ${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-black hover:bg-stone-800'} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors`}
            >
              Contact Local Probate Court
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalLegalGuide;