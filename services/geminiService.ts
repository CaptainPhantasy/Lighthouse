import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Debug: Log if API key is missing (do NOT log the actual key)
if (!apiKey || apiKey.length === 0) {
  console.error('CRITICAL: VITE_GEMINI_API_KEY is not set. AI features will not work.');
} else {
  console.log('Gemini API key loaded successfully.');
}

const ai = new GoogleGenAI({ apiKey });

// Lighthouse Officiant Co-Pilot System Instruction
export const SYSTEM_INSTRUCTION_OFFICIANT = `You are a compassionate funeral officiant's assistant. Use these 5 user answers to write a 500-word heartfelt eulogy and a 20-minute service timeline. Avoid clichés. Use the user's specific memories to create an authentic 'Lighthouse' restoration plan.

Tone and Style Guidelines:

Empathetic & Steady: Use language that is warm, grounded, and trauma-informed. Avoid clinical terms. Prefer 'restoration' over 'cleanup' and 'honoring' over 'processing'.

Collaborative: Position yourself as a silent partner. Use phrases like 'We might consider...' or 'A beautiful way to frame this could be...'

Honest & Authentic: Do not use clichés. If a user provides a difficult memory, acknowledge the complexity of human life with grace.

Output Requirements:

Structure: Provide a 20-minute timeline with specific segments: Opening, Eulogy Draft, Shared Memories, Reading, and Closing.

The Eulogy Draft: Write a 500-word personalized eulogy based strictly on the anecdotes provided in the probing questions.

Formatting: Use clear Markdown headers. Surround the Eulogy section with specific tags (e.g., [EULOGY_START] and [EULOGY_END]) so the application can extract it for Text-to-Speech playback.

Create an authentic, heartfelt restoration plan that honors their memory and provides comfort to those gathered.`;

// --- JSON Parsing Utility ---
/**
 * Strips markdown code blocks from AI responses before JSON parsing
 * Handles cases where AI returns ```json ... ``` or ``` ... ```
 */
function cleanJsonOutput(text: string): string {
  if (!text) return '{}';

  // Remove markdown code blocks
  let cleaned = text.trim();

  // Remove ```json ... ``` blocks
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/```\s*$/i, '');

  // Remove any remaining markdown formatting
  cleaned = cleaned.trim();

  return cleaned;
}

// --- Audio Encoding/Decoding Utils for Live API ---
function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodeAudio(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Chat Service ---

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  onChunk: (text: string) => void,
  customSystemInstruction?: string
) => {
  // Use gemini-2.5-flash for general chat (2025 SSOT standard)
  const modelId = 'gemini-2.5-flash';

  // Use custom system instruction if provided, otherwise use default
  const systemInstruction = customSystemInstruction ||
    "You are Lighthouse, a compassionate estate orchestrator. You help users navigate the logistics of death. Be calm, empathetic, and ultra-organized. Use 'restoration' instead of 'cleanup'. If the user seems overwhelmed, suggest delegating tasks. Use short, clear paragraphs.";

  try {
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Enable grounding for current laws/info
      },
    });

    const result = await chat.sendMessageStream({ message });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Chat Error:", error);
    onChunk("I'm having trouble connecting right now. Please try again.");
  }
};

// --- Vision Service (Smart Vault) ---

export const analyzeDocument = async (base64Image: string, mimeType: string) => {
  // List of models to try in order of preference
  // All models are valid as of December 2025 (2025 SSOT standard)
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  const enhancedPrompt = `You are a document analysis expert for a bereavement support app. Analyze this image carefully.

DOCUMENT TYPES TO IDENTIFY:
- WILL: Legal will, testament, last will and testament
- INSURANCE: Life insurance policy, insurance certificate
- ID: Driver's license, passport, state ID, social security card
- DEATH_CERTIFICATE: Death certificate, certificate of death
- OBITUARY: Newspaper obituary, funeral announcement
- OTHER: Any other document

EXTRACTION RULES:
1. For WILLS: Extract "Executor" name, "Testator" (person who made the will), "Date Signed"
2. For INSURANCE: Extract "Insurance Company", "Policy Number", "Beneficiary", "Coverage Amount"
3. For IDs: Extract "Full Name", "Date of Birth", "ID Number", "Expiration Date"
4. For DEATH_CERTIFICATES: Extract "Deceased Name", "Date of Death", "Place of Death", "Cause" (if listed)

CRITICAL OUTPUT REQUIREMENTS:
- You MUST return valid JSON only
- Do not include markdown formatting like \`\`\`json
- Return at least 2-3 extracted entities if possible
- If document type is unclear, use "OTHER"
- Always provide a brief summary

Return ONLY this JSON structure:
{
  "documentType": "WILL|INSURANCE|ID|DEATH_CERTIFICATE|OBITUARY|OTHER",
  "summary": "Brief 1-2 sentence description of what this document is",
  "entities": [
    {"key": "Field Name", "value": "Extracted Value"}
  ]
}`;

  let lastError = null;

  for (const modelId of models) {
    try {
      console.log(`Attempting document analysis with model: ${modelId}`);

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            },
            {
              text: enhancedPrompt
            }
          ]
        }
      });

      const responseText = response.text;
      console.log(`Raw response from ${modelId}:`, responseText?.substring(0, 200) + '...');

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      // Try to parse as JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanJsonOutput(responseText));
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from markdown
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }

      // Validate the response has required fields
      if (!parsed.documentType) {
        parsed.documentType = 'OTHER';
      }
      if (!parsed.summary) {
        parsed.summary = `Document analyzed as ${parsed.documentType}`;
      }
      if (!Array.isArray(parsed.entities)) {
        parsed.entities = [];
      }

      console.log(`Successfully analyzed document as: ${parsed.documentType}`);
      return parsed;

    } catch (error) {
      console.error(`Failed with model ${modelId}:`, error);
      lastError = error;
      continue; // Try next model
    }
  }

  // All models failed - return a fallback result
  console.error('All Gemini models failed, using fallback:', lastError);

  return {
    documentType: 'OTHER',
    summary: 'Document was scanned but could not be auto-analyzed. Please verify the details manually.',
    entities: [
      { key: 'Note', value: 'AI analysis unavailable - please review document manually' }
    ]
  };
};

