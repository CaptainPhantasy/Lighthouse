import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Lighthouse Officiant Co-Pilot System Instruction
export const SYSTEM_INSTRUCTION_OFFICIANT = `You are the Lighthouse Officiant Co-Pilot. Your goal is to support an individual who has been thrust into the role of officiating a funeral service.

Tone and Style Guidelines:

Empathetic & Steady: Use language that is warm, grounded, and trauma-informed. Avoid clinical terms. Prefer 'restoration' over 'cleanup' and 'honoring' over 'processing'.

Collaborative: Position yourself as a silent partner. Use phrases like 'We might consider...' or 'A beautiful way to frame this could be...'

Honest & Authentic: Do not use clichés. If a user provides a difficult memory, acknowledge the complexity of human life with grace.

Output Requirements:

Structure: Provide a 20-minute timeline with specific segments: Opening, Eulogy Draft, Shared Memories, Reading, and Closing.

The Eulogy Draft: Write a 500-word personalized opening based strictly on the anecdotes provided in the probing questions.

Formatting: Use clear Markdown headers. Surround the Eulogy section with specific tags (e.g., [EULOGY_START] and [EULOGY_END]) so the application can extract it for Text-to-Speech playback.`;

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
  onChunk: (text: string) => void
) => {
  // Use gemini-3-pro-preview for high EQ and complex reasoning
  const modelId = 'gemini-3-pro-preview';

  try {
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: "You are Lighthouse, a compassionate estate orchestrator. You help users navigate the logistics of death. Be calm, empathetic, and ultra-organized. Use 'restoration' instead of 'cleanup'. If the user seems overwhelmed, suggest delegating tasks. Use short, clear paragraphs.",
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking for better EQ
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
  // Use gemini-3-pro-preview for best OCR and reasoning
  const modelId = 'gemini-3-pro-preview';
  
  try {
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
            text: "Analyze this document. Identify the document type (Will, Insurance, ID, etc). Extract key entities like Names, Policy Numbers, Dates, and Beneficiaries. If it's an Insurance Policy, extract company name and policy number. If it's a Will, extract executor name. Return JSON with optional taskSuggestion field."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING },
            summary: { type: Type.STRING },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            taskSuggestion: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
  }
};

// --- Maps Service (Funeral Homes) ---

export const findFuneralHomes = async (latitude: number, longitude: number) => {
  // gemini-2.5-flash is required for googleMaps tool
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
  const modelId = 'gemini-2.5-flash-native-audio-preview-09-2025';
  
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
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
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
    if (!base64Audio) return null;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    return await decodeAudioData(decodeAudio(base64Audio), ctx, 24000, 1);

  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
}

export async function getTransportLaws(location: string) {
  try {
    // Use googleSearch tool to get current regulations
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: `
        I need current information about transporting human remains from ${location}. Please provide:
        1. FAA regulations for air transport of human remains
        2. Airline requirements for "HUM" (Human Remains) shipments
        3. Role of funeral homes in remains transport
        4. Known Shipper requirements and process
        5. Any current shipping restrictions or special requirements
        6. Best practices for interstate transport of remains

        Please be specific about current regulations and requirements.
      ` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Low temperature for factual accuracy
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response from AI');
    }

    return { text };
  } catch (e) {
    console.error("Transport Laws Error", e);
    // Return fallback information if API fails
    return {
      text: `
FAA REGULATIONS:
Human remains must be transported in accordance with FAA Part 175. All containers must be leak-proof and constructed of materials adequate to withstand ordinary handling.

AIRLINE REQUIREMENTS:
Airlines require Known Shipper status for human remains transport. All shipments must be booked as "HUM" (Human Remains) and require proper documentation.

FUNERAL HOME ROLE:
The receiving funeral home coordinates with the shipping funeral home, handles all documentation, ensures compliance with local regulations, and provides final transportation.

KNOWN SHIPPER STATUS:
Funeral homes typically have Known Shipper status which allows them to ship human remains. This requires DOT registration and proper vetting by airlines.

SHIPPING RESTRICTIONS:
- Embalming typically required for air transport
- Container must be hermetically sealed
- Advance notice required to airlines
- No radioactive materials or chemicals allowed
      `
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

    const response = await ai.generateContent(conversation);

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