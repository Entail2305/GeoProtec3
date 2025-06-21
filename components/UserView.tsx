import React, { useState, useCallback } from 'react';
import type { Address, GeoJsonPolygon, GeoJsonPoint } from '../types';
import { VerificationStatus } from '../types';
import { geocodeAddress } from '../services/geocodingService';
import { isPointInPolygon } from '../services/polygonService';
import MapDisplay from './MapDisplay';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { LoadingSpinner } from './common/LoadingSpinner';
import { Alert } from './common/Alert';
import { CheckCircleIcon, XCircleIcon, MapPinIcon, ExclamationTriangleIcon } from '../utils/iconUtils';

interface UserViewProps {
  polygon: GeoJsonPolygon | null;
  onGeocode: (point: GeoJsonPoint | null) => void;
  mapInitialCenter: [number, number];
  mapInitialZoom: number;
  currentGeocodedPoint: GeoJsonPoint | null;
}

const UserView: React.FC<UserViewProps> = ({ polygon, onGeocode, mapInitialCenter, mapInitialZoom, currentGeocodedPoint }) => {
  const [address, setAddress] = useState<Address>({
    streetAddress: '',
  });
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!polygon) {
      setStatus(VerificationStatus.NO_POLYGON);
      setErrorMessage("No hay un polígono de referencia cargado. Por favor, contacte al administrador.");
      onGeocode(null);
      return;
    }
    if (!address.streetAddress.trim()) {
        setStatus(VerificationStatus.ERROR);
        setErrorMessage("Por favor, ingrese una calle y altura.");
        onGeocode(null);
        return;
    }
    setStatus(VerificationStatus.LOADING);
    setErrorMessage(null);
    onGeocode(null);

    try {
      const point = await geocodeAddress(address);
      
      if (point.properties?.error) {
        setStatus(VerificationStatus.ADDRESS_NOT_FOUND);
        setErrorMessage(point.properties.error as string);
        onGeocode(null); // Pass null if address not found or error during geocoding by Gemini
        return;
      }
      
      onGeocode(point); // Update map with new point

      if (isPointInPolygon(point, polygon)) {
        setStatus(VerificationStatus.INSIDE);
      } else {
        setStatus(VerificationStatus.OUTSIDE);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("Address not found")) {
            setStatus(VerificationStatus.ADDRESS_NOT_FOUND);
            setErrorMessage("La dirección ingresada no pudo ser encontrada o es demasiado ambigua. Verifique los datos.");
        } else if (error.message.includes("API key not valid")) {
            setStatus(VerificationStatus.ERROR);
            setErrorMessage("Error de configuración: La clave API para el servicio de geocodificación no es válida o no está configurada. Contacte al administrador.");
        }
         else {
            setStatus(VerificationStatus.ERROR);
            setErrorMessage(`Error de geocodificación: ${error.message}`);
        }
      } else {
        setStatus(VerificationStatus.ERROR);
        setErrorMessage("Ocurrió un error desconocido durante la geocodificación.");
      }
      onGeocode(null);
    }
  }, [address, polygon, onGeocode]);

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-sky-400 mb-6 flex items-center">
          <MapPinIcon className="w-7 h-7 mr-2" /> Verificar Ubicación de Dirección (Argentina)
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Calle y Altura" name="streetAddress" value={address.streetAddress} onChange={handleInputChange} placeholder="Ej: Av. Corrientes 1234" required />
          <Button type="submit" disabled={status === VerificationStatus.LOADING} className="w-full sm:w-auto">
            {status === VerificationStatus.LOADING ? <LoadingSpinner /> : 'Verificar Ubicación'}
          </Button>
        </form>
      </div>

      {status !== VerificationStatus.IDLE && status !== VerificationStatus.LOADING && (
        <div className="result-animate">
          {status === VerificationStatus.INSIDE && (
            <Alert type="success" icon={<CheckCircleIcon className="w-6 h-6 mr-2"/>}>
              La dirección ingresada se encuentra <strong>DENTRO</strong> del área definida.
            </Alert>
          )}
          {status === VerificationStatus.OUTSIDE && (
            <Alert type="error" icon={<XCircleIcon className="w-6 h-6 mr-2"/>}>
              La dirección ingresada se encuentra <strong>FUERA</strong> del área definida.
            </Alert>
          )}
          {status === VerificationStatus.ADDRESS_NOT_FOUND && errorMessage && (
            <Alert type="warning" icon={<ExclamationTriangleIcon className="w-6 h-6 mr-2"/>}>
              {errorMessage}
            </Alert>
          )}
          {status === VerificationStatus.NO_POLYGON && errorMessage && (
             <Alert type="warning" icon={<ExclamationTriangleIcon className="w-6 h-6 mr-2"/>}>
              {errorMessage}
            </Alert>
          )}
          {status === VerificationStatus.ERROR && errorMessage && (
            <Alert type="error" icon={<ExclamationTriangleIcon className="w-6 h-6 mr-2"/>}>
              {errorMessage}
            </Alert>
          )}
        </div>
      )}
      
      <div className="bg-slate-800 shadow-xl rounded-lg p-1 md:p-2">
         <MapDisplay 
            polygon={polygon} 
            point={currentGeocodedPoint} 
            center={mapInitialCenter} 
            zoom={mapInitialZoom}
            key={currentGeocodedPoint ? `${currentGeocodedPoint.geometry.coordinates[0]}-${currentGeocodedPoint.geometry.coordinates[1]}` : (polygon ? 'poly' : 'empty')}
        />
      </div>
    </div>
  );
};

export default UserView;