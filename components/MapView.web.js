/**
 * Web: use Leaflet with dark/normal map styles
 * Metro resolves this when building for web.
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { PERFORMANCE_CONFIG, PerformanceMonitor } from '../performance-config';

// Dynamically import Leaflet only on web platform
let MapContainer, TileLayer, useMapEvents, LPolygon, CircleMarker, Popup;
let L;

try {
  // These imports will only work in web environment
  const leaflet = require('react-leaflet');
  const leafletLib = require('leaflet');
  require('leaflet/dist/leaflet.css');
  
  MapContainer = leaflet.MapContainer;
  TileLayer = leaflet.TileLayer;
  useMapEvents = leaflet.useMapEvents;
  LPolygon = leaflet.Polygon;
  CircleMarker = leaflet.CircleMarker;
  Popup = leaflet.Popup;
  L = leafletLib;

  // Fix default marker icon in Leaflet when using bundlers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
} catch (error) {
  console.warn('Leaflet not available in native environment');
}

function deltaToZoom(latDelta, lngDelta) {
  const maxDelta = Math.max(latDelta, lngDelta);
  if (maxDelta >= 20) return 4;
  if (maxDelta >= 10) return 5;
  if (maxDelta >= 5) return 6;
  if (maxDelta >= 2) return 7;
  if (maxDelta >= 1) return 8;
  if (maxDelta >= 0.5) return 9;
  if (maxDelta >= 0.2) return 10;
  if (maxDelta >= 0.1) return 11;
  if (maxDelta >= 0.05) return 12;
  if (maxDelta >= 0.02) return 13;
  if (maxDelta >= 0.01) return 14;
  return 15;
}

function MapClickHandler({ onPress }) {
  if (!useMapEvents) return null;
  
  useMapEvents({
    click(e) {
      onPress?.({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
    },
  });
  return null;
}

// Map style configurations with dark theme options
const MAP_STYLES = {
  normal: {
    name: 'Normal',
    provider: 'osm',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    name: 'Dark Radar',
    provider: 'cartodb_dark',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// Dark tile providers - "Radar Dark v1" style
const TILE_PROVIDERS = {
  // Standard OpenStreetMap
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  // CartoDB Dark Matter - Professional dark theme
  cartodb_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
  },
  // Stamen Toner Dark - High contrast dark theme
  stamen_toner_dark: {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png',
    maxZoom: 18,
  },
  // Stamen Toner Lite - Light theme alternative
  stamen_toner_lite: {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png',
    maxZoom: 18,
  },
  // OpenTopoMap - Topographic maps
  opentopomap: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
  },
  // Radar-style dark theme (custom implementation)
  radar_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
  },
};

// Map style toggle component (web version using React Native components)
function MapStyleToggle({ currentStyle, onStyleChange, style }) {
  return (
    <View style={{
      position: 'absolute',
      top: style?.top || 10,
      right: style?.right || 10,
      flexDirection: 'row',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderRadius: 8,
      padding: 4,
      borderWidth: 1,
      borderColor: '#334155',
      zIndex: 1000,
    }}>
      <TouchableOpacity
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          marginHorizontal: 2,
          backgroundColor: currentStyle === 'normal' ? '#2563eb' : 'transparent',
        }}
        onPress={() => onStyleChange('normal')}
      >
        <Text style={{
          color: currentStyle === 'normal' ? '#ffffff' : '#94a3b8',
          fontSize: 12,
          fontWeight: '600',
        }}>
          Normal
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          marginHorizontal: 2,
          backgroundColor: currentStyle === 'dark' ? '#2563eb' : 'transparent',
        }}
        onPress={() => onStyleChange('dark')}
      >
        <Text style={{
          color: currentStyle === 'dark' ? '#ffffff' : '#94a3b8',
          fontSize: 12,
          fontWeight: '600',
        }}>
          Dark
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Dark theme styles injection
function DarkThemeStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const style = document.createElement('style');
    style.textContent = `
      .dark-tiles .leaflet-tile-pane {
        filter: brightness(0.7) contrast(1.1) saturate(0.8);
      }
      .leaflet-control-container .leaflet-control {
        background-color: rgba(30, 41, 59, 0.9) !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
        color: #e2e8f0 !important;
      }
      .leaflet-control-container .leaflet-control a {
        color: #e2e8f0 !important;
      }
      .leaflet-control-container .leaflet-control a:hover {
        background-color: #334155 !important;
        color: #ffffff !important;
      }
      .leaflet-control-attribution {
        background-color: rgba(30, 41, 59, 0.9) !important;
        color: #94a3b8 !important;
      }
      .leaflet-control-attribution a {
        color: #e2e8f0 !important;
      }
      .dark-tiles .leaflet-marker-icon {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
      }
      .dark-tiles .leaflet-interactive {
        filter: brightness(1.2) saturate(1.1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  return null;
}

// Isolate Leaflet's stacking context so header/sidebar (z-index 1–2) stay on top
const MAP_WRAPPER_STYLE = {
  position: 'relative',
  zIndex: 0,
  width: '100%',
  height: '100%',
  minHeight: 300,
  flex: 1,
  overflow: 'hidden',
};

export function MapView({ style, initialRegion, onPress, children, showsUserLocation, mapStyle = 'normal', onMapStyleChange }) {
  PerformanceMonitor.start('MapView Render');
  
  const center = useMemo(
    () => [initialRegion.latitude, initialRegion.longitude],
    [initialRegion.latitude, initialRegion.longitude]
  );
  const zoom = useMemo(
    () => deltaToZoom(initialRegion.latitudeDelta, initialRegion.longitudeDelta),
    [initialRegion.latitudeDelta, initialRegion.longitudeDelta]
  );

  const currentStyle = MAP_STYLES[mapStyle] || MAP_STYLES.normal;
  const tileProvider = TILE_PROVIDERS[currentStyle.provider] || TILE_PROVIDERS.osm;
  
  // Optimize tile loading with memoization
  const tileLayerProps = useMemo(() => ({
    attribution: currentStyle.attribution,
    url: tileProvider.url,
    maxZoom: tileProvider.maxZoom,
    className: mapStyle === 'dark' ? 'dark-tiles' : '',
    keepBuffer: PERFORMANCE_CONFIG.mapPerformance.tilePreload,
    updateWhenIdle: true,
    updateWhenZooming: false,
    updateInterval: PERFORMANCE_CONFIG.mapPerformance.updateInterval,
  }), [currentStyle, tileProvider, mapStyle]);

  if (!MapContainer || !TileLayer) {
    return (
      <View style={[{ ...MAP_WRAPPER_STYLE, ...style }, styles.fallbackContainer]}>
        <Text style={styles.fallbackText}>Map loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ ...MAP_WRAPPER_STYLE, ...style }}>
      <DarkThemeStyles />
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={PERFORMANCE_CONFIG.enableOptimizations}
        preferCanvas={PERFORMANCE_CONFIG.enableOptimizations}
        zoomAnimation={PERFORMANCE_CONFIG.enableOptimizations}
        fadeAnimation={PERFORMANCE_CONFIG.enableOptimizations}
        markerZoomAnimation={PERFORMANCE_CONFIG.enableOptimizations}
      >
        <TileLayer {...tileLayerProps} />
        <MapClickHandler onPress={onPress} />
        {children}
      </MapContainer>
      
      {PerformanceMonitor.end('MapView Render'), null}
      
      {/* Map style toggle - positioned in top right */}
      {onMapStyleChange && (
        <MapStyleToggle
          currentStyle={mapStyle}
          onStyleChange={onMapStyleChange}
          style={{ top: 80, right: 10 }}
        />
      )}
    </View>
  );
}

