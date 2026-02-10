# Privacy Policy — OSM Boundary Extractor

**Last updated:** February 3, 2025  
**App name:** OSM Boundary Extractor (osmextract-rn)  
**iOS bundle ID:** com.frf11.osmextractrn

---

## 1. Overview

OSM Boundary Extractor is a mobile app (React Native / Expo) that lets you draw a polygon on a map, fetch OpenStreetMap (OSM) data inside that area, and export it as GeoJSON or OSM XML. This policy describes what data the app uses and what we do not collect.

---

## 2. Data We Do Not Collect

- We **do not** create accounts or collect sign-in information.
- We **do not** collect your name, email, or any personally identifiable information (PII).
- We **do not** use analytics or tracking in this app.
- We **do not** sell or share your data with third parties for advertising or marketing.

---

## 3. Data Used by the App

### 3.1 Location (map display only)

- The app can show your **device location** on the map (e.g. “Show my location”).  
- Location is used only by the **device OS and the map provider** (Apple Maps on iOS, Google Maps on Android) to display your position.  
- We do not receive, store, or transmit your location to our own servers.

### 3.2 Map points and polygon

- The **points you tap** on the map (to define your polygon) exist only on your device in the app’s memory during your session.  
- They are not sent to us. They are only used to build a geographic query sent to the Overpass API (see below).

### 3.3 Overpass API (OpenStreetMap)

- To fetch map data, the app sends a **geographic bounding box** (coordinates) and **category choices** (e.g. roads, buildings) to public **Overpass API** servers (e.g. overpass-api.de).  
- This request does **not** include your identity, device ID, or location; it only describes the map area and data types you requested.  
- The Overpass API is a third-party service; its own practices are governed by the operators of those servers and by the [OpenStreetMap Foundation](https://osmfoundation.org/) and [ODbL](https://opendatacommons.org/licenses/odbl/) terms where applicable.

### 3.4 Exports (GeoJSON / OSM)

- Exported files (GeoJSON or OSM XML) are written to your **device’s app cache** and then shared via your **system share sheet** (e.g. Save to Files, email, other apps).  
- We do not receive or store these files. Where they go is entirely under your control.

### 3.5 Expo / EAS Updates

- The app may use **Expo EAS Update** to check for and download new versions.  
- That involves communication with Expo’s infrastructure (e.g. `u.expo.dev`). Expo’s own privacy policy applies to that service: [Expo Privacy Policy](https://expo.dev/privacy).

---

## 4. Third-Party Services

| Service            | Purpose                    | Your data involved                          |
|--------------------|----------------------------|---------------------------------------------|
| Apple Maps / MapKit| Map and location display   | Location (handled by Apple)                 |
| Google Maps        | Map display (Android)      | Location (handled by Google)                |
| Overpass API       | Fetch OSM data             | Bounding box + category (no identity)       |
| Expo (EAS Updates) | App updates                | Standard update checks (see Expo’s policy)  |

---

## 5. Data Storage and Retention

- No personal data is stored on our servers; we do not operate backend servers for this app.  
- Any temporary data (e.g. cache files for export) stays on your device and can be cleared by clearing the app’s cache or uninstalling the app.

---

## 6. Your Rights and Choices

- You can **deny location** when the app or OS asks; the app will still work, but the map may not show your position.  
- You control **what you export** and where you share it via the system share sheet.  
- If you have questions or want to request deletion of any data you believe we hold, contact us (see Section 8). We do not collect PII, but we will respond to reasonable requests.

---

## 7. Changes to This Policy

We may update this privacy policy from time to time. The “Last updated” date at the top will be revised when we do. Continued use of the app after changes constitutes acceptance of the updated policy. For significant changes, we may provide notice in the app or via the store listing if possible.

---

## 8. Contact

If you have questions about this privacy policy or the app’s data practices, please contact:

- **Placeholder:** Replace with your preferred contact (e.g. email or support URL).

---

## 9. Where to Find This Policy

This policy is available at:

**Privacy policy URL:** [Replace with your live URL – see below]

Use this same URL in your App Store and Google Play store listings, and in the app (e.g. in Settings or About) so users can open it in a browser.
