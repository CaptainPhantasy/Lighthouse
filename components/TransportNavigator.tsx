/**
 * TransportNavigator - Interstate Body Transport Guide
 *
 * IMPORTANT: This component uses STATIC, VERIFIED regulatory information.
 * Laws are deterministic facts - we do NOT use AI to generate legal requirements
 * to avoid hallucination risks and liability issues.
 *
 * Source: FAA regulations, TSA requirements, airline policies
 */

import React, { useState } from 'react';
import { UserState } from '../types';
import { Plane, FileCheck, MapPin, Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

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

/**
 * STATIC VERIFIED REGULATIONS
 * These are deterministic facts from FAA, TSA, and airline policies.
 * DO NOT replace with AI-generated content without legal review.
 */
const VERIFIED_TRANSPORT_REGULATIONS: TransportLaws = {
  faaRegulations: 'Human remains may be transported on commercial flights as cargo or carry-on (cremated only). A death certificate and burial transit permit are required by federal law. TSA screening applies to all shipments.',
  airlineRequirements: 'Most airlines require: (1) Advance reservation 24-48 hours prior, (2) Remains in a hermetically sealed container, (3) "Known Shipper" verification - typically a licensed funeral director. Private individuals usually cannot ship bodies directly.',
  funeralHomeRole: 'A licensed funeral director serves as the "Known Shipper" required by TSA. They coordinate with the airline cargo department and ensure all documentation is complete. They also handle the hermetic sealing and preparation of remains.',
  shippingRestrictions: [
    'Dry ice requires hazardous materials (HAZMAT) labeling and declaration',
    'Cremated remains must be in a scan-able container (plastic/wood - NOT lead or metal)',
    'International flights require consular paperwork and possibly embalming',
    'Some airlines do not transport bodies on weekends or holidays',
    'Embalmming certificate required for most interstate transport'
  ]
};

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

  const laws = VERIFIED_TRANSPORT_REGULATIONS; // Static data - no fetching needed

  const updateStepStatus = (stepId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'IN_PROGRESS': return 'text-black bg-stone-100';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-black animate-pulse" />;
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
          <Plane className="w-6 h-6 text-black" />
          <h2 className="text-xl font-medium text-slate-800">Body Transport Navigator</h2>
        </div>
        <p className="text-slate-600 text-sm">
          We'll guide you through transporting your loved one to their final destination.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          The information below is based on FAA and TSA regulations. Always verify with your chosen airline and funeral director.
        </p>
      </div>

      {/* Current Regulations - STATIC DATA (no AI generation) */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-4">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-black" />
          Verified Transport Regulations
        </h3>

        <div className="space-y-3">
          <div className="p-3 bg-stone-100 rounded-lg">
            <h4 className="text-sm font-medium text-black mb-1">FAA Requirements</h4>
            <p className="text-xs text-stone-700 leading-relaxed">{laws.faaRegulations}</p>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-1">Airline Requirements</h4>
            <p className="text-xs text-green-700 leading-relaxed">{laws.airlineRequirements}</p>
          </div>

          <div className="p-3 bg-stone-100 rounded-lg">
            <h4 className="text-sm font-medium text-stone-800 mb-1">Funeral Home Role</h4>
            <p className="text-xs text-stone-700 leading-relaxed">{laws.funeralHomeRole}</p>
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

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Regulations may change. Always confirm requirements directly with your chosen airline and licensed funeral director.
          </p>
        </div>
      </div>

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
                    className="text-xs text-black hover:text-stone-700 disabled:text-slate-400 disabled:cursor-not-allowed"
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
