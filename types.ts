// Basic GeoJSON Point structure
export interface GeoJsonPoint {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: Record<string, any>;
}

// Basic GeoJSON Polygon structure
export interface GeoJsonPolygon {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // Array of linear rings
  } | {
    type: "MultiPolygon";
    coordinates: number[][][][]; // Array of polygon coordinate arrays
  };
  properties: Record<string, any>;
}

export interface Address {
  streetAddress: string;
}

export enum VerificationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  INSIDE = 'INSIDE',
  OUTSIDE = 'OUTSIDE',
  ERROR = 'ERROR',
  ADDRESS_NOT_FOUND = 'ADDRESS_NOT_FOUND',
  NO_POLYGON = 'NO_POLYGON',
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}