"use client";

import { useState } from "react";
import { Search, MapPin, Phone, Mail, Globe, Star, Gavel, X } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Map to avoid SSR issues
const AttorneyMap = dynamic(() => import("../components/AttorneyMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

interface Attorney {
    id: string;
    name: string;
    firm: string;
    practice_area: string;
    rating: number;
    reviews: number;
    location_text: string;
    image: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    bio?: string;
    location?: [number, number];
    confidence_score?: number;
}

// Zippopotam.us Integration
interface ZipLocation {
    city: string;
    state: string;
    lat: number;
    lng: number;
}

async function fetchZipLocation(zip: string): Promise<ZipLocation | null> {
    try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!res.ok) return null;
        const data = await res.json();
        const place = data.places[0];
        return {
            city: place["place name"],
            state: place["state abbreviation"],
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude)
        };
    } catch (e) {
        console.error("Zippopotam.us error:", e);
        return null;
    }
}

export default function AttorneysPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [zipcode, setZipcode] = useState("");
    const [attorneys, setAttorneys] = useState<Attorney[]>([]);
    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // US Center
    const [selectedAttorney, setSelectedAttorney] = useState<Attorney | null>(null);

    const fetchAttorneys = async () => {
        if (!zipcode && !searchQuery) return;
        setLoading(true);

        try {
            // 1. Get Location from Zip (Client-side for Map Coordinates)
            let locationData: ZipLocation | null = null;
            if (zipcode) {
                locationData = await fetchZipLocation(zipcode);
            }

            // 2. Fetch from Backend (Compliance & Data)
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
            const params = new URLSearchParams();
            if (zipcode) params.append("zip", zipcode);
            if (searchQuery) params.append("query", searchQuery);

            const response = await fetch(`${API_BASE}/attorneys/search?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Failed to search attorneys");
            }

            const data = await response.json();
            const results = data.results || [];

            // 3. Transform Data
            const mappedAttorneys: Attorney[] = results.map((record: any) => ({
                id: record.id,
                name: record.name,
                firm: record.firm || "Private Practice",
                practice_area: record.practice_area || ("Immigration Law"),
                rating: record.rating || 4.5,
                reviews: record.reviews || 0,
                location_text: record.location_text || (locationData ? `${locationData.city}, ${locationData.state}` : "United States"),
                image: record.image || `https://api.dicebear.com/7.x/initials/svg?seed=${record.name}`,
                email: record.email || "contact@legal-network.example.com",
                phone: record.phone || "+1 (555) 012-3456",
                website: record.website || "#",
                address: record.address || record.location_text,
                bio: record.bio || "Experienced legal professional.",
                location: locationData ? [
                    locationData.lat + (Math.random() * 0.02 - 0.01),
                    locationData.lng + (Math.random() * 0.02 - 0.01)
                ] : undefined,
                confidence_score: record.confidence_score
            }));

            setAttorneys(mappedAttorneys);
            if (locationData) {
                setMapCenter([locationData.lat, locationData.lng]);
                setShowMap(true);
            }

        } catch (error) {
            console.error("Failed to fetch attorneys:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
                        <Gavel className="w-6 h-6" />
                        <span>LegalConnect</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Verified Professional Directory
                    </div>
                </div>
            </div>

            <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
                {/* Left Panel: Search & List */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">

                    {/* Search Box */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900">Find an Attorney</h1>
                        <p className="text-gray-500 text-sm">Use AI to find verified immigration experts near you.</p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter ZIP Code (e.g. 10001)"
                                        className="w-full pl-10 h-11 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={zipcode}
                                        onChange={(e) => setZipcode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">Name or Firm (Optional)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="e.g. 'Smith Law' or 'John Doe'"
                                        className="w-full pl-10 h-11 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={fetchAttorneys}
                                disabled={loading || (!zipcode && !searchQuery)}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Searching..." : "Search Attorneys"}
                            </button>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="flex-1 overflow-y-auto space-y-4 min-h-[400px]">
                        {attorneys.length === 0 && !loading && (
                            <div className="text-center py-12 text-gray-400">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Enter a ZIP code or Name to start searching</p>
                            </div>
                        )}

                        {attorneys.map((attorney) => (
                            <div
                                key={attorney.id}
                                onClick={() => setSelectedAttorney(attorney)}
                                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex gap-4">
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img src={attorney.image} alt={attorney.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                            {attorney.name}
                                        </h3>
                                        <p className="text-sm text-indigo-600 font-medium truncate">{attorney.firm}</p>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">{attorney.location_text}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-xs font-medium text-yellow-700">
                                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                {attorney.rating.toFixed(1)}
                                            </div>
                                            <span className="text-xs text-gray-400">{attorney.reviews} reviews</span>
                                            {attorney.confidence_score && (
                                                <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100">
                                                    {(attorney.confidence_score * 100).toFixed(0)}% Match
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="hidden lg:block w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24 h-[calc(100vh-8rem)]">
                    {showMap ? (
                        <div className="w-full h-full">
                            <AttorneyMap attorneys={attorneys} center={mapCenter} />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 flex-col gap-4">
                            <MapPin className="w-16 h-16 opacity-20" />
                            <p>Map view will update when you search</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Disclaimer */}
            <div className="bg-gray-50 border-t py-4 text-center text-xs text-gray-400">
                Information sourced from public records and AI generation. Always verify credentials independently.
            </div>

            {/* Contact Details Modal */}
            {selectedAttorney && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
                            <button
                                onClick={() => setSelectedAttorney(null)}
                                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 pb-6 -mt-12 relative">
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden mb-4">
                                <img src={selectedAttorney.image} alt={selectedAttorney.name} className="w-full h-full object-cover" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900">{selectedAttorney.name}</h2>
                            <p className="text-indigo-600 font-medium mb-4">{selectedAttorney.firm}</p>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 leading-relaxed italic">
                                    "{selectedAttorney.bio}"
                                </p>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h4>

                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{selectedAttorney.phone}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{selectedAttorney.email}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <a href={selectedAttorney.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline truncate">
                                            {selectedAttorney.website}
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{selectedAttorney.address}</span>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 mt-2">
                                    Contact Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
