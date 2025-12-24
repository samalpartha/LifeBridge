export const TRACKER_API_BASE = '/api/tracker';

export type TravelEntry = {
    id?: number;
    country: string;
    entry_date: string;
    exit_date?: string;
    purpose: string;
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
    }
};

export type DocumentEntry = {
    id?: number;
    filename: string;
    category: string;
    s3_key?: string;
    upload_date?: string;
};
