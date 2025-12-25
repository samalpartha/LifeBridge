export const API_BASE = "/api";

export type CaseOut = {
  id: string;
  title: string;
  scenario: string;
  summary: string;
  user_story?: string;
};

export type Outputs = {
  case: CaseOut;
  checklist: Array<{ id: string; label: string; status: string; notes: string; evidence_chunk_ids: string[] }>;
  timeline: Array<{ id: string; label: string; status: string; due_date: string; owner: string; notes: string; evidence_chunk_ids: string[] }>;
  risks: Array<{ id: string; category: string; severity: string; statement: string; reason: string; evidence_chunk_ids: string[] }>;
  chunks: Record<string, { id: string; document_id: string; filename: string; idx: number; text: string }>;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function createCase(title: string, scenario: string): Promise<CaseOut> {
  return api<CaseOut>("/cases", {
    method: "POST",
    body: JSON.stringify({ title, scenario })
  });
}

export async function createDemoPreset(): Promise<{ case_id: string }> {
  return api<{ case_id: string }>("/demo/preset", { method: "POST", body: JSON.stringify({}) });
}

export async function analyzeCase(caseId: string): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/cases/${caseId}/analyze`, { method: "POST", body: JSON.stringify({}) });
}

export async function getOutputs(caseId: string): Promise<Outputs> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/outputs`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load outputs: ${res.status}`);
  return (await res.json()) as Outputs;
}

export async function uploadDocument(caseId: string, file: File): Promise<{ document_id: string; chunks: number }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/cases/${caseId}/documents`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return (await res.json()) as { document_id: string; chunks: number };
}

export interface DocumentOut {
  id: string;
  case_id: string;
  filename: string;
  content_type: string;
  created_at: string;
}

export async function getDocuments(): Promise<DocumentOut[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function getCaseDocuments(caseId: string): Promise<DocumentOut[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/documents`);
  if (!res.ok) throw new Error("Failed to fetch case documents");
  return res.json();
}

export async function updateChecklistStatus(itemId: string, status: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE}/checklist/${itemId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}

export async function updateTimelineStatus(itemId: string, status: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE}/timeline/${itemId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}

export async function updateCaseStory(caseId: string, story: string): Promise<CaseOut> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/story`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_story: story }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update story");
  }
  return res.json();
}

export async function getCases(): Promise<CaseOut[]> {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function deleteCase(caseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cases/${caseId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete case");
}

export async function getStatistics(caseId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/statistics`);
  if (!res.ok) throw new Error("Failed to fetch statistics");
  return res.json();
}
