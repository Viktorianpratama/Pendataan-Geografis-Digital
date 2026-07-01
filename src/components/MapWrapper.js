"use client";

import dynamic from "next/dynamic";

// Memuat komponen Map secara dinamis hanya di client-side (karena Leaflet membutuhkan objek window)
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
      <p style={{ color: "#6b7280", fontWeight: "500" }}>Memuat Peta Satelit...</p>
    </div>
  )
});

export default function MapWrapper({ houses, onMapClick }) {
  return <Map houses={houses} onMapClick={onMapClick} />;
}