// --- Maps Service (Funeral Homes) ---

export const findFuneralHomes = async (latitude: number, longitude: number) => {
  // gemini-2.5-flash for Google Maps integration (2025 SSOT standard)
  const modelId = 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: "Find 3 highly-rated funeral homes near me. Provide their names and a brief comforting summary of their reviews.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude, longitude }
          }
        }
      }
    });
    return response.text; // Will contain markdown links to maps
  } catch (e) {
    console.error("Maps Error:", e);
    return "I couldn't load the map data right now.";
  }
};

// --- Live API Service (Voice Mode) ---

export const connectLiveSession = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  // gemini-2.5-flash-preview-tts for Text-to-Speech (2025 SSOT standard)
  // NOTE: As of Dec 2025, preview models may not be available. Falls back to gemini-2.0-flash-exp
  const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-2.0-flash-exp'];
  const modelId = ttsModels[0];
  
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = inputAudioContext.createMediaStreamSource(stream);
  const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
  
  let sessionPromise: Promise<any>;

  scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
    const pcmBlob = createBlob(inputData);
    
    if (sessionPromise) {
      sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      }).catch(err => console.error("Session send error", err));
    }
  };

  source.connect(scriptProcessor);
  scriptProcessor.connect(inputAudioContext.destination);

  sessionPromise = ai.live.connect({
    model: modelId,
    callbacks: {
      onopen: () => {
        console.log("Live session opened");
      },
      onmessage: async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
           const audioBuffer = await decodeAudioData(
            decodeAudio(base64Audio),
            outputAudioContext,
            24000,
            1
          );
          onAudioData(audioBuffer);
        }
      },
      onclose: () => {
        console.log("Live session closed");
        onClose();
        stream.getTracks().forEach(t => t.stop());
        inputAudioContext.close();
        outputAudioContext.close();
      },
      onerror: (err) => {
        console.error("Live session error", err);
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // Calming voice
      },
      systemInstruction: "You are Lighthouse, an empathetic voice assistant helping someone who is grieving. Speak slowly, softly, and kindly. Keep responses concise.",
    }
  });

  return {
    disconnect: async () => {
      const session = await sessionPromise;
      session.close();
      stream.getTracks().forEach(t => t.stop());
      inputAudioContext.close();
      outputAudioContext.close();
    }
  };
};

// --- TTS Service (Eulogy Reader) ---
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  // Try multiple TTS models in order of preference
  const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-2.0-flash-exp'];

  for (const modelId of ttsModels) {
    try {
      console.log(`Attempting TTS with model: ${modelId}`);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, steady voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        console.warn(`No audio data returned from ${modelId}`);
        continue;
      }

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      return await decodeAudioData(decodeAudio(base64Audio), ctx, 24000, 1);

    } catch (e) {
      console.warn(`TTS failed with model ${modelId}:`, e);
      continue; // Try next model
    }
  }

  console.error("TTS failed with all models");
  return null;
}

