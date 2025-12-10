// components/ProjectMap.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths for bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icons - only run once
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl.src || iconRetinaUrl,
    iconUrl: iconUrl.src || iconUrl,
    shadowUrl: shadowUrl.src || shadowUrl,
  });
}

// --- Predefined SVG strings for each icon type ---
const dropletsSVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`;

const windSVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`;

const mapSVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-3.659-1.83a1 1 0 0 0-.894 0l-3.659 1.83a2 2 0 0 1-1.788 0l-4.553-2.277A1 1 0 0 1 1 17.383V4.619a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l3.659 1.83a1 1 0 0 0 .894 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>`;

// --- Custom divIcons using predefined SVG strings ---
function createCategoryIcon(svgString: string, backgroundColor: string) {
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        background-color: ${backgroundColor};
        border: 1px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <div style="color: white; display: flex; align-items: center; justify-content: center;">
          ${svgString}
        </div>
      </div>
    `,
    className: 'category-icon-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

// Create icons with different colors for each category
const hydrologyIcon = createCategoryIcon(dropletsSVG, '#0284C7'); // blue
const airNoiseIcon = createCategoryIcon(windSVG, '#059669'); // green
const gisIcon = createCategoryIcon(mapSVG, '#F59E0B'); // orange

/** Helper: match categories to appropriate icons */
function getIconForCategory(category?: string) {
  if (!category) return gisIcon;
  const key = String(category).toLowerCase();
  
  if (key.includes('hydro')) return hydrologyIcon;
  if (key.includes('air') || key.includes('noise') || key.includes('air quality')) return airNoiseIcon;
  if (key.includes('gis') || key.includes('remote') || key.includes('map')) return gisIcon;
  
  return gisIcon;
}

// Create a custom legend control
const MapLegend = () => {
  const map = useMap();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const legend = new L.Control({ position: 'topright' });
    
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend-control');
      div.innerHTML = `
        <div style="
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 1px solid #ccc;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          min-width: 160px;
        ">
          <div style="font-weight: 700; margin-bottom: 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px;">
            Project Types
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #0284C7; border: 1px solid white;"></div>
              <span>Hydrology</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #059669; border: 1px solid white;"></div>
              <span>Air Quality & Noise</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #F59E0B; border: 1px solid white;"></div>
              <span>GIS & Remote Sensing</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 20px; height: 3px; background: linear-gradient(90deg, #DC2626 50%, transparent 50%); background-size: 8px 3px;"></div>
              <span>Transmission Lines</span>
            </div>
          </div>
        </div>
      `;
      return div;
    };

    legend.addTo(map);

    return () => {
      map.removeControl(legend);
    };
  }, [map]);

  return null;
};

export interface Project {
  id: string;
  title: string;
  description?: string;
  year?: number;
  image?: string;
  imageThumb?: string;
  imageThumbSm?: string;
  lat: number;
  lng: number;
  category?: string;
  category2?: string;
  tags?: string[];
  impact?: string;
  link?: string;
  path?: [number, number][];
}

interface ProjectMapProps {
  projects: Project[];
  height?: number | string;
  centerProjectId?: string | null;
}

