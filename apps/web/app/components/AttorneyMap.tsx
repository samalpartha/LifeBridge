"use client";

import { useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

interface Attorney {
    id: string;
    name: string;
    firm?: string;
    practice_area?: string;
    address?: string;
    location?: [number, number]; // [lat, lng]
}

interface AttorneyMapProps {
    attorneys: Attorney[];
    center: [number, number];
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

export default function AttorneyMap({ attorneys, center }: AttorneyMapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "AIzaSyAeIkVVwjJKnJ2hqdwblcqdFArQOLMlw9w"
    });

    const mapCenter = useMemo(() => ({
        lat: center[0],
        lng: center[1]
    }), [center]);

    // Convert attorney locations to Google Maps format
    const markers = useMemo(() => attorneys.map(a => ({
        id: a.id,
        position: a.location ? { lat: a.location[0], lng: a.location[1] } : null,
        title: a.name
    })).filter(m => m.position), [attorneys]);

    if (!isLoaded) return <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center animate-pulse">Loading Google Maps...</div>;

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0 relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={13}
            >
                {markers.map(marker => (
                    marker.position && <Marker key={marker.id} position={marker.position} title={marker.title} />
                ))}
            </GoogleMap>
        </div>
    );
}
