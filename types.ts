export enum AppView {
  INTAKE = 'INTAKE',
  TRANSITION = 'TRANSITION',
  DASHBOARD = 'DASHBOARD',
}

export enum IntakeStep {
  SAFETY_CHECK = 'SAFETY_CHECK',
  IMMEDIATE_STATUS = 'IMMEDIATE_STATUS',
  LEGAL_TRIAGE = 'LEGAL_TRIAGE',
  IDENTITY = 'IDENTITY',
  BRAIN_FOG = 'BRAIN_FOG',
  COMPLETE = 'COMPLETE'
}

export interface UserState {
  name: string;
  isSafe: boolean;
  deceasedLocation: 'HOME' | 'HOSPITAL' | 'OUT_OF_STATE' | 'UNKNOWN';
  deathPronounced: boolean;
  deceasedName: string;
  isVeteran: boolean;
  brainFogLevel: number; // 1-5
  servicePreference?: ServicePreference;
  serviceOutline?: string;
  editedServiceOutline?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELEGATED';
  assignee?: string;
  category: 'LEGAL' | 'LOGISTICS' | 'FINANCIAL' | 'CEREMONY';
}

export type ServicePreference = 'SECULAR' | 'RELIGIOUS' | 'BRIEF';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  nextSibling?: string;
}

export interface DocumentScan {
  id: string;
  name: string;
  type: 'WILL' | 'INSURANCE' | 'ID' | 'OTHER';
  documentType?: string;
  scannedDate?: string;
  summary?: string;
  extractedData?: Record<string, any>;
  url: string; // Base64 or Object URL
}