/**
 * Native (iOS/Android): Enhanced react-native-maps with dark/normal map styles
 * Uses react-native-maps with custom tile providers for dark theme
 */
import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapViewRN, { Polygon as RNPolygon, Marker as RNMarker } from 'react-native-maps';
import { PERFORMANCE_CONFIG, PerformanceMonitor } from '../performance-config';

// Map style configurations
const MAP_STYLES = {
  normal: {
    name: 'Normal',
    mapType: 'standard',
  },
  dark: {
    name: 'Dark Radar',
    mapType: 'mutedStandard', // iOS dark theme
    customMapStyle: [ // Android dark theme
      {
        "elementType": "geometry",
        "stylers": [{ "color": "#1e293b" }]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#1e293b" }]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#e2e8f0" }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#0f172a" }]
      },
      {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [{ "color": "#1e293b" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#334155" }]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#334155" }]
      }
    ]
  },
};

// Map style toggle component
function MapStyleToggle({ currentStyle, onStyleChange, style }) {
  return (
    <View style={[styles.toggleContainer, style]}>
      <TouchableOpacity
        style={[styles.toggleButton, currentStyle === 'normal' && styles.toggleButtonActive]}
        onPress={() => onStyleChange('normal')}
      >
        <Text style={[styles.toggleText, currentStyle === 'normal' && styles.toggleTextActive]}>
          Normal
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, currentStyle === 'dark' && styles.toggleButtonActive]}
        onPress={() => onStyleChange('dark')}
      >
        <Text style={[styles.toggleText, currentStyle === 'dark' && styles.toggleTextActive]}>
          Dark
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function MapView({ style, initialRegion, onPress, children, showsUserLocation, mapStyle = 'normal', onMapStyleChange }) {
  PerformanceMonitor.start('MapView Render');
  
  const currentStyle = MAP_STYLES[mapStyle] || MAP_STYLES.normal;
  
  // Memoized map configuration for better performance
  const mapConfig = useMemo(() => ({
    mapType: currentStyle.mapType,
    customMapStyle: currentStyle.customMapStyle,
    showsUserLocation: showsUserLocation,
    pitchEnabled: true,
    rotateEnabled: true,
    loadingEnabled: PERFORMANCE_CONFIG.enableOptimizations,
    cacheEnabled: PERFORMANCE_CONFIG.enableOptimizations,
    moveOnMarkerPress: false, // Prevent unnecessary re-renders
  }), [currentStyle, showsUserLocation]);
  
  return (
    <View style={[styles.container, style]}>
      <MapViewRN
        style={styles.map}
        initialRegion={initialRegion}
        onPress={onPress}
        {...mapConfig}
      >
        {children}
      </MapViewRN>
      
      {PerformanceMonitor.log(`Map rendered with ${mapStyle} theme`), null}
      
      {/* Map style toggle - positioned in top right */}
      {onMapStyleChange && (
        <MapStyleToggle
          currentStyle={mapStyle}
          onStyleChange={onMapStyleChange}
          style={styles.mapToggle}
        />
      )}
    </View>
  );
}

export function Marker({ coordinate, title, pinColor }) {
  return (
    <RNMarker
      coordinate={coordinate}
      title={title}
      pinColor={pinColor}
    />
  );
}

export function Polygon({ coordinates, fillColor, strokeColor, strokeWidth }) {
  return (
    <RNPolygon
      coordinates={coordinates}
      fillColor={fillColor}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  toggleContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 1000,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  mapToggle: {
    position: 'absolute',
    top: 80,
    right: 10,
  },
});