export async function generateNotificationDraft(documentType: string, entities: any): Promise<{ text: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // 2025 SSOT standard for general tasks
      contents: [{
        parts: [{
          text: `Create a professional, empathetic notification letter for ${documentType} based on the extracted information.

Extracted Information:
${entities.map((entity: any) => `${entity.key}: ${entity.value}`).join('\n')}

Please generate:
1. A formal letter with a compassionate tone
2. Include all relevant details from the extracted information
3. Address to the appropriate entity (e.g., insurance carrier, bank, financial institution)
4. Maintain a respectful and professional tone while being understanding of the circumstances
5. Include placeholders for any missing information that needs to be filled in by the user

Format the letter as a complete, ready-to-use document that the user can copy and send.`
        }]
      }]
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from AI');
    }

    return { text };
  } catch (e) {
    console.error("Notification Draft Error", e);
    return {
      text: `Dear [Recipient Name],\n\nI am writing to inform you about the recent passing of [Deceased Name].\n\nPlease advise on the next steps.\n\nSincerely,\n[Your Name]`
    };
  }
}

export async function getLocalProbateRequirements(location: string): Promise<{
  requirements: string;
  timeframe: string;
  documents: string[];
  notes?: string;
  summary: string; // TTS-optimized summary with short, punchy sentences
}> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // 2025 SSOT standard for complex reasoning
      contents: [{
        parts: [{
          text: `I need local probate requirements for ${location}. Please provide:
1. County-specific filing fees for probate
2. Address and contact information for the nearest probate court
3. Small Estate Affidavit forms and eligibility requirements
4. Local probate process timeline and requirements
5. Contact information for probate clerks

CRITICAL: You MUST return ONLY valid JSON with this exact structure. No additional text, no markdown code blocks.
{
  "requirements": "Summary of probate requirements",
  "timeframe": "Expected timeline (e.g., '3-6 months')",
  "documents": ["doc1", "doc2", "doc3"],
  "notes": "Additional important notes",
  "summary": "Short TTS-optimized summary. Use simple sentences. Each under 10 words. Speak directly. Avoid jargon. Example: File at county court. Bring the death certificate. The process takes three months."
}

The summary field MUST be optimized for Text-to-Speech: short sentences, clear pronunciation, spoken naturally.`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            requirements: { type: Type.STRING },
            timeframe: { type: Type.STRING },
            documents: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            notes: { type: Type.STRING },
            summary: { type: Type.STRING }
          }
        },
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from AI');
    }

    return JSON.parse(cleanJsonOutput(text));
  } catch (e) {
    console.error("Probate Requirements Error", e);
    // Return fallback information if API fails
    return {
      requirements: `Standard probate process applies for ${location}. Contact the local probate court for specific requirements.`,
      timeframe: 'Varies by state (typically 3-12 months)',
      documents: [
        'Death certificate',
        'Original will',
        'List of assets',
        'Beneficiary information',
        'Court filing fees'
      ],
      notes: 'Please verify with your local probate court as requirements may vary by county.',
      summary: 'File at the county probate court. Bring the death certificate and original will. The process takes three to twelve months. Small estates may use a simplified affidavit.'
    };
  }
}

export async function getTransportLaws(location: string): Promise<{
  faaRegulations: string;
  airlineRequirements: string;
  funeralHomeRole: string;
  shippingRestrictions: string[];
  summary: string; // TTS-optimized summary with short, punchy sentences
}> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // 2025 SSOT standard for complex reasoning
      contents: [{ parts: [{ text: `
        I need current information about transporting human remains from ${location}. Please provide:
        1. FAA regulations for air transport of human remains
        2. Airline requirements for "HUM" (Human Remains) shipments
        3. Role of funeral homes in remains transport
        4. Known Shipper requirements and process
        5. Any current shipping restrictions or special requirements
        6. Best practices for interstate transport of remains

        CRITICAL: You MUST return ONLY valid JSON with this exact structure. No additional text, no markdown code blocks.
        {
          "faaRegulations": "FAA regulations description",
          "airlineRequirements": "Airline requirements description",
          "funeralHomeRole": "Funeral home role description",
          "shippingRestrictions": ["restriction1", "restriction2", "restriction3"],
          "summary": "Short TTS-optimized summary. Use simple sentences. Each under 10 words. Speak directly. Example: Airlines require a funeral home. Remains must be embalmed. Book flights in advance. Call the funeral home first."
        }

        The summary field MUST be optimized for Text-to-Speech: short sentences, clear pronunciation, spoken naturally.
      ` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faaRegulations: { type: Type.STRING },
            airlineRequirements: { type: Type.STRING },
            funeralHomeRole: { type: Type.STRING },
            shippingRestrictions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING }
          }
        },
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from AI');
    }

    return JSON.parse(cleanJsonOutput(text));
  } catch (e) {
    console.error("Transport Laws Error", e);
    // Return fallback information if API fails
    return {
      faaRegulations: 'Human remains must be transported in accordance with FAA Part 175. All containers must be leak-proof and constructed of materials adequate to withstand ordinary handling.',
      airlineRequirements: 'Airlines require Known Shipper status for human remains transport. All shipments must be booked as "HUM" (Human Remains) and require proper documentation.',
      funeralHomeRole: 'The receiving funeral home coordinates with the shipping funeral home, handles all documentation, ensures compliance with local regulations, and provides final transportation.',
      shippingRestrictions: [
        'Embalming typically required for air transport',
        'Container must be hermetically sealed',
        'Advance notice required to airlines',
        'No radioactive materials or chemicals allowed'
      ],
      summary: 'You must use a funeral home for transport. The remains need to be embalmed. Airlines require advance booking. Your funeral home handles all the paperwork.'
    };
  }
}

