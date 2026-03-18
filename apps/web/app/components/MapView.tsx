"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Next.js
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface SafeHaven {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  address: string;
  services: string[];
  capacity_status: string;
  verification_tier: string;
}

interface MapViewProps {
  userLocation: { lat: number; lon: number };
  havens: SafeHaven[];
  selectedHaven: SafeHaven | null;
  onHavenClick: (haven: SafeHaven) => void;
}

const getHavenIcon = (type: string) => {
  const colors: { [key: string]: string } = {
    shelter: "#3b82f6", // blue
    hospital: "#ef4444", // red
    embassy: "#8b5cf6", // purple
    aid_station: "#10b981", // green
    water_point: "#06b6d4", // cyan
  };

  const color = colors[type] || "#6b7280"; // gray as default

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        ${getIconEmoji(type)}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const getIconEmoji = (type: string) => {
  const emojis: { [key: string]: string } = {
    shelter: "🏠",
    hospital: "🏥",
    embassy: "🏛️",
    aid_station: "📦",
    water_point: "💧",
  };
  return emojis[type] || "📍";
};

const userIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div style="
      background-color: #3b82f6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      animation: pulse 2s infinite;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHavenPopup(haven: SafeHaven): string {
  const typeLabel = escapeHtml(haven.type.replaceAll("_", " "));
  const nameLabel = escapeHtml(haven.name);
  const servicesLabel =
    haven.services.length > 0
      ? `<div style="margin: 8px 0;">
           <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">Services</div>
           <div style="font-size: 12px; color: #374151;">${escapeHtml(haven.services.slice(0, 3).join(", "))}</div>
         </div>`
      : "";

  return `
    <div style="min-width: 220px;">
      <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700;">${nameLabel}</h3>
      <p style="margin: 0 0 8px; font-size: 12px; color: #4b5563; text-transform: capitalize;">${typeLabel}</p>
      ${servicesLabel}
      <div style="display: flex; gap: 8px; font-size: 12px;">
        <span style="padding: 2px 8px; border-radius: 9999px; background: #f3f4f6; color: #111827;">
          ${escapeHtml(haven.verification_tier)}
        </span>
        <span style="padding: 2px 8px; border-radius: 9999px; background: #f3f4f6; color: #111827;">
          ${escapeHtml(haven.capacity_status)}
        </span>
      </div>
    </div>
  `;
}

type LeafletContainer = HTMLDivElement & { _leaflet_id?: number };

export default function MapView({ userLocation, havens, selectedHaven, onHavenClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const onHavenClickRef = useRef(onHavenClick);

  useEffect(() => {
    onHavenClickRef.current = onHavenClick;
  }, [onHavenClick]);

  useEffect(() => {
    const container = containerRef.current as LeafletContainer | null;
    if (!container || mapRef.current) {
      return;
    }

    // In React dev strict re-renders / fast refresh, stale ids can survive briefly.
    // Clearing this avoids Leaflet's "already initialized" guard on the same node.
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    const map = L.map(container, { zoomControl: true, attributionControl: true }).setView(
      [userLocation.lat, userLocation.lon],
      12
    );

    mapRef.current = map;
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    overlayLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      overlayLayerRef.current?.clearLayers();
      overlayLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
    };
  }, [userLocation.lat, userLocation.lon]);

  useEffect(() => {
    const map = mapRef.current;
    const overlayLayer = overlayLayerRef.current;
    if (!map || !overlayLayer) {
      return;
    }

    overlayLayer.clearLayers();

    const userPoint = L.latLng(userLocation.lat, userLocation.lon);
    L.marker(userPoint, { icon: userIcon })
      .bindPopup(
        '<div style="text-align:center;"><strong>Your Location</strong><br /><span style="font-size:12px;color:#4b5563;">Current position</span></div>'
      )
      .addTo(overlayLayer);

    L.circle(userPoint, {
      radius: 20000,
      fillColor: "blue",
      fillOpacity: 0.1,
      color: "blue",
      weight: 2,
    }).addTo(overlayLayer);

    let selectedMarker: L.Marker | null = null;

    for (const haven of havens) {
      const marker = L.marker([haven.lat, haven.lon], { icon: getHavenIcon(haven.type) })
        .bindPopup(buildHavenPopup(haven))
        .on("click", () => onHavenClickRef.current(haven))
        .addTo(overlayLayer);

      if (selectedHaven?.id === haven.id) {
        selectedMarker = marker;
      }
    }

    if (selectedMarker) {
      selectedMarker.openPopup();
    }
  }, [userLocation.lat, userLocation.lon, havens, selectedHaven]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (havens.length === 0) {
      map.setView([userLocation.lat, userLocation.lon], 12);
      return;
    }

    const points = [
      L.latLng(userLocation.lat, userLocation.lon),
      ...havens.map((haven) => L.latLng(haven.lat, haven.lon)),
    ];
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 13 });
  }, [userLocation.lat, userLocation.lon, havens]);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          }
        }
      `}</style>
    </div>
  );
}
