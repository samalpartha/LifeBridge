"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mock data for the PoC
const EMBASSIES = [
    { id: 1, name: "US Embassy", lat: 38.9072, lng: -77.0369, address: "Global Location A" },
    { id: 2, name: "Consulate of Canada", lat: 40.7128, lng: -74.0060, address: "Global Location B" },
    { id: 3, name: "UK High Commission", lat: 51.5074, lng: -0.1278, address: "Global Location C" },
];

export default function MapPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");

    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.push("/")}
                            className="btn btn-secondary text-sm"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Embassy Finder</h1>
                    </div>
                    <div className="text-sm text-gray-500">
                        Powered by Google Maps Platform
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                    <input
                        type="text"
                        placeholder="Search for an embassy or consulate..."
                        className="input flex-1"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn btn-primary">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                    </button>
                </div>

                {/* Map Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    {/* List View */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-700">Results</h2>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {EMBASSIES.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(embassy => (
                                <div key={embassy.id} className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group">
                                    <h3 className="font-medium text-gray-900 group-hover:text-blue-700">{embassy.name}</h3>
                                    <p className="text-sm text-gray-500">{embassy.address}</p>
                                    <div className="mt-2 flex items-center text-xs text-blue-600">
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        View on Map
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Visual */}
                    <div className="lg:col-span-2 bg-slate-100 rounded-xl border border-gray-200 flex items-center justify-center relative overflow-hidden group">
                        {/* Mock Map Background */}
                        <div className="absolute inset-0 bg-[url('https://maps.gstatic.com/mapfiles/api-3/images/map_error_1.png')] bg-cover opacity-50 grayscale transition-all group-hover:grayscale-0"></div>

                        <div className="relative text-center p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg max-w-md mx-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Google Maps Integration</h3>
                            <p className="text-gray-600 mb-6">
                                This is a placeholder for the Google Maps Embed API.
                                In the production version, this area will show an interactive map with pins for all the embassies listed on the left.
                            </p>
                            <button className="btn btn-primary w-full">
                                Enable Location Services
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
