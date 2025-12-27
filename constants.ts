import { UserState, Task } from './types';

// Encryption password - in production this should come from user input or derived from user biometrics
export const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD || 'lighthouse_default_key_2024';

export const INITIAL_USER_STATE: UserState = {
  name: '',
  isSafe: false,
  deceasedLocation: 'UNKNOWN',
  deathPronounced: false,
  deceasedName: '',
  isVeteran: false,
  brainFogLevel: 3,
  servicePreference: 'SECULAR',
};

// Trauma-informed language dictionary
export const TEXTS = {
  app_name: "Lighthouse",
  safety_header: "We are so sorry for your loss.",
  safety_question: "Before we start: Are you in a safe place, and is someone with you?",
  location_question: "Where is your loved one now?",
  location_options: {
    home: "At Home",
    hospital: "Hospital / Hospice",
    out_of_state: "Out of State / Abroad",
  },
  // Acknowledgment responses for each location
  location_acknowledgments: {
    home: "We're so sorry. We'll help you coordinate the pronouncement and transport immediately.",
    hospital: "We're so sorry. The hospital staff will guide you through the next steps. We're here to help with what comes after.",
    out_of_state: "We're so sorry. This is especially difficult. We'll guide you through the transport process step by step.",
  },
  legal_question: "Has a medical professional or authority pronounced the death?",
  identity_question: "What was their full legal name?",
  veteran_question: "Did they serve in the military?",
  fog_question: "On a scale of 1-5, how much 'brain fog' are you feeling right now?",
  fog_explainer: "We will hide non-urgent tasks based on your answer to help you focus.",
  fog_minimal_message: "Taking it one moment at a time. We've simplified everything for you.",
  dashboard_tab_vault: "Smart Vault",
  dashboard_tab_tasks: "Restoration Plan",
  dashboard_tab_assist: "Compassionate Guide",
  delegate_action: "Ask Support Circle",
  out_of_state_warning: "Since your loved one is out of state, we have prioritized the Body Transport Navigator module for you.",
  // Legacy hand-off messages
  legacy_title: "The Legacy Hand-off",
  legacy_subtitle: "We've handled the business of death. Now, let's preserve the beauty of life.",
  legacy_export: "Create a beautiful digital memorial page with the obituary, service outline, and memories.",
};

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Obtain Pronouncement of Death',
    description: 'A legal requirement before transport can occur.',
    priority: 'URGENT',
    status: 'PENDING',
    category: 'LEGAL'
  },
  {
    id: '2',
    title: 'Notify Immediate Family',
    description: 'Call the inner circle. We have a script if you need it.',
    priority: 'HIGH',
    status: 'PENDING',
    category: 'CEREMONY'
  },
  {
    id: '3',
    title: 'Locate Will & Testament',
    description: 'Check the Smart Vault or physical safe.',
    priority: 'NORMAL',
    status: 'PENDING',
    category: 'LEGAL'
  },
  {
    id: '4',
    title: 'File Life Insurance Claim',
    description: 'Contact insurance provider to start the claims process.',
    priority: 'NORMAL',
    status: 'PENDING',
    category: 'FINANCIAL'
  },
  {
    id: '5',
    title: 'Update Beneficiary Designations',
    description: 'Update bank accounts, retirement accounts, and investments.',
    priority: 'NORMAL',
    status: 'PENDING',
    category: 'FINANCIAL'
  },
  {
    id: '6',
    title: 'Plan Memorial Service',
    description: 'Coordinate with funeral home and schedule service.',
    priority: 'NORMAL',
    status: 'PENDING',
    category: 'CEREMONY'
  },
  {
    id: '7',
    title: 'Transfer Property Title',
    description: 'Handle real estate and property ownership transfer.',
    priority: 'LOW',
    status: 'PENDING',
    category: 'LEGAL'
  }
];

// Service Preference Options
export const SERVICE_PREFERENCES = {
  SECULAR: 'Secular/Celebration of Life',
  RELIGIOUS: 'Traditional/Religious',
  BRIEF: 'Brief/Private'
} as const;

export type ServicePreference = keyof typeof SERVICE_PREFERENCES;

// Officiant Co-Pilot Constants
export const OFFICIANT_QUESTIONS = {
  SECULAR: [
    "What were 2-3 of your loved one's most cherished values or principles?",
    "Can you share a favorite memory that shows their personality?",
    "What passions or hobbies brought them joy?",
    "How would their closest friends describe them in 3 words?",
    "Is there a special saying or quote that was meaningful to them?"
  ],
  RELIGIOUS: [
    "What were 2-3 of your loved one's most cherished values or principles?",
    "Can you share a favorite memory that shows their personality?",
    "What passions or hobbies brought them joy?",
    "How would their closest friends describe them in 3 words?",
    "Is there a special saying or quote that was meaningful to them?",
    "Are there specific scriptures, hymns, or religious traditions we should honor?"
  ]
} as const;

// Service Structure Templates
export const SERVICE_TEMPLATES = {
  SECULAR: {
    opening: 'Opening Welcome',
    eulogy: 'Eulogy',
    memories: 'Shared Memories',
    reading: 'Reading/Passage',
    closing: 'Closing',
    openingSection: '## 1. Opening Welcome (3 minutes)\n*Welcome friends and family who have gathered*\n*Share that we come together to honor and celebrate a life*\n*Express gratitude for everyone\'s presence*',
    readingSection: '## 4. Reading/Passage (3 minutes)\n*Share a meaningful poem or writing that resonates*\n*Choose something that reflects their spirit*',
    closingSection: '## 5. Closing (3 minutes)\n*Final words of comfort and hope*\n*Thank everyone for attending and supporting each other*'
  },
  RELIGIOUS: {
    opening: 'Welcome & Opening Prayer',
    eulogy: 'Eulogy',
    memories: 'Shared Memories',
    reading: 'Scripture Reading',
    closing: 'Closing Prayer',
    openingSection: '## 1. Welcome & Opening Prayer (3 minutes)\n*Welcome friends and family who have gathered*\n*Open with a prayer for comfort and guidance*\n*Express gratitude for everyone\'s presence*',
    readingSection: '## 4. Scripture Reading (3 minutes)\n*Read a meaningful passage from scripture*\n*Choose something that offers hope and comfort*',
    closingSection: '## 5. Closing Prayer (3 minutes)\n*Offer a prayer for the departed and for those gathered*\n*Thank everyone for attending and supporting each other*'
  },
  BRIEF: {
    opening: 'Welcome',
    eulogy: 'Eulogy',
    memories: 'Memories',
    reading: 'Moment of Silence',
    closing: 'Closing',
    openingSection: '## 1. Welcome (2 minutes)\n*Welcome friends and family*\n*Brief acknowledgment of why we\'ve gathered*',
    readingSection: '## 4. Moment of Silence (2 minutes)\n*A moment of silence to remember and reflect*',
    closingSection: '## 5. Closing (2 minutes)\n*Brief words of comfort*\n*Thank everyone for being here*'
  }
} as const;