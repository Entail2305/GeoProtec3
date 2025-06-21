// We'll assume Turf.js is available globally via CDN or installed
// For a project with a build system, you'd do:
// import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
// import { Point, Polygon, MultiPolygon, Feature } from 'geojson';
// For now, let's assume global `turf` object from a CDN.

import type { GeoJsonPoint, GeoJsonPolygon } from '../types';

declare var turf: any; // Assuming turf is loaded globally e.g. from <script src="https://unpkg.com/@turf/turf@latest/turf.min.js"></script>

export const isPointInPolygon = (
    pointFeature: GeoJsonPoint,
    polygonFeature: GeoJsonPolygon
  ): boolean => {
    if (typeof turf === 'undefined' || typeof turf.booleanPointInPolygon === 'undefined') {
        console.error("Turf.js is not loaded. Please ensure it's included in your project.");
        // Fallback or throw error. For now, let's be pessimistic.
        // In a real app, you might have a local implementation or a stricter dependency.
        alert("Error: La librería de análisis geoespacial (Turf.js) no está cargada. La verificación no puede realizarse.");
        return false; 
    }
    
    // Turf expects coordinates directly or GeoJSON objects.
    // Ensure inputs are valid GeoJSON features for turf functions.
    try {
      return turf.booleanPointInPolygon(pointFeature.geometry, polygonFeature.geometry);
    } catch (e) {
      console.error("Error in turf.booleanPointInPolygon:", e);
      // This could happen if GeoJSON structures are malformed despite prior validation
      // or if turf itself has an issue with the specific geometries.
      throw new Error("Error durante el análisis de punto en polígono. Verifique la validez de los datos geoespaciales.");
    }
};
  
export const validateAndParseGeoJSON = (fileContent: string): GeoJsonPolygon => {
    let parsedJson;
    try {
      parsedJson = JSON.parse(fileContent);
    } catch (e) {
      throw new Error("El archivo no es un JSON válido.");
    }

    let featureToValidate: any = null;

    if (parsedJson.type === "Feature") {
      featureToValidate = parsedJson;
    } else if (parsedJson.type === "FeatureCollection") {
      if (!parsedJson.features || !Array.isArray(parsedJson.features) || parsedJson.features.length === 0) {
        throw new Error("Un 'FeatureCollection' GeoJSON debe tener una propiedad 'features' que sea un arreglo no vacío de 'Features'.");
      }
      // Find the first valid Polygon or MultiPolygon feature within the collection
      featureToValidate = parsedJson.features.find((feature: any) =>
        feature && feature.type === "Feature" &&
        feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
      );
      if (!featureToValidate) {
        throw new Error("El 'FeatureCollection' GeoJSON no contiene ningún 'Feature' con geometría de tipo 'Polygon' o 'MultiPolygon' válida.");
      }
    } else {
      throw new Error("El GeoJSON debe ser de tipo 'Feature' (con geometría Polygon/MultiPolygon) o 'FeatureCollection' (conteniendo al menos un Feature con geometría Polygon/MultiPolygon).");
    }

    // Now validate the selected featureToValidate
    if (!featureToValidate.geometry) { 
      // This case should ideally be caught by the .find() or initial structure check,
      // but it's a defensive check.
      throw new Error("El 'Feature' GeoJSON seleccionado o encontrado debe tener una propiedad 'geometry'.");
    }

    const geometryType = featureToValidate.geometry.type;
    // This check is also somewhat redundant if .find() worked correctly, but good for clarity.
    if (geometryType !== "Polygon" && geometryType !== "MultiPolygon") {
      throw new Error("La geometría del 'Feature' GeoJSON seleccionado o encontrado debe ser de tipo 'Polygon' o 'MultiPolygon'.");
    }
  
    // Basic coordinate validation (presence and basic structure)
    if (!featureToValidate.geometry.coordinates || featureToValidate.geometry.coordinates.length === 0) {
        throw new Error("La geometría del 'Feature' seleccionado debe tener coordenadas.");
    }

    if (geometryType === "Polygon") {
        // For Polygon: coordinates is array of linear rings (array of points)
        // [[[lon, lat], [lon, lat], ...]]
        if (!Array.isArray(featureToValidate.geometry.coordinates[0]) || 
            !Array.isArray(featureToValidate.geometry.coordinates[0][0]) || 
            featureToValidate.geometry.coordinates[0][0].length < 2 // Check for at least [lon, lat]
        ) {
            throw new Error("Las coordenadas del Polígono en el 'Feature' seleccionado tienen un formato incorrecto.");
        }
    } else if (geometryType === "MultiPolygon") {
        // For MultiPolygon: coordinates is array of Polygon coordinate arrays
        // [[[[lon, lat], ...]], [[[lon, lat], ...]]]
        if (
            !Array.isArray(featureToValidate.geometry.coordinates[0]) || 
            !Array.isArray(featureToValidate.geometry.coordinates[0][0]) || 
            !Array.isArray(featureToValidate.geometry.coordinates[0][0][0]) || 
            featureToValidate.geometry.coordinates[0][0][0].length < 2 // Check for at least [lon, lat]
        ) {
            throw new Error("Las coordenadas del MultiPolígono en el 'Feature' seleccionado tienen un formato incorrecto.");
        }
    }
  
    return featureToValidate as GeoJsonPolygon; // Return the Feature object
};