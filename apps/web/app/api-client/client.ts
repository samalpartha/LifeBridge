export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type CaseOut = {
  id: string;
  title: string;
  scenario: string;
  summary: string;
};

export type Outputs = {
  case: CaseOut;
  checklist: Array<{ id: string; label: string; status: string; notes: string; evidence_chunk_ids: string[] }>;
  timeline: Array<{ id: string; label: string; due_date: string; owner: string; notes: string; evidence_chunk_ids: string[] }>;
  risks: Array<{ id: string; category: string; severity: string; statement: string; reason: string; evidence_chunk_ids: string[] }>;
  chunks: Record<string, { id: string; document_id: string; idx: number; text: string }>;
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
