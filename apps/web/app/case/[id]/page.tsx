"use client";

import { useEffect, useState } from "react";
import { analyzeCase, getOutputs, uploadDocument, updateCaseStory, getStatistics, getCaseDocuments, updateChecklistStatus, updateTimelineStatus, Outputs, DocumentOut } from "../../api-client/client";
import { useParams, useRouter } from "next/navigation";
import { VoiceRecorder } from "../../components/VoiceRecorder";
import { useLanguage } from "../../contexts/LanguageContext";

function AudioPlayer({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (!text) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={speak}
      className={`btn btn-sm ${speaking ? 'btn-error' : 'btn-primary'} ml-auto`}
    >
      {speaking ? (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Stop
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Listen to Plan
        </>
      )}
    </button>
  );
}

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
                <span className="badge badge-info text-xs font-semibold">Source: {c.filename}</span>
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
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const [story, setStory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { language, translateDynamic, t } = useLanguage();
  const [translatedOutputs, setTranslatedOutputs] = useState<Outputs | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [stats, setStats] = useState<any>(null);

  async function refresh() {
    setError(null);
    try {
      const [o, s, d] = await Promise.all([
        getOutputs(caseId),
        getStatistics(caseId),
        getCaseDocuments(caseId)
      ]);
      setOutputs(o);
      setStats(s);
      setDocuments(d);
    } catch (e: any) {
      setError(e.message || "Failed to load outputs");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  useEffect(() => {
    if (outputs?.case.user_story) {
      setStory(outputs.case.user_story);
    }
  }, [outputs]);

  useEffect(() => {
    const translateContent = async () => {
      if (!outputs || language === 'en') {
        setTranslatedOutputs(null);
        return;
      }

      setIsTranslating(true);
      try {
        // Deep copy to avoid mutating original
        const newOutputs = JSON.parse(JSON.stringify(outputs));

        // Translate Summary
        if (newOutputs.case.summary) {
          newOutputs.case.summary = await translateDynamic(newOutputs.case.summary);
        }

        // Translate Checklist
        await Promise.all(newOutputs.checklist.map(async (item: any) => {
          item.label = await translateDynamic(item.label);
          if (item.notes) item.notes = await translateDynamic(item.notes);
        }));

        // Translate Risks
        await Promise.all(newOutputs.risks.map(async (item: any) => {
          item.statement = await translateDynamic(item.statement);
          if (item.reason) item.reason = await translateDynamic(item.reason);
        }));

        // Translate Timeline
        await Promise.all(newOutputs.timeline.map(async (item: any) => {
          item.label = await translateDynamic(item.label);
          if (item.notes) item.notes = await translateDynamic(item.notes);
        }));

        setTranslatedOutputs(newOutputs);
      } catch (e) {
        console.error("Translation failed", e);
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [outputs, language, translateDynamic]);

  const displayOutputs = translatedOutputs || outputs;

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

  const saveStory = async (newStory: string) => {
    setStory(newStory);
    setIsSaving(true);
    try {
      await updateCaseStory(caseId, newStory);
    } catch (e) {
      console.error("Failed to save story", e);
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="flex items-center space-x-3 mb-1">
            <button
              onClick={() => router.push("/")}
              className="btn btn-ghost btn-sm text-gray-500 hover:bg-gray-100"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-2">
              <span className="badge badge-secondary badge-outline text-xs uppercase tracking-wider font-semibold">
                {outputs ? "Analysis Complete" : "Draft Case"}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500 flex items-center" title="Your data is secure">
                <svg className="w-3 h-3 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Encrypted & Local
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {outputs?.case.title || "Loading Case..."}
          </h1>

          <div className="flex items-center space-x-3 mt-2 text-sm text-gray-600">
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium uppercase">
              {displayOutputs?.case.scenario.replace('_', ' ')} Scenario
            </span>
            {stats && (
              <>
                <span className="text-gray-300">•</span>
                <span>{stats.documents} Documents</span>
              </>
            )}
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
            <>{t("case.reanalyze")}</>
          )}
        </button>
      </div>

      {/* Story Section */}
      <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t("case.tellStory")}</h2>
          {isSaving && <span className="ml-3 text-xs text-indigo-600 animate-pulse">Saving...</span>}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Share your situation in your own words. You can type or use your voice. This helps us understand your context better.
        </p>

        <VoiceRecorder
          initialText={story}
          onTranscriptChange={(text) => saveStory(text)}
        />
      </div>

      {/* Upload Section */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t("case.uploadDoc")}</h2>
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
            onClick={(e) => { (e.target as any).value = null; }}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${busy ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-blue-400 bg-white hover:bg-blue-50 hover:border-blue-500'
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

        {documents.length > 0 && (
          <div className="mt-4 border-t border-blue-100 pt-4 animate-slide-down">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Files ({documents.length})</h3>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between text-sm text-gray-600 bg-white p-3 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center overflow-hidden">
                    <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate font-medium">{doc.filename}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                    {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Manual Analyze Action */}
      <div className="flex justify-center animate-fade-in">
        <button
          disabled={busy}
          onClick={onAnalyze}
          className="btn btn-primary btn-lg shadow-xl w-full md:w-auto transform hover:scale-105 transition-all"
        >
          {busy ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Plan...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Analyze Case
            </span>
          )}
        </button>
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
      {displayOutputs && displayOutputs.case.summary && (
        <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-purple-600 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{t("case.summary")}</h3>
              <p className="text-gray-700">{displayOutputs.case.summary}</p>
            </div>
            <div className="ml-auto pl-4">
              <AudioPlayer text={displayOutputs.case.summary} />
            </div>
          </div>
        </div>
      )}

      {/* Outputs Grid */}
      {displayOutputs ? (
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
                <h2 className="text-xl font-bold text-gray-900">{t("case.checklist")}</h2>
                {isTranslating && <span className="text-xs text-blue-500 ml-2">Translating...</span>}
                <p className="text-sm text-gray-500">{displayOutputs.checklist.length} items</p>
              </div>
            </div>
            <div className="space-y-3">
              {displayOutputs.checklist.map((i) => (
                <div key={i.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center flex-1 mr-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={i.status === 'done'}
                          onChange={async () => {
                            const newStatus = i.status === 'done' ? 'todo' : 'done';
                            // Optimistic update
                            if (outputs) {
                              const newOutputs = { ...outputs };
                              const item = newOutputs.checklist.find(c => c.id === i.id);
                              if (item) item.status = newStatus;
                              setOutputs(newOutputs);
                            }
                            try {
                              await updateChecklistStatus(i.id, newStatus);
                            } catch (e) {
                              console.error("Status update failed", e);
                              refresh(); // Revert on failure
                            }
                          }}
                          className="checkbox checkbox-primary mr-3 checkbox-sm"
                        />
                        <h3 className={`font-semibold cursor-pointer select-none ${i.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {i.label}
                        </h3>
                      </label>
                    </div>
                    <span className={`badge ${getStatusColor(i.status)} ml-2`}>
                      {i.status === 'done' ? 'Verified' : i.status}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 ${i.status === 'done' ? 'text-gray-400' : 'text-gray-600'}`}>{i.notes}</p>
                  <Evidence outputs={displayOutputs} ids={i.evidence_chunk_ids} />
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
                <h2 className="text-xl font-bold text-gray-900">{t("case.timeline")}</h2>
                <p className="text-sm text-gray-500">{displayOutputs.timeline.length} tasks</p>
              </div>
            </div>
            <div className="space-y-3">
              {displayOutputs.timeline.map((i) => (
                <div key={i.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center flex-1 mr-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={i.status === 'done'}
                          onChange={async () => {
                            const newStatus = i.status === 'done' ? 'todo' : 'done';
                            if (outputs) {
                              const newOutputs = { ...outputs };
                              const item = newOutputs.timeline.find(t => t.id === i.id);
                              if (item) item.status = newStatus;
                              setOutputs(newOutputs);
                            }
                            try {
                              await updateTimelineStatus(i.id, newStatus);
                            } catch (e) {
                              console.error("Timeline status update failed", e);
                              refresh();
                            }
                          }}
                          className="checkbox checkbox-primary mr-3 checkbox-sm"
                        />
                        <h3 className={`font-semibold cursor-pointer select-none ${i.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{i.label}</h3>
                      </label>
                    </div>
                    {i.status === 'done' && (
                      <span className="badge badge-success badge-outline ml-2">Verified</span>
                    )}
                  </div>
                  {i.due_date && (
                    <div className="flex items-center text-sm text-gray-600 mb-2 ml-9">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Due: {i.due_date}
                    </div>
                  )}
                  <p className={`text-sm mb-2 ml-9 ${i.status === 'done' ? 'text-gray-400' : 'text-gray-600'}`}>{i.notes}</p>
                  <div className="ml-9">
                    <Evidence outputs={displayOutputs} ids={i.evidence_chunk_ids} />
                  </div>
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
                <h2 className="text-xl font-bold text-gray-900">{t("case.risks")}</h2>
                <p className="text-sm text-gray-500">{displayOutputs.risks.length} identified</p>
              </div>
            </div>
            <div className="space-y-3">
              {displayOutputs.risks.map((i) => (
                <div key={i.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{i.statement}</h3>
                    <div className="flex flex-col items-end ml-4">
                      <span className={`badge ${getSeverityColor(i.severity)} mb-1 capitalize`}>
                        {i.severity} Risk
                      </span>
                      {/* Visual Risk Score Simulation */}
                      <div className="flex items-center space-x-2" title="Estimated impact score">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${i.severity.toLowerCase() === 'high' ? 'bg-red-500' : i.severity.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-blue-400'}`}
                            style={{ width: i.severity.toLowerCase() === 'high' ? '85%' : i.severity.toLowerCase() === 'medium' ? '50%' : '20%' }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                          {i.severity.toLowerCase() === 'high' ? '85/100' : i.severity.toLowerCase() === 'medium' ? '50/100' : '20/100'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{i.reason}</p>
                  <Evidence outputs={displayOutputs} ids={i.evidence_chunk_ids} />
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
          <div className="space-y-2">
            <p className="text-gray-900 font-medium text-lg">Analyzing your case...</p>
            <p className="text-gray-500 text-sm">Extracting evidence, identifying risks, and building your timeline.</p>
          </div>
        </div>
      )}
    </div>
  );
}
