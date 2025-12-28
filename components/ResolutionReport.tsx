import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, Task, DocumentScan } from '../types';
import { CheckCircle, FileText, Download, Shield, Trash2, Heart, AlertCircle, Sparkles, Feather, Lock, Gift, FileDown, RotateCcw } from 'lucide-react';
import { TEXTS } from '../constants';
import { sanitizeData } from '../utils/encryption';
import { useTheme } from '../contexts/ThemeContext';
import {
  downloadLanternPDF,
  openLanternForPrint,
  extractLanternDataFromUserState,
  type LanternPDFData,
} from '../services/lanternService';
import {
  performCompleteRestoration,
  hasMemorial,
  getMemorial as getMemorialData,
  clearMemorial,
  containsPII,
} from '../utils/secureScrub';

interface ResolutionReportProps {
  userState: UserState;
  tasks: Task[];
  documentScans: DocumentScan[];
  serviceOutline?: string;
  onSanitizeData?: () => void;
}

interface CompletedTask {
  id: string;
  title: string;
  description: string;
  completedDate: string;
  category: string;
}

interface DocumentRecord {
  id: string;
  type: string;
  scannedDate: string;
  status: 'PROCESSED' | 'ARCHIVED';
}

interface LegacyExport {
  obituary: string;
  serviceOutline: string;
  memories: string[];
  completedTasks: CompletedTask[];
  generatedDate: string;
  deceasedName: string;
}

