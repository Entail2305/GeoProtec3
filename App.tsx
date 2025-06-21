
import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import UserView from './components/UserView';
import AdminView from './components/AdminView';
import type { GeoJsonPolygon, GeoJsonPoint } from './types'; 
import { AppNav } from './components/common/AppNav'; 

// Initial default polygon (San Francisco)
const initialDefaultPolygon: GeoJsonPolygon = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-122.51821015840398, 37.77864696973343],
        [-122.38500092988835, 37.81093199859016],
        [-122.36836884981023, 37.71618731302061],
        [-122.48425935273992, 37.70660609049008],
        [-122.51821015840398, 37.77864696973343]
      ]
    ]
  }
};

const App: React.FC = () => {
  const [currentPolygon, setCurrentPolygon] = useState<GeoJsonPolygon | null>(initialDefaultPolygon);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to SF
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [geocodedPointForMap, setGeocodedPointForMap] = useState<GeoJsonPoint | null>(null);

  const handlePolygonUpload = useCallback((polygon: GeoJsonPolygon) => {
    setCurrentPolygon(polygon);
    // Attempt to center map on the new polygon
    if (polygon.geometry.coordinates && polygon.geometry.coordinates.length > 0) {
      let targetCoordinates: number[] | undefined = undefined;

      if (polygon.geometry.type === "Polygon") {
        // polygon.geometry.coordinates is number[][][]
        // polygon.geometry.coordinates[0] is number[][] (linear ring)
        // polygon.geometry.coordinates[0][0] is number[] ([lon, lat])
        if (polygon.geometry.coordinates[0] && polygon.geometry.coordinates[0].length > 0 && polygon.geometry.coordinates[0][0]) {
          targetCoordinates = polygon.geometry.coordinates[0][0];
        }
      } else if (polygon.geometry.type === "MultiPolygon") {
        // polygon.geometry.coordinates is number[][][][]
        // polygon.geometry.coordinates[0] is number[][][] (first polygon's coordinates)
        // polygon.geometry.coordinates[0][0] is number[][] (first linear ring of first polygon)
        // polygon.geometry.coordinates[0][0][0] is number[] ([lon, lat])
        if (polygon.geometry.coordinates[0] && 
            polygon.geometry.coordinates[0][0] && 
            polygon.geometry.coordinates[0][0].length > 0 &&
            polygon.geometry.coordinates[0][0][0]) {
          targetCoordinates = polygon.geometry.coordinates[0][0][0];
        }
      }

      if (targetCoordinates && targetCoordinates.length === 2 && typeof targetCoordinates[0] === 'number' && typeof targetCoordinates[1] === 'number') {
        setMapCenter([targetCoordinates[1], targetCoordinates[0]]); // Leaflet uses [lat, lng]
        setMapZoom(12); // Zoom in a bit more
      } else {
        console.warn("Could not determine center from uploaded polygon. Coordinates structure unexpected or empty.");
        // Fallback to a default or keep current map center/zoom
      }
    }
    alert('Polígono actualizado exitosamente!');
  }, []);

  const handleGeocodedPoint = useCallback((point: GeoJsonPoint | null) => {
    setGeocodedPointForMap(point);
    if (point) {
      setMapCenter([point.geometry.coordinates[1], point.geometry.coordinates[0]]);
      setMapZoom(14);
    }
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-gray-100 flex flex-col">
      <header className="bg-slate-800/50 backdrop-blur-md shadow-lg p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
            GeoProtec
          </h1>
          <AppNav />
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        <Routes>
          <Route 
            path="/" 
            element={
              <UserView 
                polygon={currentPolygon} 
                onGeocode={handleGeocodedPoint}
                mapInitialCenter={mapCenter}
                mapInitialZoom={mapZoom}
                currentGeocodedPoint={geocodedPointForMap}
              />
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminView 
                onPolygonUpload={handlePolygonUpload} 
                currentPolygon={currentPolygon}
              />
            } 
          />
        </Routes>
      </main>
      <footer className="bg-slate-800/50 text-center p-4 text-sm text-gray-400 border-t border-slate-700">
        © {new Date().getFullYear()} GeoProtec. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default App;
