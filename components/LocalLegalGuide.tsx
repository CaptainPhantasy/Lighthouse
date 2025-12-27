import React, { useState, useEffect } from 'react';
import { getLocalProbateRequirements } from '../services/geminiService';
import { UserState } from '../types';
import { MapPin, Clock, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

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

const LocalLegalGuide: React.FC<LocalLegalGuideProps> = ({ userState }) => {
  const [probateInfo, setProbateInfo] = useState<ProbateInfo>({
    location: '',
    requirements: '',
    timeframe: '',
    documents: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchProbateInfo = async () => {
      if (!userState.deceasedLocation) return;

      setProbateInfo(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const info = await getLocalProbateRequirements(userState.deceasedLocation);
        setProbateInfo({
          location: userState.deceasedLocation,
          requirements: info.requirements || 'Standard probate process applies',
          timeframe: info.timeframe || 'Varies by state (3-12 months)',
          documents: info.documents || [
            'Death certificate',
            'Original will',
            'List of assets',
            'Beneficiary information',
            'Court filing fees'
          ],
          notes: info.notes,
          isLoading: false
        });
      } catch (error) {
        setProbateInfo(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unable to retrieve local probate requirements. Please check with your local court.'
        }));
      }
    };

    // Only fetch for users with brain fog level < 4
    if (userState.brainFogLevel < 4) {
      fetchProbateInfo();
    }
  }, [userState.deceasedLocation, userState.brainFogLevel]);

  // Only show for users with brain fog level < 4
  if (userState.brainFogLevel >= 4) {
    return null;
  }

  if (probateInfo.isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-800">Loading local legal requirements...</p>
        </div>
      </div>
    );
  }

  if (probateInfo.error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800 mb-1">Local Legal Guide</h3>
            <p className="text-sm text-amber-700 mb-3">
              {probateInfo.error}
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <MapPin className="w-3 h-3" />
              <span>For {userState.deceasedLocation}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Local Legal Guide</h3>
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <span>For {probateInfo.location}</span>
            {userState.brainFogLevel <= 2 && (
              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
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
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-blue-800 text-sm">Probate Requirements</h4>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">
            {probateInfo.requirements}
          </p>
        </div>

        {/* Timeframe */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-blue-800 text-sm">Expected Timeline</h4>
          </div>
          <p className="text-sm text-blue-700">
            {probateInfo.timeframe}
          </p>
        </div>

        {/* Required Documents */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-blue-800 text-sm">Typical Required Documents</h4>
          </div>
          <ul className="space-y-1">
            {probateInfo.documents.map((doc, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Additional Notes */}
        {probateInfo.notes && (
          <div className="bg-blue-100/50 p-3 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> {probateInfo.notes}
            </p>
          </div>
        )}

        {/* Action for low brain fog */}
        {userState.brainFogLevel <= 2 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <button
              onClick={() => {
                // In a real implementation, this would open:
                // - Local probate court website
                // - Phone number link
                // - Contact form
                window.open(`https://www.google.com/search?q=probate+court+near+${encodeURIComponent(userState.deceasedLocation)}`, '_blank');
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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