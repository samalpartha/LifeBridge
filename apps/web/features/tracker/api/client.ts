export const TRACKER_API_BASE = '/api/tracker';

export type TravelEntry = {
    id?: number;
    country: string;
    entry_date: string;
    exit_date?: string;
    purpose: string;
    port_of_entry?: string;
    class_of_admission?: string;
};

export type EmploymentEntry = {
    id?: number;
    employer: string;
    title: string;
    start_date: string;
    end_date?: string;
    city: string;
    state: string;
};

export type ResidenceEntry = {
    id?: number;
    address: string;
    city: string;
    country: string;
    start_date: string;
    end_date?: string;
};

export type ContactEntry = {
    id?: number;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    address?: string;
};

export type NoteEntry = {
    id?: number;
    title: string;
    content: string;
    note_date: string;
    linked_entity_id?: string;
};

export const trackerApi = {
    // ... existing history methods ...
    getTravelHistory: async (): Promise<TravelEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/history/travel`);
        if (!res.ok) throw new Error('Failed to fetch travel history');
        return res.json();
    },

    addTravelEntry: async (entry: TravelEntry): Promise<TravelEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/history/travel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add travel entry');
        return res.json();
    },

    // ... we assume employment and residence are here ...
    getEmploymentHistory: async (): Promise<EmploymentEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/history/employment`);
        if (!res.ok) throw new Error('Failed to fetch employment history');
        return res.json();
    },

    addEmploymentEntry: async (entry: EmploymentEntry): Promise<EmploymentEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/history/employment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add employment entry');
        return res.json();
    },

    getResidenceHistory: async (): Promise<ResidenceEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/history/residence`);
        if (!res.ok) throw new Error('Failed to fetch residence history');
        return res.json();
    },

    addResidenceEntry: async (entry: ResidenceEntry): Promise<ResidenceEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/history/residence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add residence entry');
        return res.json();
    },

    // Documents
    getDocuments: async (): Promise<DocumentEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/documents`);
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
    },

    addDocument: async (entry: DocumentEntry): Promise<DocumentEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add document');
        return res.json();
    },

    // Contacts
    getContacts: async (): Promise<ContactEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/contacts`);
        if (!res.ok) throw new Error('Failed to fetch contacts');
        return res.json();
    },

    addContact: async (entry: ContactEntry): Promise<ContactEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add contact');
        return res.json();
    },

    // Notes
    getNotes: async (): Promise<NoteEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/notes`);
        if (!res.ok) throw new Error('Failed to fetch notes');
        return res.json();
    },

    addNote: async (entry: NoteEntry): Promise<NoteEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add note');
        return res.json();
    },

    // Cases
    getCases: async (): Promise<CaseEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases`);
        if (!res.ok) throw new Error('Failed to fetch cases');
        return res.json();
    },

    getCase: async (id: number): Promise<CaseEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases/${id}`);
        if (!res.ok) throw new Error('Failed to fetch case');
        return res.json();
    },

    addCase: async (entry: CaseEntry): Promise<CaseEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add case');
        return res.json();
    },

    updateCase: async (id: number, entry: CaseEntry): Promise<CaseEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to update case');
        return res.json();
    },

    deleteCase: async (id: number): Promise<void> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete case');
    },

    getCaseEvents: async (caseId: number): Promise<CaseEventEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases/${caseId}/events`);
        if (!res.ok) throw new Error('Failed to fetch case events');
        return res.json();
    },

    addCaseEvent: async (caseId: number, entry: CaseEventEntry): Promise<CaseEventEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases/${caseId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add case event');
        return res.json();
    },

    checkCaseStatus: async (caseId: number): Promise<any> => {
        const res = await fetch(`${TRACKER_API_BASE}/cases/${caseId}/status`, {
            method: 'POST',
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to check status');
        }
        return res.json();
    },

    // Tasks
    getTasks: async (): Promise<TaskEntry[]> => {
        const res = await fetch(`${TRACKER_API_BASE}/tasks`);
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
    },

    addTask: async (entry: TaskEntry): Promise<TaskEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to add task');
        return res.json();
    },

    updateTask: async (id: number, entry: TaskEntry): Promise<TaskEntry> => {
        const res = await fetch(`${TRACKER_API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });
        if (!res.ok) throw new Error('Failed to update task');
        return res.json();
    },

    deleteTask: async (id: number): Promise<void> => {
        const res = await fetch(`${TRACKER_API_BASE}/tasks/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete task');
    }
};

export type DocumentEntry = {
    id?: number;
    filename: string;
    category: string;
    s3_key?: string;
    upload_date?: string;
    case_id?: number | null;
};

export type TaskEntry = {
    id?: number;
    title: string;
    description?: string;
    due_date?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    created_at?: string;
    case_id?: number | null;
};

export type CaseEntry = {
    id?: number;
    title: string;
    case_type: string;
    status: string;
    filing_date?: string;
    priority_date?: string;
    receipt_number?: string;
};

export type CaseEventEntry = {
    id?: number;
    case_id?: number;
    event_date: string;
    title: string;
    description?: string;
    event_type: string;
};
