"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, StickyNote, Calendar } from "lucide-react";
import { trackerApi, NoteEntry } from "@/features/tracker/api/client";
import { useLanguage } from "../../contexts/LanguageContext";

import toast from "react-hot-toast";

export default function NotesPage() {
    const [notes, setNotes] = useState<NoteEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [noteDate, setNoteDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Default date to today
            setNoteDate(new Date().toISOString().split('T')[0]);

            const data = await trackerApi.getNotes();
            // Sort by date desc
            setNotes(data.sort((a, b) => new Date(b.note_date).getTime() - new Date(a.note_date).getTime()));
        } catch (e) {
            console.error(e);
            toast.error("Failed to load notes");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const newNote = await trackerApi.addNote({
                title,
                content,
                note_date: noteDate
            });
            setNotes([newNote, ...notes]);
            setTitle(""); setContent("");
            toast.success("Note saved successfully");
        } catch (e) {
            toast.error("Failed to save note");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("tracker.notes.title")}</h1>
                    <p className="text-gray-500">{t("tracker.notes.subtitle")}</p>
                </div>

                {/* Add Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="note-title" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.notes.titleField")}</label>
                                <input id="note-title" name="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Meeting with Attorney" required />
                            </div>
                            <div className="w-48">
                                <label htmlFor="note-date" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.notes.date")}</label>
                                <input id="note-date" name="date" type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="note-content" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.notes.content")}</label>
                            <textarea
                                id="note-content"
                                name="content"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={3}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Discussed I-140 filing strategy..."
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                <Save size={16} /> {t("tracker.notes.save")}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-gray-400 text-sm">Loading notes...</p>
                    ) : notes.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                            <StickyNote className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No notes created yet.</p>
                        </div>
                    ) : (
                        notes.map((note, i) => (
                            <motion.div
                                key={note.id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-yellow-50/50 p-6 rounded-xl border border-yellow-100 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <StickyNote size={64} className="text-yellow-600" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 text-lg">{note.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                            <Calendar size={12} />
                                            {note.note_date}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
