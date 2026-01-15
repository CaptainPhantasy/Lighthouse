// ============================================================================
// GLOBAL PREFERENCES (persist across sessions, independent of user state)
// ============================================================================

export interface VoicePreferences {
  voiceGuidanceEnabled: boolean; // TTS on/off globally
  hasSeenWelcomeModal: boolean; // One-time flag for voice onboarding
}

export enum AppView {
  // Bereaved Path (existing)
  SENTIENT_GATEWAY = 'SENTIENT_GATEWAY', // Entry point: Ask user's intent
  VOICE_INTRO = 'VOICE_INTRO', // Bereaved: Voice-based onboarding
  INTAKE = 'INTAKE', // Bereaved: Clinical form intake (fallback)
  TRANSITION = 'TRANSITION',
  DASHBOARD = 'DASHBOARD', // Bereaved: Grief support dashboard
  VOLUNTEER = 'VOLUNTEER',

  // Sentient Path (new: proactive/legacy planning)
  SENTIENT_INTAKE = 'SENTIENT_INTAKE', // Sentient: Legacy Architect intake
  SENTIENT_DASHBOARD = 'SENTIENT_DASHBOARD', // Sentient: Life Command Center
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

export type ServicePreference = 'SECULAR' | 'RELIGIOUS' | 'MILITARY' | 'CELEBRATION_OF_LIFE' | 'OTHER' | 'BRIEF';

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

// ============================================================================
// SENTIENT PATH TYPES (Proactive/Legacy Planning)
// ============================================================================

export type LifeStage = 'YOUNG_ADULT' | 'MID_LIFE' | 'SENIOR' | 'TERMINAL_DIAGNOSIS';
export type PrimaryGoal = 'ORGANIZE_DOCUMENTS' | 'RECORD_MEMORIES' | 'MESSAGE_LOVED_ONES' | 'ALL';

export interface SentientUserState {
  // Core identity
  name: string;
  lifeStage: LifeStage;
  primaryGoal: PrimaryGoal;

  // The "Biographer" data
  coreMemory?: string; // First recorded memory - voice transcript
  memories: RecordedMemory[];

  // Legacy planning
  documents: LegacyDocument[];
  messages: LegacyMessage[];
  tasks: LegacyTask[];

  // Preferences
  voiceEnabled: boolean;
}

export interface RecordedMemory {
  id: string;
  timestamp: Date;
  prompt: string; // The question the Biographer asked
  transcript: string; // User's response
  audioUrl?: string; // Optional audio recording
  tags?: string[]; // e.g., ['childhood', 'family', 'career']
}

export interface LegacyDocument {
  id: string;
  name: string;
  type: 'WILL' | 'POWER_OF_ATTORNEY' | 'INSURANCE' | 'PASSWORD_LIST' | 'OTHER';
  location: string; // Where it's stored (physical/digital)
  notes?: string;
}

export interface LegacyMessage {
  id: string;
  recipient: string; // Who it's for
  occasion: 'BIRTHDAY' | 'WEDDING' | 'GRADUATION' | 'FUNERAL' | 'ANYTIME';
  message: string;
  deliverOn?: Date; // Optional future delivery
  createdAt: Date;
}

export interface LegacyTask {
  id: string;
  title: string;
  category: 'LEGAL' | 'FINANCIAL' | 'DIGITAL' | 'PERSONAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}