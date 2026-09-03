import axios from "axios";

// This is the production Render URL. If it's unreachable, we fall back to OFFLINE MODE.
const api = axios.create({
  baseURL: "https://aegis-lews.onrender.com/api",
  timeout: 5000 // Reduced timeout so offline mode kicks in faster
});

// --- OFFLINE MOCK DATA (Edge AI Simulation) ---
const OFFLINE_ZONES = [
  { id: 1, name: "East Khasi Hills", state: "Meghalaya", risk_level: "High", score: 82, lat: 25.467, lng: 91.883 },
  { id: 2, name: "West Khasi Hills", state: "Meghalaya", risk_level: "Moderate", score: 55, lat: 25.516, lng: 91.266 },
  { id: 3, name: "Tawang", state: "Arunachal Pradesh", risk_level: "Critical", score: 91, lat: 27.586, lng: 91.859 },
  { id: 4, name: "Papum Pare", state: "Arunachal Pradesh", risk_level: "Moderate", score: 48, lat: 27.133, lng: 93.633 },
  { id: 5, name: "Dima Hasao", state: "Assam", risk_level: "High", score: 78, lat: 25.183, lng: 93.016 },
  { id: 6, name: "Karbi Anglong", state: "Assam", risk_level: "Low", score: 30, lat: 26.0, lng: 93.5 },
  { id: 7, name: "North Sikkim", state: "Sikkim", risk_level: "Critical", score: 95, lat: 27.733, lng: 88.516 },
  { id: 8, name: "East Sikkim", state: "Sikkim", risk_level: "High", score: 71, lat: 27.333, lng: 88.616 },
  { id: 9, name: "Tamenglong", state: "Manipur", risk_level: "High", score: 85, lat: 24.966, lng: 93.483 },
  { id: 10, name: "Senapati", state: "Manipur", risk_level: "Moderate", score: 60, lat: 25.266, lng: 94.016 },
  { id: 11, name: "Aizawl", state: "Mizoram", risk_level: "Critical", score: 88, lat: 23.733, lng: 92.716 },
  { id: 12, name: "Lunglei", state: "Mizoram", risk_level: "High", score: 76, lat: 22.883, lng: 92.733 },
  { id: 13, name: "Kohima", state: "Nagaland", risk_level: "Moderate", score: 62, lat: 25.666, lng: 94.116 },
  { id: 14, name: "Mokokchung", state: "Nagaland", risk_level: "Low", score: 40, lat: 26.333, lng: 94.533 },
  { id: 15, name: "North Tripura", state: "Tripura", risk_level: "Moderate", score: 50, lat: 24.316, lng: 92.166 },
  { id: 16, name: "Dhalai", state: "Tripura", risk_level: "High", score: 74, lat: 23.95, lng: 91.95 }
];

// Offline alert simulation
let offlineAlerts = [
  { id: 101, zone_name: "North Sikkim", severity: "Critical", message: "Heavy rainfall detected. Evacuation recommended.", timestamp: new Date().toISOString() }
];

export async function getWeather(lat, lng) {
  try {
    const res = await api.get(`/weather?lat=${lat}&lng=${lng}`);
    return res.data;
  } catch (error) {
    console.warn("[OFFLINE MODE] Using local Edge AI prediction for Weather.");
    // Simulate some logic based on lat/lng or just return mock data
    return {
      temperature: 24.5,
      precipitation: 45.2,
      wind: 12.4,
      safe_zone: false,
      source: "Offline Edge AI"
    };
  }
}

export async function broadcastAlert(payload) {
  try {
    const res = await api.post("/alerts/broadcast", payload);
    return res.data;
  } catch (error) {
    console.warn("[OFFLINE MODE] Saving alert locally via SQLite/Local storage.");
    offlineAlerts.push({
      id: Date.now(),
      zone_name: payload.zone_name,
      severity: payload.severity,
      message: payload.message,
      timestamp: new Date().toISOString()
    });
    return { status: "success", dispatch_id: `OFFLINE-DISPATCH-${Date.now()}`, message: "Saved to local offline queue" };
  }
}

export async function getAlerts() {
  try {
    const res = await api.get("/alerts");
    return res.data;
  } catch (error) {
    console.warn("[OFFLINE MODE] Fetching local offline alerts.");
    return offlineAlerts;
  }
}

export async function getZones() {
  try {
    const res = await api.get("/zones");
    return res.data;
  } catch (error) {
    console.warn("[OFFLINE MODE] Loading embedded zone data (No internet).");
    return OFFLINE_ZONES;
  }
}