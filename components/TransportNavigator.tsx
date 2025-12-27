import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import { Plane, FileCheck, MapPin, Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { getTransportLaws } from '../services/geminiService';

interface TransportNavigatorProps {
  userState: UserState;
}

interface TransportStep {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  icon: React.ReactNode;
  requirements?: string[];
}

interface TransportLaws {
  faaRegulations: string;
  airlineRequirements: string;
  funeralHomeRole: string;
  shippingRestrictions: string[];
}

const TransportNavigator: React.FC<TransportNavigatorProps> = ({ userState }) => {
  const [steps, setSteps] = useState<TransportStep[]>([
    {
      id: '1',
      title: 'Verify Pronouncement of Death',
      description: 'Confirm death has been pronounced by a qualified medical professional',
      status: 'PENDING',
      icon: <FileCheck className="w-5 h-5" />,
      requirements: ['Medical certificate', 'Death certificate']
    },
    {
      id: '2',
      title: 'Choose Receiving Funeral Home',
      description: 'Select and contact funeral home at destination',
      status: 'PENDING',
      icon: <MapPin className="w-5 h-5" />,
      requirements: ['Funeral home contact information', 'Transfer agreement']
    },
    {
      id: '3',
      title: 'Obtain Known Shipper Status',
      description: 'Register with airline as known shipper of human remains',
      status: 'PENDING',
      icon: <Shield className="w-5 h-5" />,
      requirements: ['Funeral home shipper number', 'DOT registration']
    },
    {
      id: '4',
      title: 'Prepare Remains for Transport',
      description: 'Properly prepare casket or container for air transport',
      status: 'PENDING',
      icon: <Plane className="w-5 h-5" />,
      requirements: ['Hermetically sealed container', 'FAA-approved casket']
    },
    {
      id: '5',
      title: 'Complete Airline Documentation',
      description: 'Fill out necessary forms for human remains transport',
      status: 'PENDING',
      icon: <FileCheck className="w-5 h-5" />,
      requirements: ['Airway bill', 'Embalming certificate', 'Container affidavit']
    },
    {
      id: '6',
      title: 'Coordinate Logistics',
      description: 'Schedule pickup and final transportation arrangements',
      status: 'PENDING',
      icon: <Clock className="w-5 h-5" />,
      requirements: ['Flight schedule', 'Ground transportation', 'Contact persons']
    }
  ]);

  const [laws, setLaws] = useState<TransportLaws | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userState.deceasedLocation === 'OUT_OF_STATE') {
      fetchTransportLaws();
    }
  }, [userState.deceasedLocation]);

  const fetchTransportLaws = async () => {
    const locationQuery = `Current FAA and airline regulations for transporting human remains from ${userState.deceasedLocation} to destination. Please include:
      1. Current FAA regulations for air transport
      2. Airline requirements for 'HUM' (Human Remains) shipments
      3. Role and responsibilities of the receiving funeral home
      4. Any shipping restrictions or requirements
      5. Information about Known Shipper status
    `;

    try {
      setLoading(true);
      setError(null);
      const response = await getTransportLaws(locationQuery);
      if (response && response.text) {
        // Parse the AI response into structured format
        const parsedLaws = parseTransportLaws(response.text);
        setLaws(parsedLaws);
      }
    } catch (err) {
      console.error('Error fetching transport laws:', err);
      setError('Unable to retrieve current transport regulations. Please check with funeral home for latest requirements.');
    } finally {
      setLoading(false);
    }
  };

  const parseTransportLaws = (text: string): TransportLaws => {
    // This is a simplified parser - in production, you'd want more robust parsing
    return {
      faaRegulations: extractSection(text, 'FAA') || 'Human remains must be transported in accordance with FAA Part 175 regulations. All containers must be leak-proof and constructed of materials adequate to withstand ordinary handling.',
      airlineRequirements: extractSection(text, 'airline') || 'Airlines require Known Shipper status for human remains transport. All shipments must be booked as "HUM" (Human Remains) and require embalming certificates and container affidavits.',
      funeralHomeRole: extractSection(text, 'funeral home') || 'The receiving funeral home coordinates with the shipping funeral home, handles all documentation, ensures compliance with local regulations, and provides final transportation.',
      shippingRestrictions: extractSection(text, 'restrictions')?.split('\n').filter(Boolean) || [
        'Embalming typically required for air transport',
        'Container must be hermetically sealed',
        'Advance notice required to airlines',
        'No radioactive materials or chemicals allowed'
      ]
    };
  };

  const extractSection = (text: string, keyword: string): string | null => {
    const lines = text.split('\n');
    const sectionLines = [];
    let foundSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        foundSection = true;
        sectionLines.push(line);
      } else if (foundSection && line.trim()) {
        sectionLines.push(line);
      } else if (foundSection && !line.trim()) {
        break;
      }
    }

    return sectionLines.length > 0 ? sectionLines.join('\n') : null;
  };

  const updateStepStatus = (stepId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  if (userState.deceasedLocation !== 'OUT_OF_STATE') {
    return (
      <div className="text-center py-10 text-slate-400">
        <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>This transport navigator is only needed when your loved one is out of state.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <Plane className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-medium text-slate-800">Body Transport Navigator</h2>
        </div>
        <p className="text-slate-600 text-sm">
          We'll guide you through transporting your loved one to {userState.deceasedLocation === 'OUT_OF_STATE' ? 'their final destination' : 'your location'}.
        </p>
      </div>

      {/* Current Regulations */}
      {loading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-slate-600">Fetching current transport regulations...</span>
        </div>
      ) : error ? (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-amber-800 font-medium">Regulation Information</p>
            <p className="text-amber-600 mt-1">{error}</p>
          </div>
        </div>
      ) : laws && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-4">
          <h3 className="font-medium text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Current Regulations
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">FAA Requirements</h4>
              <p className="text-xs text-blue-700 leading-relaxed">{laws.faaRegulations}</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-1">Airline Requirements</h4>
              <p className="text-xs text-green-700 leading-relaxed">{laws.airlineRequirements}</p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800 mb-1">Funeral Home Role</h4>
              <p className="text-xs text-purple-700 leading-relaxed">{laws.funeralHomeRole}</p>
            </div>
          </div>

          {laws.shippingRestrictions.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Important Restrictions</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                {laws.shippingRestrictions.map((restriction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {restriction}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step-by-Step Guide */}
      <div className="space-y-3">
        <h3 className="font-medium text-slate-800">Transport Process Steps</h3>
        {steps.map((step, index) => (
          <div key={step.id} className="bg-white p-4 rounded-xl border border-slate-100 transition-all hover:shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                  {getStatusIcon(step.status)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-slate-800">{step.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(step.status)}`}>
                    {step.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-2">{step.description}</p>

                {step.requirements && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {step.requirements.map((req, reqIndex) => (
                        <span key={reqIndex} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateStepStatus(step.id, 'IN_PROGRESS')}
                    disabled={step.status !== 'PENDING'}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    Mark in Progress
                  </button>
                  <button
                    onClick={() => updateStepStatus(step.id, 'COMPLETED')}
                    disabled={step.status === 'COMPLETED'}
                    className="text-xs text-green-600 hover:text-green-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Contacts */}
      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
        <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Emergency Contacts
        </h4>
        <div className="text-xs text-red-700 space-y-1">
          <p><span className="font-medium">Shipping Funeral Home:</span> Contact provided in Step 2</p>
          <p><span className="font-medium">Receiving Funeral Home:</span> Coordinate transport arrangements</p>
          <p><span className="font-medium">Airlines:</span> 24-hour emergency line for HUM shipments</p>
        </div>
      </div>
    </div>
  );
};

export default TransportNavigator;