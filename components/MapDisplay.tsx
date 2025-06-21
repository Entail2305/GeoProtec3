
import React, { useEffect, useRef } from 'react';
import type { GeoJsonPolygon, GeoJsonPoint } from '../types';

declare var L: any; // Use Leaflet global (L)

interface MapDisplayProps {
  polygon: GeoJsonPolygon | null;
  point: GeoJsonPoint | null;
  center: [number, number]; // [lat, lng]
  zoom: number;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ polygon, point, center, zoom }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // To store Leaflet map instance
  const polygonLayerRef = useRef<any>(null);
  const pointMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
    
    // Cleanup function to remove map instance on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]); // Only re-init or setView if center/zoom changes fundamentally


  useEffect(() => {
    if (mapInstanceRef.current) {
      // Handle Polygon
      if (polygonLayerRef.current) {
        mapInstanceRef.current.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }
      if (polygon) {
        polygonLayerRef.current = L.geoJSON(polygon, {
          style: () => ({
            color: "#3498db", // Blue
            weight: 2,
            opacity: 0.8,
            fillColor: "#3498db",
            fillOpacity: 0.3
          })
        }).addTo(mapInstanceRef.current);
        // mapInstanceRef.current.fitBounds(polygonLayerRef.current.getBounds());
      }

      // Handle Point
      if (pointMarkerRef.current) {
        mapInstanceRef.current.removeLayer(pointMarkerRef.current);
        pointMarkerRef.current = null;
      }
      if (point) {
        // Leaflet expects [lat, lng] for markers
        const latLng: [number, number] = [point.geometry.coordinates[1], point.geometry.coordinates[0]];
        pointMarkerRef.current = L.marker(latLng).addTo(mapInstanceRef.current);
        // mapInstanceRef.current.panTo(latLng);
      }
    }
  }, [polygon, point]); // Re-draw layers if polygon or point changes


  return <div ref={mapRef} className="h-64 md:h-96 w-full rounded-md shadow-inner bg-gray-700 border border-slate-600" />;
};

export default MapDisplay;
    