// Helper function to extract personal info from document scans
function extractPersonalInfo(documentScans: any[]): { fullName?: string; birthDate?: string; survivors?: string } {
  const personalInfo: { fullName?: string; birthDate?: string; survivors?: string } = {};

  documentScans.forEach(scan => {
    if (scan.documentType === 'ID' || scan.documentType === 'OBITUARY') {
      // Extract entities from the scan
      scan.entities?.forEach((entity: any) => {
        const key = entity.key.toLowerCase();
        if (key.includes('name') || key.includes('full name')) {
          personalInfo.fullName = entity.value;
        } else if (key.includes('birth') || key.includes('dob')) {
          personalInfo.birthDate = entity.value;
        } else if (key.includes('survivor') || key.includes('family') || key.includes('relatives')) {
          personalInfo.survivors = entity.value;
        }
      });
    }
  });

  return personalInfo;
}

export async function generateSupportShareMessage(userName: string, deceasedName: string, supportLink: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // 2025 SSOT standard for general tasks
      contents: [{
        parts: [{
          text: `Create a compassionate, warm message that ${userName} can send to friends and family to share a support link for arrangements related to ${deceasedName}'s passing.

Context:
- User's name: ${userName}
- Deceased's name: ${deceasedName}
- Support link: ${supportLink}

Requirements:
1. Write a brief, heartfelt message (2-3 sentences)
2. Be warm but not overly emotional
3. Include the support link naturally in the message
4. Make it clear this link allows friends to help with tasks
5. Avoid clichs like "in lieu of flowers" or "celebration of life"
6. Keep it simple and direct
7. The message should feel personal and genuine

Please return ONLY the message text, ready to copy and paste. Do not include any explanations or additional text.`
        }]
      }],
      config: {
        temperature: 0.7,
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from AI');
    }

    return text.trim();
  } catch (e) {
    console.error("Support Share Message Generation Error", e);
    // Return fallback message if API fails
    return `Hi everyone, as we navigate this difficult time after ${deceasedName}'s passing, I wanted to share a way you can help. I've created a support link where you can see what needs to be done and pick up tasks that would mean a lot to me. Here's the link: ${supportLink} Thank you for being here for me.`;
  }
}