/** Main exported component */
export default function ProjectMap({ projects = [], height = '76vh', centerProjectId = null }: ProjectMapProps) {
  const defaultCenter: [number, number] = [9.245, 40.489]; // Ethiopia center
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client before rendering map
  useEffect(() => {
    setIsClient(true);
  }, []);

  // categories derived from projects
  const categories = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.category && s.add(p.category));
    return ['All', ...Array.from(s)];
  }, [projects]);

  const visibleProjects = useMemo(() => {
    if (activeCategory === 'All') return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  };

  // Filter out projects without coordinates
  const validProjects = useMemo(() => 
    projects.filter(p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng)),
    [projects]
  );

  // Separate point projects and transmission line projects
  const pointProjects = useMemo(() => 
    visibleProjects.filter(p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng)),
    [visibleProjects]
  );

  const transmissionLineProjects = useMemo(() => 
    visibleProjects.filter(p => 
      p.category === 'GIS & Remote Sensing' && 
      Array.isArray(p.path) && 
      p.path.length > 0
    ),
    [visibleProjects]
  );

  // Count unique visible projects
  const uniqueVisibleProjects = useMemo(() => {
    const visibleIds = new Set();
    pointProjects.forEach(p => visibleIds.add(p.id));
    transmissionLineProjects.forEach(p => visibleIds.add(p.id));
    return visibleIds.size;
  }, [pointProjects, transmissionLineProjects]);

  // Count total unique projects with features
  const totalProjectsWithFeatures = useMemo(() => {
    const allIds = new Set();
    projects.forEach(p => {
      if ((p.lat && p.lng) || (Array.isArray(p.path) && p.path.length > 0)) {
        allIds.add(p.id);
      }
    });
    return allIds.size;
  }, [projects]);

  // For FlyToAndPopup, we need projects with coordinates
  const projectsWithCoordinates = useMemo(() => 
    projects.filter(p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng)),
    [projects]
  );

  // Don't render map on server
  if (!isClient) {
    return (
      <div className="w-full">
        <div style={containerStyle} className="shadow-sm border bg-muted flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filter controls */}
      <div className="hidden md:flex flex-wrap gap-1 items-center mb-3">
        <div className="text-sm font-medium mr-2">Filter:</div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 rounded-full text-sm border transition-all whitespace-nowrap ${
              activeCategory === cat ? 'bg-primary/10 border-primary text-primary' : 'bg-background/80 border-border'
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="text-xs text-muted-foreground">
          Tap markers to open details. Use the filter buttons to show specific project categories.
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Showing {uniqueVisibleProjects} / {totalProjectsWithFeatures} projects
        </div>
      </div>
      {/* Filter controls for mobile screens */}
      <div className="md:hidden flex gap-1 items-center mb-2">
        <div className="text-xs font-medium">Filter:</div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-1 py-1 rounded-full text-xs border transition-all whitespace-nowrap ${
              activeCategory === cat ? 'bg-primary/10 border-primary text-primary' : 'bg-background/80 border-border'
            }`}
          >
            {cat}
          </button>
        ))}
        {/* <div className="text-xs text-muted-foreground">
          Tap markers to open details. Use the filter buttons to show specific project categories.
        </div> */}
        {/* <div className="mr-2 ml-auto text-xs text-muted-foreground">
          {uniqueVisibleProjects} / {totalProjectsWithFeatures}
        </div> */}
      </div>

      {/* Map container */}
      <div style={containerStyle} className="hidden md:block shadow-sm border">
        <MapContainer
          key="project-map" // Add key to force clean remount
          center={defaultCenter}
          zoom={6}
          minZoom={4}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Add MapLegend component here if you want it inside */}
          <MapLegend />

          {/* Transmission Lines */}
          {transmissionLineProjects.map((p) => (
            <Polyline
              key={`line-${p.id}`}
              positions={p.path as L.LatLngExpression[]}
              pathOptions={{ 
                color: '#DC2626', 
                weight: 4, 
                dashArray: '8 6',
                opacity: 0.8
              }}
              eventHandlers={{
                dblclick: (e) => {
                  e.originalEvent.stopPropagation();
                  const map = e.target._map;
                  if (map && p.path && p.path.length > 0) {
                    const latlngs = p.path.map(coord => L.latLng(coord[0], coord[1]));
                    const bounds = L.latLngBounds(latlngs);
                    map.fitBounds(bounds, { padding: [20, 20] });
                  }
                }
              }}
            >
              <Popup>
                <div style={{ maxWidth: 280, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: '16px' }}>{p.title}</h3>
                  <p style={{ fontSize: 13, marginBottom: 8, lineHeight: '1.4' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#F59E0B', fontWeight: '600' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                      dangerouslySetInnerHTML={{ __html: mapSVG }}
                    />
                    <span>Transmission Line Project</span>
                  </div>
                  {/* {p.tags && p.tags.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {p.tags.map((tag, index) => (
                        <span 
                          key={index}
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            backgroundColor: '#f1f5f9',
                            color: '#0ea5e9',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            marginRight: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )} */}
                  {p.link && (
                    <a 
                      href={p.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        color: '#0ea5e9', 
                        fontWeight: 600, 
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Open project ↗
                    </a>
                  )}
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Point markers */}
          {pointProjects.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat as number, p.lng as number]}
              icon={getIconForCategory(p.category)}
              eventHandlers={{
                dblclick: (e) => {
                  e.originalEvent.stopPropagation();
                  const map = e.target._map;
                  if (map) {
                    map.flyTo([p.lat, p.lng], 13, { 
                      animate: true, 
                      duration: 0.8 
                    });
                  }
                }
              }}
            >
              <Popup minWidth={220} maxWidth={360}>
                <div style={{ maxWidth: 320, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: '16px' }}>{p.title}</h3>
                  {(p.imageThumb || p.image) ? (
                    <img
                      src={p.imageThumb || p.image}
                      alt={p.title}
                      loading="lazy"
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                    />
                  ) : null}
                  <p style={{ fontSize: 13, marginBottom: 8, lineHeight: '1.4' }}>{p.description}</p>
                  {/* {p.tags && p.tags.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {p.tags.map((tag, index) => (
                        <span 
                          key={index}
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            backgroundColor: '#f1f5f9',
                            color: '#0ea5e9',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            marginRight: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )} */}
                  {p.link ? (
                    <a 
                      href={p.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        color: '#0ea5e9', 
                        fontWeight: 600, 
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Open project ↗
                    </a>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Handle fly-to & popup */}
          <FlyToAndPopup projects={projectsWithCoordinates} centerProjectId={centerProjectId} />

          <MapEvents />
        </MapContainer>
      </div>

      {/* Map container - for mobile screens */}
      <div style={containerStyle} className="md:hidden shadow-sm border">
        <MapContainer
          key="project-map" // Add key to force clean remount
          center={defaultCenter}
          zoom={6}
          minZoom={4}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Add MapLegend component here if you want it inside */}
          {/* <MapLegend /> */}

          {/* Transmission Lines */}
          {transmissionLineProjects.map((p) => (
            <Polyline
              key={`line-${p.id}`}
              positions={p.path as L.LatLngExpression[]}
              pathOptions={{ 
                color: '#DC2626', 
                weight: 3, 
                dashArray: '8 6',
                opacity: 0.8
              }}
              eventHandlers={{
                dblclick: (e) => {
                  e.originalEvent.stopPropagation();
                  const map = e.target._map;
                  if (map && p.path && p.path.length > 0) {
                    const latlngs = p.path.map(coord => L.latLng(coord[0], coord[1]));
                    const bounds = L.latLngBounds(latlngs);
                    map.fitBounds(bounds, { padding: [20, 20] });
                  }
                }
              }}
            >
              <Popup>
                <div style={{ width:150, maxWidth: 280, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 2, fontSize: '12px' }}>{p.title}</h3>
                  <p style={{ fontSize: 11, marginBottom: 4, lineHeight: '1.4' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '10px', color: '#F59E0B', fontWeight: '600' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                      dangerouslySetInnerHTML={{ __html: mapSVG }}
                    />
                    <span>Transmission Line Project</span>
                  </div>
                  {/* {p.tags && p.tags.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {p.tags.map((tag, index) => (
                        <span 
                          key={index}
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            backgroundColor: '#f1f5f9',
                            color: '#0ea5e9',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            marginRight: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )} */}
                  {p.link && (
                    <a 
                      href={p.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        color: '#0ea5e9', 
                        fontWeight: 600, 
                        textDecoration: 'none',
                        fontSize: '11px'
                      }}
                    >
                      Open project ↗
                    </a>
                  )}
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Point markers */}
          {pointProjects.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat as number, p.lng as number]}
              icon={getIconForCategory(p.category)}
              eventHandlers={{
                dblclick: (e) => {
                  e.originalEvent.stopPropagation();
                  const map = e.target._map;
                  if (map) {
                    map.flyTo([p.lat, p.lng], 13, { 
                      animate: true, 
                      duration: 0.8 
                    });
                  }
                }
              }}
            >
              <Popup>
                <div style={{ width:150, maxWidth: 280, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 2, fontSize: '12px' }}>{p.title}</h3>
                  <p style={{ fontSize: 11, marginBottom: 4, lineHeight: '1.4' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '10px', color: '#043335ff', fontWeight: '600' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                    />
                    <span>{p.category}</span>
                  </div>
                  {p.link ? (
                    <a 
                      href={p.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        color: '#0ea5e9', 
                        fontWeight: 600, 
                        textDecoration: 'none',
                        fontSize: '11px'
                      }}
                    >
                      Open project ↗
                    </a>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Handle fly-to & popup */}
          <FlyToAndPopup projects={projectsWithCoordinates} centerProjectId={centerProjectId} />

          <MapEvents />
        </MapContainer>
      </div>

      {/* External Legend (keep it outside for now) */}
      {/* <div className="hidden md:flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
        <div className="font-bold ml-10 text-foreground text-pretty text-sm">
          Expertise:
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Hydrology</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Air Quality & Noise</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>GIS & Remote Sensing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-600 opacity-80" style={{ backgroundImage: 'linear-gradient(to right, #f1e6e6ff 50%, transparent 50%)', backgroundSize: '8px 4px' }}></div>
          <span>GIS for Transmission Lines</span>
        </div>
      </div> */}
      {/* External Legend for mobile screens */}
      <div className="md:hidden flex gap-2 mt-2 mb-6 text-xs text-muted-foreground">
        <div className="font-medium text-foreground text-pretty text-xs">
          Expertise:
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span>Hydrology</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          <span>Air Quality & Noise</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          <span>GIS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-1 bg-red-600 opacity-80" style={{ backgroundImage: 'linear-gradient(to right, #f1e6e6ff 50%, transparent 50%)', backgroundSize: '8px 4px' }}></div>
          <span>TLs</span>
        </div>
      </div>
    </div>
  );
}

// Keep your FlyToAndPopup, MapEvents, and other components the same
function FlyToAndPopup({ projects, centerProjectId }: { projects: Project[]; centerProjectId: string | null; }) {
  const map = useMap();
  const lastProjectId = useRef<string | null>(null);

  useEffect(() => {
    if (!centerProjectId || centerProjectId === lastProjectId.current) return;
    
    const p = projects.find((t) => t.id === centerProjectId);
    if (!p) {
      console.warn(`Project with id ${centerProjectId} not found`);
      return;
    }

    lastProjectId.current = centerProjectId;

    const latlng: L.LatLngExpression = [p.lat, p.lng];
    const targetZoom = 13;

    map.flyTo(latlng, targetZoom, { animate: true, duration: 0.8 });

    // Close any existing popups
    map.closePopup();

    // Build safe HTML content for popup
    const safeTitle = String(p.title || '');
    const safeDesc = String(p.description || '');
    const img = p.imageThumb || p.image || '';
    const link = p.link || '';

    const content = `
      <div style="max-width:320px;font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
        <h3 style="font-weight:700;margin:0 0 6px 0;font-size:16px;">${safeTitle}</h3>
        ${img ? `<img src="${img}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px;" alt="${safeTitle}" />` : ''}
        <p style="font-size:13px;margin:0 0 8px 0;line-height:1.4;">${safeDesc}</p>
        ${link ? `<a href="${link}" target="_blank" rel="noreferrer" style="color:#0ea5e9;font-weight:600;text-decoration:none;font-size:14px;">Open project ↗</a>` : ''}
      </div>
    `;

    L.popup({ minWidth: 220, maxWidth: 360 })
      .setLatLng(latlng)
      .setContent(content)
      .openOn(map);

  }, [centerProjectId, projects, map]);

  return null;
}

function MapEvents() {
  useMapEvent('click', () => {
    // You can add any map click behavior here if needed
  });
  return null;
}
