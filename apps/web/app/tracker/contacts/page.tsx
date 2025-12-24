"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, User, Phone, Mail, MapPin } from "lucide-react";
import { trackerApi, ContactEntry } from "@/features/tracker/api/client";
import { useLanguage } from "../../contexts/LanguageContext";

import toast from "react-hot-toast";

export default function ContactsPage() {
    const [contacts, setContacts] = useState<ContactEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    const [name, setName] = useState("");
    const [role, setRole] = useState("Attorney");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await trackerApi.getContacts();
            setContacts(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const newContact = await trackerApi.addContact({
                name,
                role,
                email: email || undefined,
                phone: phone || undefined,
                address: address || undefined
            });
            setContacts([...contacts, newContact]);
            // Reset
            setName(""); setEmail(""); setPhone(""); setAddress("");
            toast.success("Contact saved successfully");
        } catch (e) {
            toast.error("Failed to save contact");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("tracker.contacts.title")}</h1>
                    <p className="text-gray-500">{t("tracker.contacts.subtitle")}</p>
                </div>

                {/* Add Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">{t("tracker.contacts.add")}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contact-name" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.contacts.name")}</label>
                            <input id="contact-name" name="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" required />
                        </div>
                        <div>
                            <label htmlFor="contact-role" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.contacts.role")}</label>
                            <select id="contact-role" name="role" value={role} onChange={e => setRole(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option>Attorney</option>
                                <option>Embassy / Consulate</option>
                                <option>Sponsor</option>
                                <option>Employer</option>
                                <option>Family Member</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="contact-email" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.contacts.email")}</label>
                            <input id="contact-email" name="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
                        </div>
                        <div>
                            <label htmlFor="contact-phone" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.contacts.phone")}</label>
                            <input id="contact-phone" name="phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="contact-address" className="block text-xs font-medium text-gray-500 mb-1">{t("tracker.contacts.address")}</label>
                            <input id="contact-address" name="address" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Legal Ave, Suite 100" />
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-2">
                            <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                <Save size={16} /> {t("tracker.contacts.save")}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Contacts List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <p className="text-gray-400 text-sm">Loading contacts...</p>
                    ) : contacts.length === 0 ? (
                        <div className="col-span-2 p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                            <User className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No contacts added yet.</p>
                        </div>
                    ) : (
                        contacts.map((contact, i) => (
                            <motion.div
                                key={contact.id || i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{contact.name}</h3>
                                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{contact.role}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                        <User size={16} />
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {contact.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            <a href={`mailto:${contact.email}`} className="hover:text-blue-600">{contact.email}</a>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{contact.phone}</span>
                                        </div>
                                    )}
                                    {contact.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-400" />
                                            <span className="truncate">{contact.address}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