export function Marker({ coordinate, title, pinColor }) {
  const position = useMemo(() => [coordinate.latitude, coordinate.longitude], [coordinate.latitude, coordinate.longitude]);
  
  if (!CircleMarker) return null;
  
  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{ color: pinColor || '#2563eb', fillColor: pinColor || '#2563eb', fillOpacity: 1, weight: 2 }}
    >
      {title ? <Popup>{title}</Popup> : null}
    </CircleMarker>
  );
}

export function Polygon({ coordinates, fillColor, strokeColor, strokeWidth }) {
  const positions = useMemo(
    () => coordinates.map((c) => [c.latitude, c.longitude]),
    [coordinates]
  );
  
  if (!LPolygon) return null;
  
  let fill = '#2563eb';
  let fillOpacity = 0.2;
  if (fillColor) {
    const rgba = fillColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgba) {
      fill = `rgb(${rgba[1]},${rgba[2]},${rgba[3]})`;
      fillOpacity = rgba[4] ? parseFloat(rgba[4]) : 0.2;
    } else {
      fill = fillColor;
    }
  }
  return (
    <LPolygon
      positions={positions}
      pathOptions={{
        color: strokeColor || '#2563eb',
        fillColor: fill,
        fillOpacity,
        weight: strokeWidth ?? 3,
      }}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  fallbackText: {
    color: '#e2e8f0',
    fontSize: 16,
  },
});