export const generateServiceOutline = async (questions: string[], responses: string[], deceasedName?: string, preference?: string, documentScans?: any[]) => {
  try {
    // Define structure based on preference
    const getStructure = () => {
      switch (preference) {
        case 'RELIGIOUS':
          return {
            opening: '## 1. Welcome & Opening Prayer (3 minutes)',
            reading: '## 4. Scripture Reading (3 minutes)',
            closing: '## 5. Closing Prayer (3 minutes)',
            openingTemplate: '*Welcome friends and family who have gathered*\n*Open with a prayer for comfort and guidance*\n*Express gratitude for everyone\'s presence*',
            readingTemplate: '*Read a meaningful passage from scripture*\n*Choose something that offers hope and comfort*',
            closingTemplate: '*Offer a prayer for the departed and for those gathered*\n*Thank everyone for attending and supporting each other*'
          };
        case 'BRIEF':
          return {
            opening: '## 1. Welcome (2 minutes)',
            reading: '## 4. Moment of Silence (2 minutes)',
            closing: '## 5. Closing (2 minutes)',
            openingTemplate: '*Welcome friends and family*\n*Brief acknowledgment of why we\'ve gathered*',
            readingTemplate: '*A moment of silence to remember and reflect*',
            closingTemplate: '*Brief words of comfort*\n*Thank everyone for being here*'
          };
        default: // SECULAR
          return {
            opening: '## 1. Opening Welcome (3 minutes)',
            reading: '## 4. Reading/Passage (3 minutes)',
            closing: '## 5. Closing (3 minutes)',
            openingTemplate: '*Welcome friends and family who have gathered*\n*Share that we come together to honor and celebrate a life*\n*Express gratitude for everyone\'s presence*',
            readingTemplate: '*Share a meaningful poem or writing that resonates*\n*Choose something that reflects their spirit*',
            closingTemplate: '*Final words of comfort and hope*\n*Thank everyone for attending and supporting each other*'
          };
      }
    };

    const structure = getStructure();

    // Extract personal info from document scans
    const personalInfo = documentScans ? extractPersonalInfo(documentScans) : {};

    const systemInstruction = `${SYSTEM_INSTRUCTION_OFFICIANT}

Additional Context:
- Deceased Name: ${deceasedName || 'Your Loved One'}
- Service Preference: ${preference || 'SECULAR'}
- Personal Details from Documents: ${personalInfo ? `Full Name: ${personalInfo.fullName || 'Not provided'}, Birth Date: ${personalInfo.birthDate || 'Not provided'}, Survivors: ${personalInfo.survivors || 'Not specified'}` : 'No documents scanned'}

Based on the responses gathered and any document information, create a structured, compassionate 20-minute funeral service outline.

${structure.opening}
${structure.openingTemplate}

## 2. Eulogy (6 minutes)
[EULOGY_START]
*[Create a heartfelt eulogy based on the responses, approximately 500 words. Use the personal information above if available.]*
[EULOGY_END]

## 3. Shared Memories (4 minutes)
*Open the floor for others to share their memories*
*Allow time for collective reflection and support*

${structure.reading}
${structure.readingTemplate}

${structure.closing}
${structure.closingTemplate}

Important Instructions:
- For any skipped questions (empty responses), infer details or omit those aspects gracefully
- Focus on the provided information and create a meaningful service based on what's available
- Make the tone warm, personal, and comforting
- Reference specific values and characteristics from the responses when available
- Create an authentic, heartfelt opening line for the eulogy
- Ensure total time allocation adds up to 20 minutes
- Use gentle, inclusive language that honors their memory
- Surround the eulogy with [EULOGY_START] and [EULOGY_END] tags for TTS extraction`;

    const conversation = [
      {
        role: "user" as const,
        parts: [{ text: questions[0] }]
      },
      {
        role: "model" as const,
        parts: [{ text: responses[0] }]
      },
      {
        role: "user" as const,
        parts: [{ text: questions[1] }]
      },
      {
        role: "model" as const,
        parts: [{ text: responses[1] }]
      },
      {
        role: "user" as const,
        parts: [{ text: questions[2] }]
      },
      {
        role: "model" as const,
        parts: [{ text: responses[2] }]
      },
      {
        role: "user" as const,
        parts: [{ text: questions[3] }]
      },
      {
        role: "model" as const,
        parts: [{ text: responses[3] }]
      },
      {
        role: "user" as const,
        parts: [{ text: questions[4] }]
      },
      {
        role: "model" as const,
        parts: [{ text: responses[4] }]
      },
      {
        role: "user" as const,
        parts: [{ text: "Based on these responses, please create a meaningful funeral service outline as instructed." }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // 2025 SSOT standard for general tasks
      contents: conversation,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from AI');
    }

    return { text };
  } catch (e) {
    console.error("Service Outline Generation Error", e);
    // Return fallback outline if API fails
    const fallbackOutline = `# 20-Minute Service Outline for ${deceasedName || 'Your Loved One'}

## 1. Opening Welcome (3 minutes)
*Welcome friends and family who have gathered to honor and celebrate a life*
*Share that we come together to remember and cherish the memories we shared*
*Express gratitude for everyone's presence and support*

## 2. Eulogy (6 minutes)
*[Eulogy content would be generated here based on the specific values and memories shared]*
*This section would include personal anecdotes, characteristics, and impact on others*

## 3. Shared Memories (4 minutes)
*Open the floor for others to share their memories and stories*
*Play meaningful music if desired*
*Allow time for collective reflection and support*

## 4. Reading/Passage (3 minutes)
*Share a meaningful poem, scripture, or writing that resonates*
*Choose something that reflects their spirit and values*

## 5. Closing (3 minutes)
*Final words of comfort and hope*
*Thank everyone for attending and supporting each other*
*Remember the love and connection that continues beyond this moment*`;

    return { text: fallbackOutline };
  }
}