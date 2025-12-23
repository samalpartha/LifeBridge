"use client";

import { useEffect, useState } from "react";
import { analyzeCase, getOutputs, uploadDocument, Outputs } from "../../api-client/client";
import { useParams, useRouter } from "next/navigation";

function Evidence({ outputs, ids }: { outputs: Outputs; ids: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const items = ids.map((id) => outputs.chunks[id]).filter(Boolean);
  
  if (!items.length) {
    return (
      <div className="text-sm text-gray-500 italic">
        No evidence available
      </div>
    );
  }
  
  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>View Evidence ({items.length} {items.length === 1 ? 'source' : 'sources'})</span>
      </button>
      
      {isOpen && (
        <div className="mt-3 space-y-2 animate-slide-down">
          {items.map((c, idx) => (
            <div key={c.id} className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-info text-xs">Chunk {c.idx + 1}</span>
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CasePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const caseId = params.id;

  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const o = await getOutputs(caseId);
      setOutputs(o);
    } catch (e: any) {
      setError(e.message || "Failed to load outputs");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    setUploadProgress("Uploading file...");
    try {
      await uploadDocument(caseId, file);
      setUploadProgress("Analyzing document...");
      await analyzeCase(caseId);
      setUploadProgress("Refreshing outputs...");
      await refresh();
      setUploadProgress(null);
    } catch (e: any) {
      setError(e.message || "Upload failed");
      setUploadProgress(null);
    } finally {
      setBusy(false);
    }
  }

  async function onAnalyze() {
    setBusy(true);
    setError(null);
    try {
      await analyzeCase(caseId);
      await refresh();
    } catch (e: any) {
      setError(e.message || "Analyze failed");
    } finally {
      setBusy(false);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-info';
      default: return 'badge-info';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      case 'todo': return 'badge-info';
      default: return 'badge-info';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.push("/")}
              className="btn btn-secondary text-sm"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {outputs?.case.title || "Loading..."}
            </h1>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span className="badge badge-info">{outputs?.case.scenario.replace('_', ' ')}</span>
            <span>ID: {caseId.substring(0, 8)}...</span>
          </div>
        </div>
        <button
          disabled={busy}
          onClick={onAnalyze}
          className="btn btn-primary"
        >
          {busy ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            <>🔄 Re-analyze</>
          )}
        </button>
      </div>

      {/* Upload Section */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
        </div>
        
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              busy ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-blue-400 bg-white hover:bg-blue-50 hover:border-blue-500'
            }`}
          >
            {uploadProgress ? (
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm font-medium text-blue-600">{uploadProgress}</p>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
              </>
            )}
          </label>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          💡 Upload PDFs or images. OCR will extract text automatically, then AI analyzes and generates insights.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-slide-down">
          <div className="flex">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {outputs && outputs.case.summary && (
        <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-purple-600 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700">{outputs.case.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Outputs Grid */}
      {outputs ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checklist */}
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Checklist</h2>
                <p className="text-sm text-gray-500">{outputs.checklist.length} items</p>
              </div>
            </div>
            <div className="space-y-3">
              {outputs.checklist.map((i) => (
                <div key={i.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{i.label}</h3>
                    <span className={`badge ${getStatusColor(i.status)} ml-2`}>
                      {i.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{i.notes}</p>
                  <Evidence outputs={outputs} ids={i.evidence_chunk_ids} />
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Timeline</h2>
                <p className="text-sm text-gray-500">{outputs.timeline.length} tasks</p>
              </div>
            </div>
            <div className="space-y-3">
              {outputs.timeline.map((i) => (
                <div key={i.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-1">{i.label}</h3>
                  {i.due_date && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Due: {i.due_date}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-2">{i.notes}</p>
                  <Evidence outputs={outputs} ids={i.evidence_chunk_ids} />
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Risks</h2>
                <p className="text-sm text-gray-500">{outputs.risks.length} identified</p>
              </div>
            </div>
            <div className="space-y-3">
              {outputs.risks.map((i) => (
                <div key={i.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{i.statement}</h3>
                    <span className={`badge ${getSeverityColor(i.severity)} ml-2`}>
                      {i.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{i.reason}</p>
                  <Evidence outputs={outputs} ids={i.evidence_chunk_ids} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading case outputs...</p>
        </div>
      )}
    </div>
  );
}
