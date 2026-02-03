import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import MapView, { Polygon, Marker } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import {
  writeAsStringAsync,
  cacheDirectory,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  getBbox,
  getAreaKm2,
  sortPolygonCoords,
} from './lib/geo';
import {
  buildOverpassQuery,
  fetchOverpass,
  processOSMData,
} from './lib/overpass';
import { toOSM } from './lib/export';

const INITIAL_REGION = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const CATEGORIES = [
  { key: 'highway', label: 'Roads/Highways' },
  { key: 'building', label: 'Buildings' },
  { key: 'amenity', label: 'Points of Interest' },
  { key: 'natural', label: 'Natural' },
  { key: 'landuse', label: 'Land Use' },
  { key: 'waterway', label: 'Waterways' },
];

export default function App() {
  const { width } = useWindowDimensions();
  const [points, setPoints] = useState([]);
  const [maxPoints, setMaxPoints] = useState(5);
  const [categories, setCategories] = useState({
    highway: true,
    building: true,
    amenity: true,
    natural: true,
    landuse: false,
    waterway: false,
  });
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pointsLngLat = points.map((p) => [p.longitude, p.latitude]);
  const polygonCoords =
    points.length >= 3 ? sortPolygonCoords(pointsLngLat) : null;
  const polygonLatLngs =
    polygonCoords?.map(([lng, lat]) => ({ latitude: lat, longitude: lng })) ??
    [];

  const canExtract =
    points.length >= 3 &&
    points.length === maxPoints &&
    Object.values(categories).some(Boolean);

  const handleMapPress = useCallback(
    (e) => {
      if (points.length >= maxPoints) return;
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setPoints((prev) => [...prev, { latitude, longitude }]);
    },
    [points.length, maxPoints]
  );

  const clearPoints = useCallback(() => {
    setPoints([]);
    setExtractedData(null);
  }, []);

  const toggleCategory = useCallback((key) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const extractData = useCallback(async () => {
    if (!polygonCoords || polygonCoords.length < 4) return;
    const bbox = getBbox(polygonCoords);
    if (!bbox) return;

    const selectedCats = Object.entries(categories)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selectedCats.length === 0) {
      Alert.alert('Select categories', 'Choose at least one data category.');
      return;
    }

    setLoading(true);
    setProgress('Building query...');
    try {
      const query = buildOverpassQuery(bbox, selectedCats);
      setProgress('Fetching OSM data...');
      const data = await fetchOverpass(query, setProgress);
      setProgress('Processing...');
      const geojson = processOSMData(data, polygonCoords);
      setExtractedData(geojson);
      setProgress('');
    } catch (err) {
      const msg =
        err?.name === 'AbortError'
          ? 'Request timed out. Try a smaller area.'
          : err?.message || 'Extraction failed.';
      Alert.alert('Extraction failed', msg);
      setProgress('');
    } finally {
      setLoading(false);
    }
  }, [polygonCoords, categories]);

  const shareFile = useCallback(
    async (content, filename, mimeType, dialogTitle) => {
      if (!extractedData) return;
      try {
        const dir = cacheDirectory;
        const filePath = `${dir}${filename}`;
        await writeAsStringAsync(filePath, content, {
          encoding: 'utf8',
        });
        const available = await Sharing.isAvailableAsync();
        if (!available) {
          Alert.alert(
            'Sharing not available',
            'Share sheet is not available on this device (e.g. simulator). File was saved to app cache.'
          );
          return;
        }
        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle,
        });
      } catch (err) {
        console.error('Share error:', err);
        Alert.alert(
          'Share failed',
          err?.message || 'Could not write or share the file.'
        );
      }
    },
    [extractedData]
  );

  const shareGeoJSON = useCallback(async () => {
    if (!extractedData) return;
    await shareFile(
      JSON.stringify(extractedData, null, 2),
      'osm_data.geojson',
      'application/geo+json',
      'Export GeoJSON'
    );
  }, [extractedData, shareFile]);

  const shareOSM = useCallback(async () => {
    if (!extractedData) return;
    const xml = toOSM(extractedData);
    if (!xml) {
      Alert.alert('No data', 'Nothing to export.');
      return;
    }
    await shareFile(xml, 'osm_data.osm', 'application/xml', 'Share OSM');
  }, [extractedData, shareFile]);

  const stats = extractedData
    ? {
        area: getAreaKm2(polygonCoords ?? []).toFixed(2),
        total: extractedData.features.length,
        roads: extractedData.features.filter((f) => f.properties?.highway)
          .length,
        buildings: extractedData.features.filter((f) => f.properties?.building)
          .length,
        pois: extractedData.features.filter((f) => f.properties?.amenity)
          .length,
      }
    : null;

  const sidebarWidth = Math.min(360, width * 0.9);
  const sidebarTranslate = sidebarOpen ? 0 : sidebarWidth;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OSM Boundary Extractor</Text>
        <Text style={styles.headerSub}>
          Tap map to add {maxPoints} points (Apple Maps / MapKit)
        </Text>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarOpen((o) => !o)}
        >
          <View style={[styles.hamburger, sidebarOpen && styles.hamburgerOpen]}>
            <View style={styles.hamLine} />
            <View style={styles.hamLine} />
            <View style={styles.hamLine} />
          </View>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        showsUserLocation
        pitchEnabled
        rotateEnabled
      >
        {points.map((p, i) => (
          <Marker
            key={i}
            coordinate={p}
            title={`Point ${i + 1}`}
            pinColor="#2563eb"
          />
        ))}
        {polygonLatLngs.length >= 3 && (
          <Polygon
            coordinates={polygonLatLngs}
            fillColor="rgba(37, 99, 235, 0.2)"
            strokeColor="#2563eb"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View
        style={[
          styles.sidebar,
          { width: sidebarWidth, transform: [{ translateX: sidebarTranslate }] },
        ]}
      >
        <ScrollView
          style={styles.sidebarScroll}
          contentContainerStyle={styles.sidebarContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points</Text>
            <View style={styles.row}>
              <Text style={styles.infoText}>
                {points.length} / {maxPoints}
              </Text>
              <TextInput
                style={styles.numInput}
                value={String(maxPoints)}
                onChangeText={(t) => {
                  const n = Math.min(10, Math.max(5, parseInt(t, 10) || 5));
                  setMaxPoints(n);
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <TouchableOpacity style={styles.btnSecondary} onPress={clearPoints}>
              <Text style={styles.btnText}>Clear points</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {CATEGORIES.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={styles.checkRow}
                onPress={() => toggleCategory(key)}
              >
                <View
                  style={[
                    styles.checkbox,
                    categories[key] && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extract</Text>
            {loading && (
              <View style={styles.progressRow}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.progressText}>{progress}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.btnPrimary, (!canExtract || loading) && styles.btnDisabled]}
              onPress={extractData}
              disabled={!canExtract || loading}
            >
              <Text style={styles.btnText}>
                {points.length < maxPoints
                  ? `Add ${maxPoints - points.length} more`
                  : 'Extract OSM Data'}
              </Text>
            </TouchableOpacity>
          </View>

          {stats && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Area</Text>
                  <Text style={styles.statValue}>{stats.area} km²</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Features</Text>
                  <Text style={styles.statValue}>{stats.total}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Roads</Text>
                  <Text style={styles.statValue}>{stats.roads}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Buildings</Text>
                  <Text style={styles.statValue}>{stats.buildings}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>POIs</Text>
                  <Text style={styles.statValue}>{stats.pois}</Text>
                </View>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Export</Text>
                <TouchableOpacity
                  style={styles.btnSuccess}
                  onPress={shareGeoJSON}
                >
                  <Text style={styles.btnText}>Share GeoJSON</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSuccess} onPress={shareOSM}>
                  <Text style={styles.btnText}>Share OSM</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {sidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setSidebarOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  menuBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    right: 16,
    padding: 8,
  },
  hamburger: {
    width: 24,
    height: 20,
    justifyContent: 'space-between',
  },
  hamburgerOpen: {
    justifyContent: 'center',
  },
  hamLine: {
    height: 2,
    backgroundColor: '#e2e8f0',
    borderRadius: 1,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
    zIndex: 2,
    transform: [{ translateX: 360 }],
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarContent: {
    padding: 20,
    paddingTop: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  numInput: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 8,
    width: 48,
    color: '#e2e8f0',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#334155',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkLabel: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06b6d4',
  },
});
