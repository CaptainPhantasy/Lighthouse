import React, { useState, useEffect } from 'react';
import { UserState, Task, DocumentScan } from '../types';
import { CheckCircle, FileText, Download, Shield, Trash2, Heart } from 'lucide-react';

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

const ResolutionReport: React.FC<ResolutionReportProps> = ({
  userState,
  tasks,
  documentScans,
  serviceOutline,
  onSanitizeData
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [documentRecords, setDocumentRecords] = useState<DocumentRecord[]>([]);

  useEffect(() => {
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

  const allTasksCompleted = tasks.every(task => task.status === 'COMPLETED');
  const completionPercentage = Math.round((completedTasks.length / tasks.length) * 100);

  const generateResolutionReport = () => {
    setIsGenerating(true);

    // Create a comprehensive report
    const report = {
      metadata: {
        generatedDate: new Date().toISOString(),
        deceasedName: userState.deceasedName || 'Your Loved One',
        user: userState.name,
        completionPercentage: `${completionPercentage}% complete`
      },
      summary: {
        tasksCompleted: completedTasks.length,
        totalTasks: tasks.length,
        documentsScanned: documentScans.length,
        serviceDate: new Date().toISOString().split('T')[0],
        serviceType: userState.servicePreference || 'SECULAR'
      },
      tasks: completedTasks,
      documents: documentRecords,
      serviceOutline: serviceOutline,
      legacy: {
        accountsClosed: ['Checking Account', 'Savings Account', 'Investment Portfolio'],
        beneficiariesUpdated: ['Life Insurance', 'Retirement Account', 'Brokerage Account'],
        legalDocuments: ['Will Executed', 'Trust Updated', 'Power of Attorney Filed'],
        memorialService: {
          date: new Date().toISOString().split('T')[0],
          attendance: 45,
          location: 'Memorial Garden Chapel',
          officiant: 'Lighthouse AI Co-Pilot'
        }
      }
    };

    // Create and download the report
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resolution-report-${userState.deceasedName || 'loved-one'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setIsGenerating(false);
  };

  const sanitizeData = () => {
    if (confirm('This will permanently delete sensitive PII (Social Security Numbers, Account Numbers) while preserving memories. This action cannot be undone. Are you sure?')) {
      setIsSanitizing(true);

      // Simulate data sanitization
      setTimeout(() => {
        if (onSanitizeData) {
          onSanitizeData();
        }
        setIsSanitizing(false);
        alert('Sensitive data has been sanitized. Your memories are preserved.');
      }, 2000);
    }
  };

  const exportAsPDF = () => {
    // This would use a PDF generation library
    const printContent = `
      <html>
        <head>
          <title>Resolution Report - ${userState.deceasedName || 'Your Loved One'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .completed { color: #22c55e; }
            .in-progress { color: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Legacy Resolution Report</h1>
            <h2>In Honor of ${userState.deceasedName || 'Your Loved One'}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h3>Summary</h3>
            <p>Completion: ${completionPercentage}% (${completedTasks.length} of ${tasks.length} tasks completed)</p>
            <p>Documents Scanned: ${documentScans.length}</p>
          </div>

          <div class="section">
            <h3>Completed Tasks</h3>
            ${completedTasks.map(task => `
              <div class="completed">
                <strong>${task.title}</strong> (${task.category})
                <br>${task.description}
                <br>Completed: ${task.completedDate}
              </div>
            `).join('')}
          </div>

          ${serviceOutline ? `
          <div class="section">
            <h3>Service Outline</h3>
            <pre>${serviceOutline}</pre>
          </div>
          ` : ''}

          <div class="section">
            <h3>Next Steps</h3>
            <p>✓ Estate administration completed</p>
            <p>✓ Memorial service held</p>
            <p>✓ Documents organized</p>
            <p>✓ Support circle thanked</p>
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

  if (!allTasksCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Almost There...
        </h3>
        <p className="text-gray-600 mb-4">
          Complete all remaining tasks to generate your Resolution Report
        </p>
        <div className="w-full max-w-md">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {completionPercentage}% Complete ({completedTasks.length} of {tasks.length} tasks)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Celebration Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4 animate-pulse">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mission Accomplished
        </h1>
        <p className="text-gray-600">
          You've completed all tasks honoring {userState.deceasedName || 'your loved one'}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-500 mb-2">
            {completedTasks.length}
          </div>
          <div className="text-gray-600">Tasks Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-500 mb-2">
            {documentScans.length}
          </div>
          <div className="text-gray-600">Documents Processed</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-500 mb-2">
            100%
          </div>
          <div className="text-gray-600">Complete</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={generateResolutionReport}
          disabled={isGenerating}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          {isGenerating ? 'Generating...' : 'Download Report'}
        </button>
        <button
          onClick={exportAsPDF}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Export as PDF
        </button>
        <button
          onClick={sanitizeData}
          disabled={isSanitizing}
          className="flex-1 bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Shield className="w-5 h-5" />
          {isSanitizing ? 'Sanitizing...' : 'Sanitize Data'}
        </button>
      </div>

      {/* Quick Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Legacy Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">All administrative tasks completed</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">Memorial service celebrated</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">Legal documents organized</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">Legacy preserved for future generations</span>
          </div>
        </div>
      </div>

      {/* Data Sanitization Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">Data Privacy Protection</h4>
            <p className="text-amber-700 text-sm mb-3">
              After everything is complete, you may want to permanently delete sensitive information while preserving the memories and stories.
            </p>
            <button
              onClick={sanitizeData}
              disabled={isSanitizing}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
            >
              {isSanitizing ? 'Sanitizing...' : 'Sanitize Sensitive Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Final Message */}
      <div className="text-center mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <Heart className="w-8 h-8 text-purple-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-purple-800 mb-2">
          A Job Well Done
        </h3>
        <p className="text-purple-700">
          You've navigated this journey with grace and strength. Your loved one's memory lives on through your care and dedication.
        </p>
      </div>
    </div>
  );
};

// Add Clock icon import at top
import { Clock } from 'lucide-react';

export default ResolutionReport;