import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Address, GeoJsonPoint } from '../types';

// Initialize the GoogleGenAI client.
// API key is sourced from environment variable `process.env.API_KEY`
// This is a hard requirement and the application must not ask the user for it.
let ai: GoogleGenAI | null = null;
try {
  if (typeof process.env.API_KEY === 'string' && process.env.API_KEY.trim() !== '') {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.error("API_KEY environment variable is not set or is empty.");
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI:", e);
  // ai remains null, geocodeAddress will handle this
}


export const geocodeAddress = async (address: Address): Promise<GeoJsonPoint> => {
  if (!ai) {
    console.error("GoogleGenAI client not initialized. API_KEY might be missing or invalid.");
    throw new Error(
      "Servicio de geocodificación no disponible debido a un problema de configuración (API Key). Contacte al administrador."
    );
  }

  const prompt = `Dada la siguiente dirección: "${address.streetAddress}", asume que está ubicada en Argentina (prioriza Ciudad Autónoma de Buenos Aires o Provincia de Buenos Aires si la dirección es ambigua pero parece pertenecer a estas áreas).
Devuelve las coordenadas geográficas (latitud y longitud) para esta dirección.
Tu respuesta DEBE ser un objeto GeoJSON Feature de tipo Point válido.
No incluyas explicaciones adicionales, solo el objeto JSON.

Formato de ejemplo:
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-58.3816, -34.6037]
  },
  "properties": {
    "fullAddress": "${address.streetAddress}, Argentina",
    "query": "${address.streetAddress}"
  }
}

Si la dirección no puede ser geocodificada o es demasiado ambigua, devuelve un objeto GeoJSON Feature de tipo Point con coordenadas [0,0] y una propiedad "error" en 'properties' describiendo el problema. Ejemplo de error:
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [0, 0]
  },
  "properties": {
    "fullAddress": "${address.streetAddress}, Argentina",
    "query": "${address.streetAddress}",
    "error": "Dirección no encontrada o demasiado ambigua."
  }
}`;

  try {
    console.log(`Geocoding address with Gemini: ${address.streetAddress}`);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17", // Or your preferred model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Lower temperature for more deterministic results
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    // Validate the structure of the parsed data to ensure it's a GeoJsonPoint
    if (
      parsedData.type === "Feature" &&
      parsedData.geometry &&
      parsedData.geometry.type === "Point" &&
      Array.isArray(parsedData.geometry.coordinates) &&
      parsedData.geometry.coordinates.length === 2 &&
      typeof parsedData.geometry.coordinates[0] === 'number' &&
      typeof parsedData.geometry.coordinates[1] === 'number'
    ) {
        // If Gemini indicates an error in properties, pass it along
        if (parsedData.properties && parsedData.properties.error) {
            console.warn(`Gemini geocoding error for "${address.streetAddress}": ${parsedData.properties.error}`);
             // Ensure the error response structure is consistent for the UI
            return {
                type: "Feature",
                geometry: { type: "Point", coordinates: [0,0] }, // Default coordinates for error
                properties: {
                    fullAddress: `${address.streetAddress}, Argentina`,
                    error: parsedData.properties.error
                }
            };
        }
      return parsedData as GeoJsonPoint;
    } else {
      console.error("Gemini response is not a valid GeoJSON Point Feature:", parsedData);
      throw new Error("Respuesta inesperada del servicio de geocodificación.");
    }

  } catch (e) {
    console.error("Error calling Gemini API or parsing response:", e);
    let errorMessage = "Error al conectar con el servicio de geocodificación.";
    if (e instanceof Error) {
        if (e.message.includes("API key not valid")) { // Check for specific API key error message from SDK
            errorMessage = "La clave API para el servicio de geocodificación no es válida. Contacte al administrador.";
        } else if (e.message.includes("FETCH_ERROR") || e.message.toLowerCase().includes("network request failed")) {
            errorMessage = "Error de red al intentar contactar el servicio de geocodificación.";
        } else if (e.message.toLowerCase().includes("json")) {
            errorMessage = "Respuesta malformada del servicio de geocodificación.";
        } else {
             errorMessage = e.message; // Use the error message from Gemini if available
        }
    }
    // Return a GeoJSON point with an error property for consistent handling in UI
    return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [0,0] },
        properties: {
            fullAddress: `${address.streetAddress}, Argentina`,
            error: errorMessage
        }
    };
  }
};