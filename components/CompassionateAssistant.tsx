import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, StopCircle, Map as MapIcon, Loader2, Sparkles, Volume1, FileText, Play, DraftingCompass } from 'lucide-react';
import { streamChatResponse, connectLiveSession, findFuneralHomes, generateSpeech, generateServiceOutline } from '../services/geminiService';
import { ChatMessage, UserState, DocumentScan, ServicePreference } from '../types';
import { SERVICE_PREFERENCES, OFFICIANT_QUESTIONS, SERVICE_TEMPLATES } from '../constants';

interface AssistantProps {
  userState: UserState;
  documentScans: DocumentScan[];
  onServicePreferenceChange?: (preference: ServicePreference) => void;
  onServiceOutlineChange?: (outline: string) => void;
}

const CompassionateAssistant: React.FC<AssistantProps> = ({
  userState,
  documentScans,
  onServicePreferenceChange,
  onServiceOutlineChange
}) => {
  const [mode, setMode] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      content: `Hello ${userState.name || 'friend'}. I'm here to help you navigate this. How can I support you right now?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [serviceOutline, setServiceOutline] = useState<string | null>(userState.serviceOutline || null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [editedOutline, setEditedOutline] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [servicePreference, setServicePreference] = useState<ServicePreference>(
    userState.servicePreference || 'SECULAR'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveSessionCleanup = useRef<(() => Promise<void>) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Auto-save service outline
  useEffect(() => {
    if (serviceOutline && onServiceOutlineChange) {
      onServiceOutlineChange(serviceOutline);
    }
  }, [serviceOutline, onServiceOutlineChange]);

  // Initialize edited outline when service outline changes
  useEffect(() => {
    if (serviceOutline) {
      setEditedOutline(serviceOutline);
    }
  }, [serviceOutline]);

  // Handle service preference change
  const handlePreferenceChange = (preference: ServicePreference) => {
    setServicePreference(preference);
    if (onServicePreferenceChange) {
      onServicePreferenceChange(preference);
    }
  };

  // --- TTS Logic ---
  const stopAudio = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const playAudio = async (audioData: ArrayBuffer) => {
    stopAudio();
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      nextStartTimeRef.current = audioContext.currentTime;
      source.start(nextStartTimeRef.current);
      audioSourceRef.current = source;

      source.onended = () => {
        setIsPlayingAudio(false);
      };

      setIsPlayingAudio(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await streamChatResponse(
        messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        userMessage.content,
        (text) => {
          // Handle streaming chunks if needed
          console.log('Chunk:', text);
        }
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (autoPlay && response) {
        try {
          const audioBuffer = await generateSpeech(response);
          if (audioBuffer) {
            await playAudio(audioBuffer);
          }
        } catch (error) {
          console.error('Error generating speech:', error);
        }
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleLiveMode = async () => {
    if (isLiveActive) {
      if (liveSessionCleanup.current) {
        await liveSessionCleanup.current();
        liveSessionCleanup.current = null;
      }
      setIsLiveActive(false);
      stopAudio();
    } else {
      try {
        const cleanup = await connectLiveSession();
        liveSessionCleanup.current = cleanup;
        setIsLiveActive(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          content: "I'm here for you in real-time. How are you feeling?",
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error starting live session:', error);
      }
    }
  };

  const handleEmotionResponse = (emotion: string) => {
    setInput(emotion);
  };

  const handleLiveSubmit = async () => {
    if (!input.trim() || !isLiveActive) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      if (liveSessionCleanup.current) {
        await liveSessionCleanup.current(input);
      }
    } catch (error) {
      console.error('Error in live session:', error);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      if (recognition) {
        recognition.stop();
      }
    } else {
      setIsListening(true);
      if (recognition) {
        recognition.start();
      }
    }
  };

  // --- AI Officiant Co-Pilot Functions ---
  const generateServiceOutline = async () => {
    setIsGeneratingOutline(true);

    // Use the appropriate questions based on service preference
    const gentleQuestions = OFFICIANT_QUESTIONS[servicePreference];

    // Ask first question
    const firstQuestion = gentleQuestions[0];
    setQuestionsAsked([firstQuestion]);
    setCurrentQuestionIndex(0);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      content: firstQuestion,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsGeneratingOutline(false);
  };

  const handleEulogyResponse = async (response: string) => {
    const gentleQuestions = OFFICIANT_QUESTIONS[servicePreference];

    // Add response to questions asked
    setQuestionsAsked(prev => [...prev, response]);

    if (currentQuestionIndex < gentleQuestions.length - 1) {
      // Ask next question
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = gentleQuestions[currentQuestionIndex + 1];

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: nextQuestion,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    } else {
      // All questions answered - create outline
      await createServiceOutline(response);
    }
  };

  const handleSkipQuestion = () => {
    const gentleQuestions = OFFICIANT_QUESTIONS[servicePreference];

    // Add empty response for skipped question
    setQuestionsAsked(prev => [...prev, '']);

    if (currentQuestionIndex < gentleQuestions.length - 1) {
      // Ask next question
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = gentleQuestions[currentQuestionIndex + 1];

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: nextQuestion,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    } else {
      // All questions answered (some skipped) - create outline
      createServiceOutline('');
    }
  };

  const createServiceOutline = async (finalResponse: string) => {
    setIsGeneratingOutline(true);

    try {
      // Collect all responses from the conversation
      const responses = [];
      for (let i = 0; i < questionsAsked.length; i++) {
        const question = questionsAsked[i];
        const response = messages.find(m => m.content === question)?.content || finalResponse;
        responses.push(response);
      }

      // Generate real service outline using Gemini API with service preference and document scans
      const result = await generateServiceOutline(
        questionsAsked,
        responses,
        userState.deceasedName,
        servicePreference,
        documentScans
      );

      setServiceOutline(result.text);

      // Add the outline as a message
      const outlineMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: `I've created a service outline for you based on what you've shared:\n\n${result.text}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, outlineMessage]);

    } catch (error) {
      console.error('Error generating service outline:', error);
      const template = SERVICE_TEMPLATES[servicePreference];
      const fallbackOutline = `# 20-Minute Service Outline for ${userState.deceasedName || 'Your Loved One'}

${template.openingSection}

## 2. Eulogy (6 minutes)
*[Eulogy content would be generated here based on the specific values and memories shared]*
*This section would include personal anecdotes, characteristics, and impact on others*

## 3. Shared Memories (4 minutes)
*Open the floor for others to share their memories and stories*
*Play meaningful music if desired*
*Allow time for collective reflection and support*

${template.readingSection}

${template.closingSection}`;

      setServiceOutline(fallbackOutline);

      const outlineMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: `I've created a service outline for you:\n\n${fallbackOutline}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, outlineMessage]);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const playEulogyAudio = async () => {
    if (!serviceOutline) return;

    // Extract eulogy section from Markdown format
    const eulogyMatch = serviceOutline.match(/## 2\. Eulogy \(6 minutes\)\s*\n([\s\S]*?)(?=\n## |\n# $|$)/);
    const eulogyText = eulogyMatch ? eulogyMatch[1].trim() : serviceOutline;

    if (!eulogyText || eulogyText.length < 10) {
      alert('The eulogy text is too short to play aloud.');
      return;
    }

    setIsPlayingAudio(true);

    try {
      const audioBuffer = await generateSpeech(eulogyText);
      if (audioBuffer) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

        source.onended = () => {
          setIsPlayingAudio(false);
        };
      } else {
        throw new Error('No audio data generated');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsPlayingAudio(false);
      // Show gentle error message
      alert("I'm having trouble reading this aloud right now, but your text is saved below for you to read.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Service Preference Selector */}
      <div className="mb-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Service Preference
        </label>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(SERVICE_PREFERENCES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handlePreferenceChange(key as ServicePreference)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                servicePreference === key
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={generateServiceOutline}
          disabled={isGeneratingOutline}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg hover:from-blue-500 hover:to-indigo-500 hover:text-white transition-all disabled:opacity-50"
        >
          <DraftingCompass className="w-4 h-4" />
          {isGeneratingOutline ? 'Generating...' : 'Draft Service Outline'}
        </button>
      </div>

      {/* Chat Interface */}
      <div className={`flex-1 overflow-y-auto pr-2 ${messages.length > 0 ? 'space-y-4' : ''}`}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'model' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'model'
              ? 'bg-gray-900/60 backdrop-blur-sm text-gray-100 border border-gray-800'
              : 'bg-blue-600/20 backdrop-blur-sm text-blue-100 border border-blue-500/50'}`}>

              {message.role === 'model' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Lighthouse AI</span>
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap">
                {message.content}
                {questionsAsked.includes(message.content) && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Share your thoughts..."
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEulogyResponse((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                    <button
                      onClick={handleSkipQuestion}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 text-gray-400 text-sm rounded-lg hover:bg-gray-700 hover:text-gray-200 transition-all"
                    >
                      <Skip className="w-3 h-3" />
                      Skip for now
                    </button>
                  </div>
                )}
              </p>

              {message.role === 'model' && (
                <div className="flex items-center gap-2 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyToClipboard(message.content)}
                    className="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Copy
                  </button>
                  {serviceOutline && (
                    <button
                      onClick={playEulogyAudio}
                      disabled={isPlayingAudio}
                      className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
                    >
                      {isPlayingAudio ? (
                        <>
                          <StopCircle className="w-3 h-3" />
                          Playing...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Play Eulogy
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-900/60 backdrop-blur-sm text-gray-100 border border-gray-800 rounded-2xl p-4 max-w-[80%]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Your AI Companion</h3>
            <p className="text-gray-400 text-sm">
              I'm here to help you navigate this journey with compassion and support.
            </p>
          </div>
        )}

        {/* Editable Service Outline */}
        {serviceOutline && (
          <div className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Service Outline</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingOutline(!isEditingOutline)}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                >
                  {isEditingOutline ? 'View' : 'Edit'}
                </button>
                <button
                  onClick={() => handleCopyToClipboard(editedOutline)}
                  className="px-3 py-1 bg-gray-700/50 text-gray-400 text-sm rounded-lg hover:bg-gray-700 hover:text-gray-200 transition-all"
                >
                  Copy
                </button>
              </div>
            </div>
            {isEditingOutline ? (
              <textarea
                value={editedOutline}
                onChange={(e) => {
                  setEditedOutline(e.target.value);
                  if (onServiceOutlineChange) {
                    onServiceOutlineChange(e.target.value);
                  }
                }}
                className="w-full h-64 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Edit your service outline..."
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-300 overflow-x-auto max-h-64 font-mono">
                {editedOutline}
              </pre>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {messages.length > 0 && !isLiveActive && (
        <div className="border-t border-gray-800 pt-4">
          <div className="flex gap-2">
            {mode === 'VOICE' ? (
              <div className="flex-1 flex flex-col items-center">
                {isListening && (
                  <div className="mb-2 text-red-400 text-sm">
                    Listening... Speak now
                  </div>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Speak or type your message..."
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={toggleVoiceInput}
                    disabled={isListening}
                    className="bg-red-500/20 text-red-400 border border-red-500/50 p-3 rounded-full hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="bg-blue-500/20 text-blue-400 border border-blue-500/50 p-3 rounded-full hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-blue-500/20 text-blue-400 border border-blue-500/50 p-3 rounded-full hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={() => setMode(mode === 'TEXT' ? 'VOICE' : 'TEXT')}
              className="bg-gray-800/50 text-gray-400 border border-gray-700 p-3 rounded-full hover:bg-gray-800 hover:text-gray-200 transition-all"
            >
              {mode === 'VOICE' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Live Session Interface */}
      {isLiveActive && (
        <div className="border-t border-gray-800 pt-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
              <MapIcon className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-sm text-red-400 mb-4">Live session active - I'm here for you</p>

            <div className="text-center">
              <p className="text-xs text-gray-400 mb-4">How are you feeling right now?</p>

              <div className="flex justify-center gap-2 mb-4">
                {['Heartbroken', 'Overwhelmed', 'Anxious', 'Grateful', 'Peaceful'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => handleEmotionResponse(emotion)}
                    className="px-4 py-2 bg-gray-800/50 text-gray-300 text-sm rounded-full hover:bg-gray-800 hover:text-gray-100 transition-all"
                  >
                    {emotion}
                  </button>
                ))}
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share what's on your mind..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4 h-20"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => handleLiveSubmit()}
                  disabled={!input.trim()}
                  className="flex-1 bg-red-500/20 text-red-400 border border-red-500/50 px-8 py-3 rounded-full hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                >
                  Send
                </button>

                <button
                  onClick={toggleLiveMode}
                  className="bg-gray-800/50 text-gray-400 border border-gray-700 px-4 py-3 rounded-full hover:bg-gray-800 hover:text-gray-200 transition-all"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompassionateAssistant;