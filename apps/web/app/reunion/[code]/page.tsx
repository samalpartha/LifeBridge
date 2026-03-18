"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ReunionCodePage() {
  const params = useParams<{ code: string }>();
  const code = params?.code || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beacon, setBeacon] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      if (!code) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/crisis/beacons/${encodeURIComponent(code)}`);
        if (!response.ok) {
          throw new Error("Beacon not found");
        }
        setBeacon(await response.json());
      } catch (err: any) {
        setError(err.message || "Failed to load beacon");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [code]);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Family Reunification Beacon</h1>
      <p className="text-gray-600 mb-6">
        Reunion code: <code className="px-2 py-1 bg-gray-100 rounded">{code}</code>
      </p>

      {loading ? (
        <div className="rounded border p-4 text-gray-600">Loading beacon...</div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <div className="rounded border p-4 space-y-2">
          <p><strong>Status:</strong> {beacon.status}</p>
          <p><strong>Family hint:</strong> {beacon.family_name_hint}</p>
          <p><strong>Location:</strong> {beacon.lat}, {beacon.lon}</p>
          <p><strong>Message:</strong> {beacon.message || "No message provided"}</p>
          <p><strong>Last updated:</strong> {new Date(beacon.last_updated).toLocaleString()}</p>
        </div>
      )}

      <div className="mt-6">
        <Link href="/crisis" className="text-blue-600 hover:underline">
          Back to Crisis Console
        </Link>
      </div>
    </div>
  );
}
