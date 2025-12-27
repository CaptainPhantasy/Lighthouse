import React, { useState, useRef, useMemo } from 'react';
import { Camera, FileText, Loader2, Upload, Filter, Tag, CheckCircle } from 'lucide-react';
import { analyzeDocument } from '../services/geminiService';
import { DocumentScan, Task } from '../types';

interface SmartVaultProps {
  onTaskCreated?: (task: Task) => void;
  onDocumentScan?: (document: DocumentScan) => void;
}

const SmartVault: React.FC<SmartVaultProps> = ({ onTaskCreated, onDocumentScan }) => {
  const [documents, setDocuments] = useState<DocumentScan[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [recentlyCreatedTask, setRecentlyCreatedTask] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Raw = event.target?.result as string;
      // Remove data URL prefix for Gemini API
      const base64Data = base64Raw.split(',')[1];
      const mimeType = file.type;

      try {
        const analysis = await analyzeDocument(base64Data, mimeType);

        const newDoc: DocumentScan = {
          id: Date.now().toString(),
          name: file.name,
          type: (analysis.documentType as any) || 'OTHER',
          url: base64Raw,
          summary: analysis.summary,
          extractedData: analysis.entities
        };

        // Auto-create tasks for certain document types
        if (analysis.taskSuggestion && onTaskCreated) {
          const newTask: Task = {
            id: `doc-task-${Date.now()}`,
            title: analysis.taskSuggestion.title,
            description: analysis.taskSuggestion.description,
            priority: (analysis.taskSuggestion.priority as any) || 'NORMAL',
            status: 'PENDING',
            category: (analysis.taskSuggestion.category as any) || 'FINANCIAL'
          };

          onTaskCreated(newTask);
          setRecentlyCreatedTask(newTask.id);
          // Clear the notification after 3 seconds
          setTimeout(() => setRecentlyCreatedTask(null), 3000);
        }

        // Notify parent about new document scan
        if (onDocumentScan) {
          onDocumentScan(newDoc);
        }

        setDocuments(prev => [newDoc, ...prev]);
      } catch (err) {
        alert("Could not analyze document. Please try a clearer photo.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
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
      {recentlyCreatedTask && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">New task created!</p>
            <p className="text-xs text-green-600">Go to the Plan tab to see your new action item.</p>
          </div>
          <button
            onClick={() => setRecentlyCreatedTask(null)}
            className="text-green-600 hover:text-green-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-medium mb-2">Smart Vault</h2>
        <p className="text-slate-300 text-sm mb-6">
          Securely scan Wills, Insurance Policies, and IDs. AI will extract account numbers and beneficiaries.
        </p>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
        >
          {isAnalyzing ? (
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          ) : (
            <>
              <Camera className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-sm font-medium">Tap to Scan or Upload</span>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {documents.length > 0 && (
         <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {docTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === type 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
         </div>
      )}

      <div className="space-y-4">
        {filteredDocs.length === 0 && documents.length > 0 && (
           <p className="text-center text-slate-400 text-sm py-4">No documents found in this category.</p>
        )}
        
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 animate-fade-in-up">
            <div className="bg-blue-50 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-slate-800 truncate pr-2">{doc.type}</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded flex-shrink-0">Analyzed</span>
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{doc.summary}</p>
              
              {doc.extractedData && (
                <div className="mt-3 bg-slate-50 p-3 rounded text-xs space-y-1">
                  {doc.extractedData.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-slate-200 pb-1 last:border-0">
                      <span className="text-slate-500 truncate mr-2">{item.key}:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[50%]">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartVault;