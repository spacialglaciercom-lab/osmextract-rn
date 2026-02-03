# OSM Boundary Extractor (React Native)

React Native / Expo version of the **OSM Pentagram Boundary Extractor**, compatible with **Expo Go** and using **Apple Maps (MapKit)** on iOS — including 3D map support when you tilt the map.

## Features

- **Map**: Apple Maps on iOS (MapKit, with 3D buildings/terrain when tilted), Google Maps on Android
- **Tap to add points**: Place 5–10 points on the map to define a polygon (pentagram/star style)
- **Extract OSM data**: Fetch roads, buildings, amenities, natural, land use, waterways via Overpass API
- **Summary**: Area (km²), feature counts (roads, buildings, POIs)
- **Export**: Share GeoJSON or CSV (via system share sheet)

## Requirements

- Node 18+
- Expo Go on your device (iOS or Android)
- iOS: Apple Maps (MapKit) is used by default; 3D is available when you pinch/tilt the map

## Run with Expo Go

```bash
cd osmextract-rn
npm install
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS).

- **iOS**: Uses Apple Maps (MapKit); supports 3D view when you tilt the map.
- **Android**: Uses Google Maps.

## Usage

1. Open the app and allow location if prompted.
2. Tap the **menu (hamburger)** to open the sidebar.
3. Set **number of points** (5–10) and choose **categories** to extract.
4. Tap the **map** to add points; add the full set (e.g. 5 for 5 points).
5. Tap **Extract OSM Data** to fetch OpenStreetMap data inside your polygon.
6. View the **summary** and use **Share GeoJSON** or **Share CSV** to export.

## Project structure

- `App.js` – Main screen: map, points, polygon, sidebar, extract, export
- `lib/geo.js` – Polygon/bbox/area helpers (Turf)
- `lib/overpass.js` – Overpass API query building and OSM processing
- `lib/export.js` – GeoJSON/CSV export helpers

## Original

Based on the web version in `C:\Users\drone\Downloads\osmextract-main` (Leaflet + Overpass API).
