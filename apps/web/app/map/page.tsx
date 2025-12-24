"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMBASSIES } from "../data/embassies";
import dynamic from "next/dynamic";
import { MapPin, Phone, Building2, Globe } from "lucide-react";

// Reuse the Google Map component
const AttorneyMap = dynamic(() => import("../components/AttorneyMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

export default function MapPage() {
    const router = useRouter();
    const [selectedCountry, setSelectedCountry] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const selectedEmbassy = EMBASSIES.find(e => e.country === selectedCountry);

    // Filter countries for dropdown/search
    const filteredEmbassies = EMBASSIES.filter(e =>
        e.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-fade-in flex flex-col">
            <div className="max-w-6xl w-full mx-auto space-y-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.push("/")}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Globe className="w-6 h-6 mr-2 text-blue-600" />
                            World Embassy Finder
                        </h1>
                    </div>
                    <div className="text-sm text-gray-500 hidden md:block">
                        Find your country's representation in the USA
                    </div>
                </div>

                {/* Selection Area */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select your Country of Citizenship</label>
                    <select
                        className="select select-bordered w-full text-lg"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                        <option value="" disabled>-- Choose a Country --</option>
                        {EMBASSIES.sort((a, b) => a.country.localeCompare(b.country)).map((e) => (
                            <option key={e.country} value={e.country}>{e.country}</option>
                        ))}
                    </select>
                </div>

                {/* Content Grid */}
                {selectedEmbassy ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                        {/* Details Card */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-6 h-fit">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedEmbassy.country}</h2>
                                <p className="text-blue-600 font-medium">Embassy in Washington, D.C.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <MapPin className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wide">Address</p>
                                        <p className="text-gray-900">{selectedEmbassy.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <Phone className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase font-bold tracking-wide">Phone Number</p>
                                        <p className="text-gray-900 text-lg font-mono">{selectedEmbassy.phone}</p>
                                        <p className="text-xs text-gray-400 mt-1">Tap to call</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button className="w-full btn btn-primary flex items-center justify-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Visit Official Website
                                </button>
                                <p className="text-xs text-gray-400 text-center mt-3">External link to embassy site</p>
                            </div>
                        </div>

                        {/* Map View */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-[500px] lg:h-auto">
                            <AttorneyMap
                                center={[selectedEmbassy.lat, selectedEmbassy.lng]}
                                attorneys={[{
                                    id: 1,
                                    name: `Embassy of ${selectedEmbassy.country}`,
                                    firm: "Diplomatic Mission",
                                    address: selectedEmbassy.address,
                                    location: [selectedEmbassy.lat, selectedEmbassy.lng]
                                }]}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-10 text-center opacity-75">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Globe className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Select a Country to Begin</h3>
                        <p className="text-gray-500 max-w-md mx-auto mt-2">
                            Choose your citizenship from the dropdown above to find the nearest embassy, contact details, and directions.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