const ResolutionReport: React.FC<ResolutionReportProps> = ({
  userState,
  tasks,
  documentScans,
  serviceOutline,
  onSanitizeData
}) => {
  const { isDark } = useTheme();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [documentRecords, setDocumentRecords] = useState<DocumentRecord[]>([]);

  // Phase 2: Memorial state (for restoration complete)
  const [memorialMode, setMemorialMode] = useState(false);
  const [memorialData, setMemorialData] = useState<ReturnType<typeof getMemorialData> | null>(null);
  const [lanternGenerating, setLanternGenerating] = useState(false);
  const [showScrubConfirm, setShowScrubConfirm] = useState(false);

  useEffect(() => {
    // Check for existing memorial (app has been restored)
    const existingMemorial = getMemorialData();
    if (existingMemorial) {
      setMemorialMode(true);
      setMemorialData(existingMemorial);
    }

    // Filter completed tasks and format them
    const completed = tasks
      .filter(task => task.status === 'COMPLETED')
      .map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completedDate: new Date().toISOString().split('T')[0], // This would be actual completion date
        category: task.category
      }));
    setCompletedTasks(completed);

    // Format document records
    const records = documentScans.map(scan => ({
      id: scan.id,
      type: scan.documentType || 'Unknown',
      scannedDate: new Date(scan.scannedDate || Date.now()).toISOString().split('T')[0],
      status: 'PROCESSED' as const
    }));
    setDocumentRecords(records);
  }, [tasks, documentScans]);

  // Check if all urgent and high priority tasks are completed
  const allUrgentAndHighCompleted = tasks.every(task => {
    if (task.priority === 'URGENT' || task.priority === 'HIGH') {
      return task.status === 'COMPLETED';
    }
    return true;
  });

  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === 'COMPLETED');
  const completionPercentage = Math.round((completedTasks.length / tasks.length) * 100);

  const generateLegacyExport = () => {
    setIsGenerating(true);

    // Generate a simple obituary from available information
    const obituary = `${userState.deceasedName || 'A beloved person'} brought light and love into the lives of those around them. They will be deeply missed and forever remembered in our hearts.`;

    const legacyExport: LegacyExport = {
      obituary,
      serviceOutline: serviceOutline || 'No service outline created yet.',
      memories: [], // Would be populated from memory recording
      completedTasks,
      generatedDate: new Date().toISOString().split('T')[0],
      deceasedName: userState.deceasedName || 'Your Loved One'
    };

    // Create and download the legacy export
    const blob = new Blob([JSON.stringify(legacyExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legacy-${userState.deceasedName || 'loved-one'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setIsGenerating(false);
    setShowExportModal(false);
  };

  const exportAsPDF = () => {
    // This would use a PDF generation library
    const printContent = `
      <html>
        <head>
          <title>Legacy Hand-off - ${userState.deceasedName || 'Your Loved One'}</title>
          <style>
            body { font-family: 'Georgia, serif'; line-height: 1.6; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; }
            .section { margin-bottom: 30px; }
            .completed { color: #22c55e; }
            h1 { font-size: 28pt; color: #1e3a5f; }
            h2 { font-size: 18pt; color: #3b5998; margin-top: 30px; }
            .quote { font-style: italic; color: #666; padding: 20px; background: #f9f9f9; border-left: 4px solid #3b5998; }
            .task-list { list-style: none; padding: 0; }
            .task-list li { padding: 10px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>The Legacy Hand-off</h1>
            <h2>In Honor of ${userState.deceasedName || 'Your Loved One'}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <div class="quote">
              "${TEXTS.legacy_subtitle}"
            </div>
          </div>

          <div class="section">
            <h2>Completion Summary</h2>
            <p>You've completed ${completionPercentage}% of the journey (${completedTasks.length} of ${tasks.length} tasks)</p>
            <p>Documents processed: ${documentScans.length}</p>
          </div>

          <div class="section">
            <h2>Completed Tasks</h2>
            <ul class="task-list">
              ${completedTasks.map(task => `
                <li>
                  <span class="completed">✓</span>
                  <strong>${task.title}</strong> - ${task.description}
                </li>
              `).join('')}
            </ul>
          </div>

          ${serviceOutline ? `
          <div class="section">
            <h2>Service Outline</h2>
            <pre style="white-space: pre-wrap; font-family: Georgia, serif;">${serviceOutline}</pre>
          </div>
          ` : ''}

          <div class="section" style="margin-top: 50px; text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
            <h3 style="color: white; margin: 0 0 10px 0;">A Job Well Done</h3>
            <p style="margin: 0;">You've navigated this journey with grace and strength. Their memory lives on through your care.</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Phase 2: Lantern PDF Handlers
  const handleDownloadLantern = () => {
    setLanternGenerating(true);
    try {
      const lanternData = extractLanternDataFromUserState(userState, tasks, documentScans);
      downloadLanternPDF(lanternData);
    } catch (error) {
      console.error('[Lantern] Failed to generate:', error);
    } finally {
      setTimeout(() => setLanternGenerating(false), 1000);
    }
  };

  const handlePrintLantern = () => {
    setLanternGenerating(true);
    try {
      const lanternData = extractLanternDataFromUserState(userState, tasks, documentScans);
      openLanternForPrint(lanternData);
    } catch (error) {
      console.error('[Lantern] Failed to open for print:', error);
    } finally {
      setTimeout(() => setLanternGenerating(false), 1000);
    }
  };

  // Phase 2: Secure Scrub - Complete Restoration Protocol
  const handleSecureScrub = async () => {
    if (!containsPII(userState)) {
      alert('No personal information found to scrub.');
      return;
    }

    setIsSanitizing(true);

    // Perform complete restoration
    const memorial = await performCompleteRestoration(userState);

    // Update state to memorial mode
    setMemorialMode(true);
    setMemorialData(memorial);
    setIsSanitizing(false);
    setShowScrubConfirm(false);

    // Notify parent if callback exists
    if (onSanitizeData) {
      onSanitizeData();
    }
  };

  const sanitizeAndDestroy = () => {
    if (confirm(TEXTS.legacy_subtitle + '\n\nThis will permanently delete all sensitive information while preserving your memories. Are you ready?')) {
      setIsSanitizing(true);

      // Clear sensitive data from localStorage
      localStorage.removeItem('userState');
      localStorage.removeItem('tasks');
      localStorage.removeItem('documentScans');
      localStorage.removeItem('serviceOutline');
      localStorage.removeItem('lighthouse_intake_data');
      localStorage.removeItem('lighthouse_intake_step');

      // Reset state (call parent callback if available)
      if (onSanitizeData) {
        onSanitizeData();
      }

      // Update local state
      setTimeout(() => {
        setIsSanitizing(false);
        alert('Your data has been securely sanitized. Thank you for allowing Lighthouse to guide you through this journey.');
      }, 1000);
    }
  };

  if (!allUrgentAndHighCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center"
      >
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-amber-800 mb-2">Journey in Progress</h2>
        <p className="text-amber-700 mb-4">
          Please complete all URGENT and HIGH priority tasks before accessing the Legacy Hand-off.
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            {tasks.filter(t => t.priority === 'URGENT' && t.status !== 'COMPLETED').length} URGENT tasks remaining
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            {tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length} HIGH tasks remaining
          </span>
        </div>
      </motion.div>
    );
  }

  // Phase 2: Memorial Mode - Display when restoration is complete
  if (memorialMode && memorialData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className={`inline-flex items-center justify-center w-24 h-24 ${isDark ? 'bg-stone-800' : 'bg-stone-100'} rounded-full mb-6`}
        >
          <Heart className={`w-12 h-12 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} />
        </motion.div>

        <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
          Restoration Complete
        </h1>

        <p className={`${isDark ? 'text-stone-400' : 'text-stone-600'} mb-8 max-w-md mx-auto`}>
          All personal information has been securely removed. The memory of {memorialData.deceasedName} has been honored and preserved.
        </p>

        <div className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'} border rounded-2xl p-6 mb-6`}>
          <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'} mb-2`}>Completed</p>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-black'}`}>{memorialData.completionDate}</p>
        </div>

        {memorialData.memorialMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'} border rounded-2xl p-6 mb-6`}
          >
            <p className={`italic ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              {memorialData.memorialMessage}
            </p>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            clearMemorial();
            setMemorialMode(false);
            setMemorialData(null);
          }}
          className={`${isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'} px-6 py-3 rounded-xl font-medium transition-colors`}
        >
          Close Memorial
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4 shadow-lg"
        >
          <Heart className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          {TEXTS.legacy_title}
        </h1>
        <p className={isDark ? 'text-stone-300' : 'text-black'}>
          {TEXTS.legacy_subtitle}
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'bg-stone-900' : 'bg-white'} rounded-xl shadow-lg p-6 text-center`}
        >
          <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            {completedTasks.length}
          </div>
          <div className={isDark ? 'text-white' : 'text-black'}>Tasks Completed</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`${isDark ? 'bg-stone-900' : 'bg-white'} rounded-xl shadow-lg p-6 text-center`}
        >
          <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            {documentScans.length}
          </div>
          <div className={isDark ? 'text-white' : 'text-black'}>Documents Preserved</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`${isDark ? 'bg-stone-900' : 'bg-white'} rounded-xl shadow-lg p-6 text-center`}
        >
          <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            {completionPercentage}%
          </div>
          <div className={isDark ? 'text-white' : 'text-black'}>Complete</div>
        </motion.div>
      </div>

      {/* Legacy Export CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'} border-2 rounded-2xl p-6 mb-8`}
      >
        <div className="flex items-start gap-4">
          <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-200'} p-4 rounded-xl`}>
            <Gift className={`w-8 h-8 ${isDark ? 'text-stone-400' : 'text-stone-700'}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Create a Digital Memorial</h3>
            <p className={isDark ? 'text-stone-400 mb-4' : 'text-black mb-4'}>
              {TEXTS.legacy_export}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExportModal(true)}
              className={`${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-black hover:bg-stone-800'} text-white px-6 py-3 rounded-xl font-medium shadow-md flex items-center gap-2`}
            >
              <Sparkles className="w-5 h-5" />
              Create Legacy Export
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Phase 2: Lantern PDF - The Logistical Ledger */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'} border-2 rounded-2xl p-6 mb-8`}
      >
        <div className="flex items-start gap-4">
          <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-200'} p-4 rounded-xl`}>
            <FileDown className={`w-8 h-8 ${isDark ? 'text-stone-400' : 'text-stone-700'}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>The Lantern - Logistical Ledger</h3>
            <p className={`${isDark ? 'text-stone-400 mb-4' : 'text-black mb-4'}`}>
              Generate a formal document to share with funeral directors, airlines, banks, and financial institutions. Removes the burden of explaining everything repeatedly.
            </p>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadLantern}
                disabled={lanternGenerating}
                className={`${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-black hover:bg-stone-800'} text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2 disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                {lanternGenerating ? 'Generating...' : 'Download Lantern'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrintLantern}
                disabled={lanternGenerating}
                className={`${isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'} px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50`}
              >
                <FileText className="w-4 h-4" />
                Print / Save as PDF
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportAsPDF}
          className={`flex-1 ${isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-gray-100 text-black hover:bg-gray-200'} py-3 rounded-xl transition-colors flex items-center justify-center gap-2`}
        >
          <FileText className="w-5 h-5" />
          Print Summary
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowScrubConfirm(true)}
          disabled={isSanitizing}
          className={`flex-1 ${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-black hover:bg-stone-800'} text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50`}
        >
          <RotateCcw className="w-5 h-5" />
          {isSanitizing ? 'Restoring...' : 'Complete Restoration'}
        </motion.button>
      </div>

      {/* Completed Tasks Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`${isDark ? 'bg-stone-900' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>What You've Accomplished</h3>
        <div className="space-y-3">
          {completedTasks.length > 0 ? (
            completedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
                <span className={isDark ? 'text-white' : 'text-black'}>{task.title}</span>
              </div>
            ))
          ) : (
            <p className="text-stone-600">Complete tasks to see them here.</p>
          )}
        </div>
      </motion.div>

      {/* Final Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`text-center p-8 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'} rounded-2xl border`}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`w-16 h-16 ${isDark ? 'bg-stone-800' : 'bg-stone-200'} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <Feather className={`w-8 h-8 ${isDark ? 'text-stone-400' : 'text-stone-700'}`} />
        </motion.div>
        <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
          From Loss to Legacy
        </h3>
        <p className={`${isDark ? 'text-stone-400' : 'text-stone-700'} max-w-md mx-auto`}>
          You've navigated this journey with grace and strength. Your loved one's memory lives on—not in the tasks completed, but in the love you shared and the lives they touched.
        </p>
      </motion.div>

      {/* Legacy Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDark ? 'bg-stone-900' : 'bg-white'} rounded-2xl max-w-lg w-full p-6 shadow-2xl`}
            >
              <div className="text-center mb-6">
                <div className={`${isDark ? 'bg-stone-800' : 'bg-stone-200'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Sparkles className={`w-8 h-8 ${isDark ? 'text-stone-400' : 'text-stone-700'}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Legacy Export</h3>
                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>
                  Create a beautiful digital memorial containing the obituary, service outline, and your completed journey.
                </p>
              </div>

              <div className={`space-y-3 mb-6 ${isDark ? 'text-stone-400' : ''}`}>
                <div className="flex items-center gap-3 text-sm">
                  <Feather className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-600'}`} />
                  <span className={isDark ? 'text-stone-300' : 'text-gray-700'}>Obituary draft</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-600'}`} />
                  <span className={isDark ? 'text-stone-300' : 'text-gray-700'}>Service outline</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-600'}`} />
                  <span className={isDark ? 'text-stone-300' : 'text-gray-700'}>Completed tasks record</span>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateLegacyExport}
                  disabled={isGenerating}
                  className={`flex-1 ${isDark ? 'bg-stone-700 hover:bg-stone-600' : 'bg-black hover:bg-stone-800'} text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? 'Creating...' : 'Download Legacy'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExportModal(false)}
                  className={`px-6 py-3 ${isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl font-medium transition-colors`}
                >
                  Cancel
                </motion.button>
              </div>

              <p className={`text-xs mt-4 text-center flex items-center justify-center gap-1 ${isDark ? 'text-stone-500' : 'text-gray-700'}`}>
                <Lock className="w-3 h-3" />
                Your data remains private and secure
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: Secure Scrub Confirmation Modal */}
      <AnimatePresence>
        {showScrubConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowScrubConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDark ? 'bg-stone-900' : 'bg-white'} rounded-2xl max-w-lg w-full p-6 shadow-2xl`}
            >
              <div className="text-center mb-6">
                <div className={`${isDark ? 'bg-red-900/30' : 'bg-red-50'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Shield className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Complete Restoration</h3>
                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-800'}`}>
                  This will permanently remove all personal information from your device.
                </p>
              </div>

              <div className={`${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'} border rounded-xl p-4 mb-6`}>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>What will be deleted:</h4>
                <ul className={`text-sm space-y-2 ${isDark ? 'text-stone-400' : 'text-gray-700'}`}>
                  <li className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Your name and relationship
                  </li>
                  <li className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Deceased information and location
                  </li>
                  <li className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    All document scans (encrypted and decrypted)
                  </li>
                  <li className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Tasks and milestones
                  </li>
                  <li className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Your story transcript and conversations
                  </li>
                </ul>

                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-stone-700' : 'border-stone-200'}`}>
                  <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>What will remain:</h4>
                  <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-700'}`}>
                    A memorial entry showing the completion date and honoring their memory.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSecureScrub}
                  disabled={isSanitizing}
                  className={`flex-1 ${isDark ? 'bg-red-900/50 hover:bg-red-900/70 text-red-200' : 'bg-red-600 hover:bg-red-700 text-white'} py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  <Shield className="w-4 h-4" />
                  {isSanitizing ? 'Securing...' : 'Complete Restoration'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowScrubConfirm(false)}
                  className={`px-6 py-3 ${isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-xl font-medium transition-colors`}
                >
                  Cancel
                </motion.button>
              </div>

              <p className={`text-xs mt-4 text-center flex items-center justify-center gap-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
                <Lock className="w-3 h-3" />
                This action cannot be undone
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResolutionReport;
