
import React, { useState, useCallback, ChangeEvent } from 'react';
import type { GeoJsonPolygon } from '../types';
import { validateAndParseGeoJSON } from '../services/polygonService';
import { Button } from './common/Button';
import { Alert } from './common/Alert';
import MapDisplay from './MapDisplay';
import { UploadIcon, CheckCircleIcon, XCircleIcon, MapIcon } from '../utils/iconUtils';

interface AdminViewProps {
  onPolygonUpload: (polygon: GeoJsonPolygon) => void;
  currentPolygon: GeoJsonPolygon | null;
}

// Helper function to derive center from polygon (can be outside component)
const getCenterFromPolygonForAdmin = (polygon: GeoJsonPolygon): [number, number] => {
  try {
    if (polygon.geometry.type === "Polygon") {
      // For Polygon: coordinates is array of linear rings (array of points)
      // [[[lon, lat], [lon, lat], ...]]
      // Access first coordinate of the first linear ring
      if (polygon.geometry.coordinates && polygon.geometry.coordinates[0] && polygon.geometry.coordinates[0][0]) {
        const coord = polygon.geometry.coordinates[0][0]; // [lon, lat]
        if (coord && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          return [coord[1], coord[0]]; // [lat, lon]
        }
      }
    } else if (polygon.geometry.type === "MultiPolygon") {
      // For MultiPolygon: coordinates is array of Polygon coordinate arrays
      // [[[[lon, lat], ...]], [[[lon, lat], ...]]]
      // Access first coordinate of the first linear ring of the first polygon
      if (polygon.geometry.coordinates && 
          polygon.geometry.coordinates[0] && 
          polygon.geometry.coordinates[0][0] && 
          polygon.geometry.coordinates[0][0][0]) {
        const coord = polygon.geometry.coordinates[0][0][0]; // [lon, lat]
        if (coord && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          return [coord[1], coord[0]]; // [lat, lon]
        }
      }
    }
  } catch (e) {
    console.error("Error calculating center for admin map:", e);
  }
  // Fallback if coordinates are not found or structure is unexpected
  console.warn("Could not determine center for AdminView map display. Using default [0,0]. Polygon:", polygon);
  return [0, 0]; 
};


const AdminView: React.FC<AdminViewProps> = ({ onPolygonUpload, currentPolygon }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Por favor, seleccione un archivo GeoJSON.");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsedPolygon = validateAndParseGeoJSON(fileContent);
        // validateAndParseGeoJSON now returns GeoJsonPolygon directly or throws
        onPolygonUpload(parsedPolygon);
        setSuccess("Polígono cargado y validado exitosamente. El polígono activo ha sido actualizado.");
        setFile(null); // Clear file input after successful upload
        const fileInput = document.getElementById('geojson-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

      } catch (err) {
        if (err instanceof Error) {
            if (err.message === "El archivo no es un JSON válido.") {
                setError(`Error al procesar el archivo: ${err.message} Por favor, verifique la sintaxis del archivo. Puede usar un validador de JSON en línea para ayudarle.`);
            } else {
                setError(`Error al procesar el archivo: ${err.message}`);
            }
        } else {
            setError("Error desconocido al procesar el archivo.");
        }
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
        setError("Error al leer el archivo.");
        setUploading(false);
    }
    reader.readAsText(file);
  }, [file, onPolygonUpload]);

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-sky-400 mb-6 flex items-center">
          <UploadIcon className="w-7 h-7 mr-2" /> Administrar Polígono de Referencia
        </h2>
        
        {error && <Alert type="error" icon={<XCircleIcon className="w-5 h-5 mr-2"/>} className="mb-4">{error}</Alert>}
        {success && <Alert type="success" icon={<CheckCircleIcon className="w-5 h-5 mr-2"/>} className="mb-4">{success}</Alert>}

        <div className="space-y-4">
          <div>
            <label htmlFor="geojson-file-upload" className="block text-sm font-medium text-gray-300 mb-1">
              Cargar archivo GeoJSON (.geojson o .json)
            </label>
            <input
              id="geojson-file-upload"
              type="file"
              accept=".geojson,.json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 disabled:opacity-50"
              disabled={uploading}
            />
             <p className="mt-1 text-xs text-gray-500">El archivo debe contener un objeto GeoJSON de tipo 'Feature' (con geometría Polygon/MultiPolygon) o 'FeatureCollection' (conteniendo al menos un 'Feature' con geometría Polygon/MultiPolygon).</p>
          </div>
          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full sm:w-auto">
            {uploading ? 'Cargando...' : 'Cargar Polígono'}
          </Button>
        </div>
      </div>

      {currentPolygon && (
        <div className="bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
            <h3 className="text-xl font-semibold text-sky-400 mb-4 flex items-center">
                <MapIcon className="w-6 h-6 mr-2" /> Polígono Activo Actual
            </h3>
            <div className="bg-slate-800 shadow-xl rounded-lg p-1 md:p-2">
                <MapDisplay 
                    polygon={currentPolygon} 
                    point={null} 
                    center={getCenterFromPolygonForAdmin(currentPolygon)}
                    zoom={10}
                    key={JSON.stringify(currentPolygon.geometry.coordinates)} // Force re-render if polygon changes
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;