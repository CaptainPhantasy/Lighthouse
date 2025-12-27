export enum AppView {
  INTAKE = 'INTAKE',
  VOICE_INTRO = 'VOICE_INTRO', // Phase 2: Sentient onboarding
  TRANSITION = 'TRANSITION',
  DASHBOARD = 'DASHBOARD',
  VOLUNTEER = 'VOLUNTEER',
}

export enum IntakeStep {
  SAFETY_CHECK = 'SAFETY_CHECK',
  USER_INTRO = 'USER_INTRO',
  IMMEDIATE_STATUS = 'IMMEDIATE_STATUS',
  LEGAL_TRIAGE = 'LEGAL_TRIAGE',
  IDENTITY = 'IDENTITY',
  BRAIN_FOG = 'BRAIN_FOG',
  COMPLETE = 'COMPLETE'
}

// Phase 2: Wishes knowledge level for intelligent routing
export type WishesKnowledgeLevel = 'NONE' | 'VAGUE' | 'CLEAR';

export interface UserState {
  // Core identity
  name: string;
  deceasedName: string;

  // Safety and immediate status
  isSafe: boolean;
  deceasedLocation: 'HOME' | 'HOSPITAL' | 'OUT_OF_STATE' | 'UNKNOWN';
  deathPronounced: boolean;
  isVeteran: boolean;

  // Phase 2: Sentient Onboarding fields
  relationshipToDeceased: string; // e.g., 'Spouse', 'Child', 'Friend', 'Parent'
  userLocation: string; // e.g., 'San Francisco, CA' - for local grounding
  wishesKnowledgeLevel: WishesKnowledgeLevel; // For intelligent routing
  initialStoryTranscript: string; // Full emotional narrative - cached for all AI sessions

  // Cognitive state
  brainFogLevel: number; // 1-5

  // Service planning
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