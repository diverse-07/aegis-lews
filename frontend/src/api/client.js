import axios from "axios"

const api = axios.create({ 
  baseURL: "https://aegis-lews.onrender.com/api", 
  timeout: 10000 
})

export async function getWeather(lat, lng) {
  try { return (await api.get(`/weather?lat=${lat}&lng=${lng}`)).data }
  catch { return { temperature: 22.5, precipitation: 12.3, wind: 8.1, safe_zone: true, source: "Mock" } }
}
export async function broadcastAlert(payload) {
  try { return (await api.post("/alerts/broadcast", payload)).data }
  catch { return { status: "success", dispatch_id: "AEGIS-MOCK001", message: "Simulated dispatch" } }
}
export async function getAlerts() {
  try { return (await api.get("/alerts")).data }
  catch { return [] }
}
export async function getZones() {
  try { return (await api.get("/zones")).data }
  catch { return [] }
}