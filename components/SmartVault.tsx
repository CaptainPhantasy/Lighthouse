import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, FileText, Loader2, Upload, Filter, Tag, CheckCircle, FileDown, Copy, Sparkles, ArrowRight, Wifi, WifiOff, AlertCircle, Eye } from 'lucide-react';
import { analyzeDocument, generateNotificationDraft } from '../services/geminiService';
import { DocumentScan, Task } from '../types';
import { encryptObject, decryptObject, EncryptionResult } from '../utils/encryption';
import { ENCRYPTION_PASSWORD } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import {
  initOfflineQueue,
  enqueueOfflineScan,
  syncQueue,
  isOnline as checkOnline,
  getQueueSize,
  getQueueSummary,
  type OfflineQueueOptions,
} from '../utils/offlineQueue';

interface SmartVaultProps {
  onTaskCreated?: (task: Task) => void;
  onDocumentScan?: (document: DocumentScan) => void;
  onDocumentFinding?: (finding: { message: string; type: string }) => void;
}

// Phase 2: Multimodal feedback states
type ScanGuidance = {
  state: 'idle' | 'positioning' | 'stable' | 'analyzing' | 'complete' | 'error';
  message: string;
  confidence?: number;
};

const SmartVault: React.FC<SmartVaultProps> = ({ onTaskCreated, onDocumentScan, onDocumentFinding }) => {
  const { isDark } = useTheme();
  const [documents, setDocuments] = useState<DocumentScan[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [recentlyCreatedTask, setRecentlyCreatedTask] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentScan | null>(null);
  const [notificationDraft, setNotificationDraft] = useState<string>('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{[key: string]: any}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 2: Offline queue state
  const [isOnline, setIsOnline] = useState(checkOnline());
  const [queuedScans, setQueuedScans] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);

  // Phase 2: Scan guidance state
  const [scanGuidance, setScanGuidance] = useState<ScanGuidance>({
    state: 'idle',
    message: '',
  });

  const handleGenerateDraft = async (document: DocumentScan) => {
    const decryptedExtractedData = decryptedData[document.id];
    if (!decryptedExtractedData || decryptedExtractedData.length === 0) return;

    setIsGeneratingDraft(true);
    try {
      const draft = await generateNotificationDraft(document.type, decryptedExtractedData);
      setNotificationDraft(draft.text);
      setSelectedDocument(document);
    } catch (error) {
      alert("Could not generate notification draft. Please try again.");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (notificationDraft) {
      navigator.clipboard.writeText(notificationDraft).then(() => {
        alert("Notification draft copied to clipboard!");
      }).catch(() => {
        alert("Failed to copy to clipboard. Please copy manually.");
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedDocument(null);
    setNotificationDraft('');
  };

  // Decrypt document data when documents change
  useEffect(() => {
    const decryptDocuments = async () => {
      const decrypted: {[key: string]: any} = {};

      for (const doc of documents) {
        if (doc.extractedData && typeof doc.extractedData === 'object' && 'encrypted' in doc.extractedData) {
          try {
            const decryptedData = await decryptObject(doc.extractedData as EncryptionResult, ENCRYPTION_PASSWORD);
            decrypted[doc.id] = decryptedData;
          } catch (error) {
            console.error(`Failed to decrypt document ${doc.id}:`, error);
            decrypted[doc.id] = [];
          }
        } else {
          // Already decrypted
          decrypted[doc.id] = doc.extractedData;
        }
      }

      setDecryptedData(decrypted);
    };

    decryptDocuments();
  }, [documents]);

  // Phase 2: Initialize offline queue and listen for connectivity changes
  useEffect(() => {
    const cleanup = initOfflineQueue({
      onSyncStart: () => {
        setIsSyncing(true);
        setSyncResult(null);
      },
      onSyncComplete: (results) => {
        setSyncResult(results);
        setIsSyncing(false);
        // Update queue size
        setQueuedScans(getQueueSize());
        // Clear sync result after 5 seconds
        setTimeout(() => setSyncResult(null), 5000);
      },
      onQueueChange: (size) => {
        setQueuedScans(size);
      },
    });

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial queue size check
    setQueuedScans(getQueueSize());

    return () => {
      cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Phase 2: Enhanced file upload with offline support
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    // Update scan guidance
    setScanGuidance({ state: 'analyzing', message: 'Reading your document...' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Raw = event.target?.result as string;
      const base64Data = base64Raw.split(',')[1];
      const mimeType = file.type;

      // Check if online
      if (!checkOnline()) {
        console.log('[SmartVault] Offline - enqueuing scan for later');
        enqueueOfflineScan(file.name, mimeType, base64Data);
        setQueuedScans(getQueueSize() + 1);
        setIsAnalyzing(false);

        // Show offline notification
        setScanGuidance({
          state: 'complete',
          message: `Saved "${file.name}" to offline queue. It will sync when you're back online.`,
        });
        setTimeout(() => setScanGuidance({ state: 'idle', message: '' }), 5000);
        return;
      }

      try {
        const analysis = await analyzeDocument(base64Data, mimeType);

        // Phase 2: Provide intelligent feedback based on document type
        let guidanceMessage = '';
        if (analysis.documentType === 'WILL') {
          guidanceMessage = 'I found a Last Will. Keep it safe—I\'ve extracted the executor name.';
        } else if (analysis.documentType === 'INSURANCE') {
          guidanceMessage = 'I see an insurance policy. I\'ve noted the carrier and policy number.';
        } else if (analysis.documentType === 'ID') {
          guidanceMessage = 'This looks like a government ID. I\'ve saved the details.';
        } else {
          guidanceMessage = `Document analyzed: ${analysis.summary}`;
        }

        setScanGuidance({ state: 'complete', message: guidanceMessage });
        setTimeout(() => setScanGuidance({ state: 'idle', message: '' }), 5000);

        const newDoc: DocumentScan = {
          id: Date.now().toString(),
          name: file.name,
          type: (analysis.documentType as any) || 'OTHER',
          url: base64Raw,
          summary: analysis.summary,
          extractedData: analysis.entities
        };

        // Auto-create tasks (existing logic)
        if (onTaskCreated) {
          let taskToCreate: Task | null = null;

          switch (analysis.documentType) {
            case 'INSURANCE':
              const policyNumber = analysis.entities?.find((e: any) => e.key.toLowerCase().includes('policy'))?.value;
              const carrier = analysis.entities?.find((e: any) => e.key.toLowerCase().includes('carrier') || e.key.toLowerCase().includes('company'))?.value;

              if (policyNumber && carrier) {
                taskToCreate = {
                  id: `insurance-task-${Date.now()}`,
                  title: `Claim Policy #${policyNumber} with ${carrier}`,
                  description: `Contact ${carrier} to begin the claims process for policy #${policyNumber}. Have the policy document and death certificate ready.`,
                  priority: 'HIGH',
                  status: 'PENDING',
                  category: 'FINANCIAL'
                };
                if (onDocumentFinding) {
                  onDocumentFinding({
                    message: `I found an Insurance Policy with ${carrier} (Policy #${policyNumber}). I've drafted the claim letter for you in the Guide.`,
                    type: 'INSURANCE'
                  });
                }
              }
              break;

            case 'WILL':
              const executor = analysis.entities?.find((e: any) => e.key.toLowerCase().includes('executor'))?.value;
              const lawyer = analysis.entities?.find((e: any) => e.key.toLowerCase().includes('lawyer') || e.key.toLowerCase().includes('attorney'))?.value;

              if (executor) {
                taskToCreate = {
                  id: `will-task-${Date.now()}`,
                  title: `Notify Executor ${executor}`,
                  description: `Contact the will executor, ${executor}, to inform them of the passing and discuss next steps for estate administration.`,
                  priority: 'URGENT',
                  status: 'PENDING',
                  category: 'LEGAL'
                };
                if (onDocumentFinding) {
                  onDocumentFinding({
                    message: `I found a Will naming ${executor} as Executor. I've added this as an urgent task.`,
                    type: 'WILL'
                  });
                }
              } else if (lawyer) {
                taskToCreate = {
                  id: `will-task-${Date.now()}`,
                  title: `Contact Estate Attorney ${lawyer}`,
                  description: `Reach out to the estate attorney ${lawyer} to begin the probate process and understand the legal requirements.`,
                  priority: 'URGENT',
                  status: 'PENDING',
                  category: 'LEGAL'
                };
                if (onDocumentFinding) {
                  onDocumentFinding({
                    message: `I found a Will referencing attorney ${lawyer}. I've added contact as an urgent task.`,
                    type: 'WILL'
                  });
                }
              }
              break;

            case 'ID':
              const idNumber = analysis.entities?.find((e: any) => e.key.toLowerCase().includes('id') || e.key.toLowerCase().includes('license'))?.value;
              if (idNumber) {
                taskToCreate = {
                  id: `id-task-${Date.now()}`,
                  title: 'Report Death to Government Agencies',
                  description: `Contact the Social Security Administration and relevant agencies to report the death using ID ${idNumber}. This prevents identity theft and stops benefits.`,
                  priority: 'NORMAL',
                  status: 'PENDING',
                  category: 'LEGAL'
                };
              }
              break;

            default:
              if (analysis.taskSuggestion) {
                taskToCreate = {
                  id: `doc-task-${Date.now()}`,
                  title: analysis.taskSuggestion.title,
                  description: analysis.taskSuggestion.description,
                  priority: (analysis.taskSuggestion.priority as any) || 'NORMAL',
                  status: 'PENDING',
                  category: (analysis.taskSuggestion.category as any) || 'FINANCIAL'
                };
              }
          }

          if (taskToCreate) {
            onTaskCreated(taskToCreate);
            setRecentlyCreatedTask(taskToCreate.id);
            setTimeout(() => setRecentlyCreatedTask(null), 3000);
          }
        }

        // Encrypt and store
        try {
          const encryptedDoc = { ...newDoc };
          if (newDoc.extractedData) {
            const encryptedData = await encryptObject(newDoc.extractedData, ENCRYPTION_PASSWORD);
            encryptedDoc.extractedData = encryptedData;
          }

          if (onDocumentScan) {
            onDocumentScan(newDoc);
          }

          setDocuments(prev => [encryptedDoc, ...prev]);
        } catch (encryptionError) {
          console.error('Failed to encrypt document data:', encryptionError);
          if (onDocumentScan) {
            onDocumentScan(newDoc);
          }
          setDocuments(prev => [newDoc, ...prev]);
        }
      } catch (err) {
        console.error('Error in document analysis:', err);

        // Offline fallback - queue for later
        if (checkOnline()) {
          enqueueOfflineScan(file.name, mimeType, base64Data);
          setQueuedScans(getQueueSize() + 1);
          setScanGuidance({
            state: 'error',
            message: 'Having trouble analyzing. I\'ve saved it for later.',
          });
        } else {
          setScanGuidance({
            state: 'error',
            message: 'Offline mode. Document saved for when you\'re back online.',
          });
        }
        setTimeout(() => setScanGuidance({ state: 'idle', message: '' }), 5000);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Manual sync trigger
  const handleManualSync = async () => {
    if (!checkOnline()) {
      setScanGuidance({
        state: 'error',
        message: 'You\'re still offline. Connect to the internet to sync.',
      });
      setTimeout(() => setScanGuidance({ state: 'idle', message: '' }), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    const results = await syncQueue();
    setSyncResult(results);
    setQueuedScans(getQueueSize());
    setIsSyncing(false);

    if (results.success > 0) {
      setScanGuidance({
        state: 'complete',
        message: `Synced ${results.success} document${results.success > 1 ? 's' : ''} successfully!`,
      });
      setTimeout(() => setScanGuidance({ state: 'idle', message: '' }), 3000);
    }
  };

  // Get unique document types for filter tabs
  const docTypes = useMemo(() => {
    const types = new Set(documents.map(d => d.type));
    return ['ALL', ...Array.from(types)];
  }, [documents]);

  const filteredDocs = activeFilter === 'ALL' 
    ? documents 
    : documents.filter(d => d.type === activeFilter);

  return (
    <div className="space-y-6">
      {/* Task Creation Notification */}
      <AnimatePresence>
        {recentlyCreatedTask && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`${isDark ? 'bg-stone-800 text-white' : 'bg-white text-black border border-stone-200'} p-4 rounded-2xl flex items-center gap-3 shadow-lg`}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">New task created!</p>
              <p className="text-xs opacity-80">Go to the Plan tab to see your new action item.</p>
            </div>
            <button
              onClick={() => setRecentlyCreatedTask(null)}
              className={`w-8 h-8 rounded-full ${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-stone-200 hover:bg-stone-300'} flex items-center justify-center transition-colors`}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isDark ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border border-stone-200 text-black'} p-6 rounded-2xl shadow-sm`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-stone-800 text-white' : 'bg-black text-white'} flex items-center justify-center`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Smart Vault</h2>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-800'}`}>
                Securely scan Wills, Insurance Policies, and IDs. AI will extract key information.
              </p>
            </div>
          </div>

          {/* Phase 2: Connection Status Indicator */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-medium">Online</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                <WifiOff className="w-4 h-4" />
                <span className="text-xs font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* Phase 2: Scan Guidance Message */}
        <AnimatePresence>
          {scanGuidance.message && (
            <motion.div
              key={scanGuidance.message}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${
                scanGuidance.state === 'complete'
                  ? isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'
                  : scanGuidance.state === 'error'
                  ? isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                  : isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {scanGuidance.state === 'complete' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : scanGuidance.state === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Eye className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm flex-1">{scanGuidance.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Offline Queue Indicator */}
        {queuedScans > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-xl flex items-center justify-between ${
              isDark ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-amber-800' : 'bg-amber-200'}`}>
                <Upload className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                  {queuedScans} document{queuedScans > 1 ? 's' : ''} queued for sync
                </p>
                <p className={`text-xs ${isDark ? 'text-amber-500' : 'text-amber-700'}`}>
                  {isOnline ? 'Ready to sync' : 'Will sync when you\'re online'}
                </p>
              </div>
            </div>
            {isOnline && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSyncing
                    ? 'bg-stone-400 text-stone-600 cursor-wait'
                    : isDark
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </motion.div>
        )}

        {/* Phase 2: Sync Result Notification */}
        <AnimatePresence>
          {syncResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${
                syncResult.success > 0
                  ? isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'
                  : isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-600'
              }`}
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {syncResult.success > 0 && `Synced ${syncResult.success} document${syncResult.success > 1 ? 's' : ''}`}
                  {syncResult.failed > 0 && ` (${syncResult.failed} failed)`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors"
        >
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-sm font-medium">Analyzing document...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-stone-200 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Tap to Scan Document</p>
                <p className="text-xs text-stone-700 mt-1">Supports images and PDFs</p>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            /* DO NOT ADD capture="environment" here to allow gallery access */
          />
        </div>
      </motion.div>

      {documents.length > 0 && (
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
         >
            {docTypes.map(type => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === type
                    ? (isDark ? 'bg-stone-700 text-white' : 'bg-black text-white')
                    : (isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-white border border-stone-300 text-black hover:bg-stone-100')
                }`}
              >
                {type}
              </motion.button>
            ))}
         </motion.div>
      )}

      <div className="space-y-4">
        {filteredDocs.length === 0 && documents.length > 0 && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-center py-8"
           >
             <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
             <p className="text-stone-700 text-sm">No documents found in this category.</p>
           </motion.div>
        )}

        {filteredDocs.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border border-stone-200'} p-5 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow`}
          >
            <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-200'} p-3 rounded-xl`}>
              <FileText className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-start">
                <h3 className="font-bold truncate pr-2">{doc.type}</h3>
                <span className="text-[10px] uppercase tracking-wider bg-stone-200 px-2 py-1 rounded-full flex-shrink-0">Analyzed</span>
              </div>
              <p className="text-sm text-stone-700 mt-1 line-clamp-2">{doc.summary}</p>

              {decryptedData[doc.id] && (
                <>
                  <div className="mt-3 bg-stone-100 p-3 rounded-xl text-xs space-y-1">
                    {decryptedData[doc.id].map((item: any, i: number) => (
                      <div key={i} className="flex justify-between border-b border-stone-300 pb-1 last:border-0">
                        <span className="text-stone-700 truncate mr-2">{item.key}:</span>
                        <span className="font-medium truncate max-w-[50%]">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleGenerateDraft(doc)}
                    className="mt-3 flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    <FileDown className="w-4 h-4" />
                    Auto-Draft Letter
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Notification Draft Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  Auto-Draft Letter - {selectedDocument.type}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                AI-generated notification letter for {selectedDocument.type.toLowerCase()}
              </p>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              {isGeneratingDraft ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                  <span className="ml-2 text-sm text-slate-600">Generating letter...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                    {notificationDraft}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  You can edit this letter before copying or sending
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className={`flex items-center gap-1 px-3 py-2 ${isDark ? 'bg-stone-700 text-white hover:bg-stone-600' : 'bg-black text-white hover:bg-stone-800'} rounded-lg text-sm transition-colors`}
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartVault;