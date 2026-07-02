"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker, useMap, LayersControl, ZoomControl } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Compass from "./Compass";

// Fix default marker icon issue and use custom icon.svg
const DefaultIcon = L.icon({
  iconUrl: "/icon.svg",
  iconRetinaUrl: "/icon.svg",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    }
  });
  return null;
}

function CompassControl({ currentPosition }) {
  const map = useMap();
  const handleCompassClick = () => {
    if (currentPosition) {
      map.flyTo(currentPosition, 17, { animate: true, duration: 1.5 });
    } else {
      map.locate({ setView: true, maxZoom: 17 });
    }
  };
  return <Compass onClick={handleCompassClick} />;
}

function AutoCenter({ currentPosition }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (currentPosition && !hasCentered.current) {
      map.flyTo(currentPosition, 17, { animate: true, duration: 1.5 });
      hasCentered.current = true;
    }
  }, [currentPosition, map]);

  return null;
}

export default function Map({ houses = [], onMapClick, center = [-0.8615, 134.0622], zoom = 15 }) {
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    let watchId;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Gagal melacak lokasi", err);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      <ZoomControl position="bottomright" />
      <LayersControl position="bottomleft">
        {/* Google Maps Satellite Hybrid (Terkadang Paling Baru) */}
        <LayersControl.BaseLayer checked name="Google Satellite">
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution='&copy; Google'
            maxZoom={21}
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>

        {/* ESRI World Imagery Satellite Map - Sangat cepat dan detail */}
        <LayersControl.BaseLayer name="Peta Satelit (ESRI)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            maxZoom={21}
            maxNativeZoom={17}
          />
        </LayersControl.BaseLayer>
        
        {/* OpenStreetMap Standar */}
        <LayersControl.BaseLayer name="Peta Jalan (Standar)">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={20}
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
        
        {/* OpenStreetMap Topografi */}
        <LayersControl.BaseLayer name="Peta Topografi">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            maxZoom={20}
            maxNativeZoom={17}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      <CompassControl currentPosition={currentPosition} />
      <MapEvents onMapClick={onMapClick} />
      <AutoCenter currentPosition={currentPosition} />
      
      {currentPosition && (
        <CircleMarker 
          center={currentPosition} 
          radius={8}
          pathOptions={{ color: '#ffffff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
        >
          <Popup>Lokasi Anda Saat Ini</Popup>
        </CircleMarker>
      )}

      {houses.map((house) => (
        <Marker key={house.id} position={[house.latitude, house.longitude]}>
          <Popup>
            <div style={{ padding: "4px" }}>
              <h3 style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "14px" }}>{house.nama_kepala_keluarga}</h3>
              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#555" }}>{house.alamat}</p>
              <p style={{ margin: 0, fontSize: "12px" }}>Anggota: {house.jumlah_anggota}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
