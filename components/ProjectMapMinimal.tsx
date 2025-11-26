// components/ProjectMapMinimal.tsx
'use client';
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function ProjectMapMinimal() {
  return (
    <div style={{ height: '56vh' }} className="w-full rounded-md overflow-hidden">
      <MapContainer center={[9.145, 40.489]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
      </MapContainer>
    </div>
  );
}
