import React, { useState, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup } from "react-leaflet"
import { getWeather, broadcastAlert, getZones, getAlerts } from "./api/client"
import "./mobile.css"

// ÔöÇÔöÇÔöÇ DATA ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const ZONES = [
  { id:1, name:"Jaintia Hills", state:"Meghalaya", score:87, risk:"CRITICAL", coords:[[25.20,92.30],[25.00,92.00],[24.85,92.40],[25.05,92.70]], desc:"Active Disang shale thrust. NH-44 debris flow risk." },
  { id:2, name:"Sohra / Cherrapunji", state:"Meghalaya", score:74, risk:"HIGH", coords:[[25.40,91.60],[25.20,91.40],[25.10,91.70],[25.30,91.90]], desc:"World-record rainfall. Limestone escarpment failure." },
  { id:3, name:"Ri-Bhoi District", state:"Meghalaya", score:52, risk:"MODERATE", coords:[[26.00,91.70],[25.70,91.50],[25.60,92.00],[25.90,92.20]], desc:"Sub-Himalayan foothills. Seasonal soil slips." },
  { id:4, name:"Brahmaputra Valley", state:"Assam", score:18, risk:"SAFE", coords:[[26.50,91.20],[26.10,90.80],[25.95,92.00],[26.40,92.50]], desc:"Flat alluvial floodplain. Very low slope gradient." },
  { id:5, name:"Barak Valley", state:"Assam", score:32, risk:"LOW", coords:[[25.00,92.60],[24.70,92.30],[24.55,92.80],[24.80,93.10]], desc:"Rolling hills. Flash flood risk in peak monsoon." },
  { id:6, name:"North Sikkim", state:"Sikkim", score:83, risk:"CRITICAL", coords:[[28.00,88.40],[27.60,88.10],[27.40,88.50],[27.70,88.80]], desc:"Teesta MCT active fault. Glacial moraine instability." },
  { id:7, name:"South Sikkim", state:"Sikkim", score:55, risk:"MODERATE", coords:[[27.40,88.40],[27.10,88.20],[27.00,88.55],[27.25,88.75]], desc:"Namchi terraced ridges. Sandstone weathering." },
  { id:8, name:"Aizawl East", state:"Mizoram", score:71, risk:"HIGH", coords:[[23.85,92.60],[23.65,92.40],[23.55,92.80],[23.75,93.00]], desc:"Urban hill cutting. Saturated residential slopes." },
  { id:9, name:"Lunglei District", state:"Mizoram", score:48, risk:"MODERATE", coords:[[23.10,92.80],[22.75,92.60],[22.65,93.00],[22.95,93.20]], desc:"Longitudinal valley ridges. Moderate soil saturation." },
  { id:10, name:"Kohima District", state:"Nagaland", score:68, risk:"HIGH", coords:[[25.80,94.00],[25.55,93.75],[25.45,94.20],[25.65,94.45]], desc:"NH-29 corridor. Active slope cutting and subsidence." },
  { id:11, name:"Mon District", state:"Nagaland", score:29, risk:"LOW", coords:[[27.00,95.00],[26.60,94.75],[26.50,95.20],[26.80,95.45]], desc:"Forested gentle slopes. Low historical slide frequency." },
  { id:12, name:"Imphal East", state:"Manipur", score:15, risk:"SAFE", coords:[[24.95,93.90],[24.70,93.65],[24.60,94.05],[24.85,94.25]], desc:"Loktak basin floor. Flat stable alluvial terrain." },
  { id:13, name:"Senapati District", state:"Manipur", score:50, risk:"MODERATE", coords:[[25.40,93.90],[25.10,93.65],[24.95,94.10],[25.25,94.35]], desc:"Hill district terraced agriculture. Seasonal erosion." },
  { id:14, name:"Tawang District", state:"Arunachal Pradesh", score:81, risk:"CRITICAL", coords:[[27.75,91.95],[27.45,91.65],[27.30,92.05],[27.60,92.35]], desc:"High-altitude MCT zone. Permafrost degradation." },
  { id:15, name:"Itanagar", state:"Arunachal Pradesh", score:45, risk:"MODERATE", coords:[[27.20,93.65],[26.95,93.40],[26.85,93.80],[27.10,94.00]], desc:"Tertiary sandstone hills. Urban slope cutting." },
  { id:16, name:"Agartala Plains", state:"Tripura", score:12, risk:"SAFE", coords:[[23.95,91.20],[23.70,91.00],[23.60,91.40],[23.85,91.60]], desc:"Flat river basin. Very stable alluvial terrain." },
]

const SENSORS = [
  { id:"SNR-ML-001", name:"Jaintia Hills", status:"online", reading:"87% moisture -À 12mm/hr", lat:25.05, lng:92.12 },
  { id:"SNR-ML-002", name:"Sohra Station", status:"online", reading:"180mm / 24hr", lat:25.28, lng:91.72 },
  { id:"SNR-SK-004", name:"North Sikkim", status:"online", reading:"4.2mm displacement", lat:27.60, lng:88.45 },
  { id:"SNR-MZ-012", name:"Aizawl", status:"degraded", reading:"88% moisture", lat:23.73, lng:92.72 },
  { id:"SNR-NL-007", name:"Kohima", status:"online", reading:"76mm / 24hr", lat:25.67, lng:94.11 },
  { id:"SNR-AS-019", name:"Barak Valley", status:"online", reading:"River level: HIGH", lat:24.80, lng:92.75 },
  { id:"SNR-MN-003", name:"Senapati", status:"offline", reading:"Last reading: 2 hrs ago", lat:25.27, lng:94.02 },
  { id:"SNR-AR-008", name:"Tawang", status:"online", reading:"68mm/24hr -À -2-¦C", lat:27.59, lng:91.86 },
]

const LANGUAGES = [
  { code:"en", flag:"­ƒç«­ƒç¦", native:"English", english:"English" },
  { code:"hi", flag:"­ƒùú´©Å", native:"Óñ¦Óñ+ÓñéÓñªÓÑÇ", english:"Hindi" },
  { code:"as", flag:"­ƒîè", native:"ÓªàÓª©Óª«ÓºÇÓª»Óª+Óª¥", english:"Assamese" },
  { code:"bn", flag:"­ƒôû", native:"Óª¼Óª¥ÓªéÓª¦Óª¥", english:"Bengali" },
  { code:"mni", flag:"­ƒÅö´©Å", native:"Óª«ÓºêÓªñÓºêÓª¦ÓºïÓª¿Óºì", english:"Meitei" },
  { code:"ne", flag:"Ôø¦´©Å", native:"Óñ¿ÓÑçÓñ¬Óñ¥Óñ¦ÓÑÇ", english:"Nepali" },
]

const TRANSLATIONS = {
  en: {
    appTitle: "NER Landslide Early Warning System",
    dashboard: "Home",
    map: "Map",
    alerts: "Alerts",
    sensors: "Sensors",
    report: "Report",
    activeWarning: "ÔÜá´©Å Active Warning",
    warningText: "CRITICAL landslide risk ÔÇö Jaintia Hills, Meghalaya. 180mm/24hr. Evacuate 3 villages.",
    criticalZones: "Critical Zones",
    liveSensors: "Live Sensors",
    aiConfidence: "AI Confidence",
    checkSafety: "­ƒôì Check My Safety",
    checking: "­ƒôí Checking...",
    emergency: "­ƒÜ¿ Emergency Dispatch",
    rainfall: "Rainfall Simulator",
    submitReport: "Submit Report",
    analytics: "Analytics",
  },
  hi: {
    appTitle: "NER Óñ¡ÓÑéÓñ©ÓÑìÓñûÓñ¦Óñ¿ ÓñÜÓÑçÓññÓñ¥ÓñÁÓñ¿ÓÑÇ Óñ¬ÓÑìÓñ¦ÓñúÓñ¥Óñ¦ÓÑÇ",
    dashboard: "Óñ¦ÓÑïÓñ«",
    map: "Óñ¿ÓñòÓÑìÓñÂÓñ¥",
    alerts: "ÓñàÓñ¦Óñ¦ÓÑìÓñƒ",
    sensors: "Óñ©ÓÑçÓñéÓñ©Óñ¦",
    report: "Óñ¦Óñ+Óñ¬ÓÑïÓñ¦ÓÑìÓñƒ",
    activeWarning: "ÔÜá´©Å Óñ©ÓñòÓÑìÓñ¦Óñ+Óñ» ÓñÜÓÑçÓññÓñ¥ÓñÁÓñ¿ÓÑÇ",
    warningText: "ÓñùÓñéÓñ¡ÓÑÇÓñ¦ Óñ¡ÓÑéÓñ©ÓÑìÓñûÓñ¦Óñ¿ ÓñûÓññÓñ¦Óñ¥ ÔÇö Óñ£Óñ»ÓñéÓññÓñ+Óñ»Óñ¥ Óñ¦Óñ+Óñ¦ÓÑìÓñ©, Óñ«ÓÑçÓñÿÓñ¥Óñ¦Óñ»ÓÑñ 180Óñ«Óñ+Óñ«ÓÑÇ/24ÓñÿÓñéÓñƒÓÑçÓÑñ",
    criticalZones: "ÓñùÓñéÓñ¡ÓÑÇÓñ¦ ÓñòÓÑìÓñÀÓÑçÓññÓÑìÓñ¦",
    liveSensors: "Óñ¦Óñ¥ÓñçÓñÁ Óñ©ÓÑçÓñéÓñ©Óñ¦",
    aiConfidence: "AI ÓñÁÓñ+ÓñÂÓÑìÓñÁÓñ¥Óñ©",
    checkSafety: "­ƒôì Óñ«ÓÑçÓñ¦ÓÑÇ Óñ©ÓÑüÓñ¦ÓñòÓÑìÓñÀÓñ¥ Óñ£Óñ¥ÓñüÓñÜÓÑçÓñé",
    checking: "­ƒôí Óñ£Óñ¥ÓñüÓñÜ Óñ¦ÓÑï Óñ¦Óñ¦ÓÑÇ Óñ¦ÓÑê...",
    emergency: "­ƒÜ¿ ÓñåÓñ¬Óñ¥ÓññÓñòÓñ¥Óñ¦ÓÑÇÓñ¿",
    rainfall: "ÓñÁÓñ¦ÓÑìÓñÀÓñ¥ Óñ©Óñ+Óñ«ÓÑüÓñ¦ÓÑçÓñƒÓñ¦",
    submitReport: "Óñ¦Óñ+Óñ¬ÓÑïÓñ¦ÓÑìÓñƒ ÓñªÓñ¦ÓÑìÓñ£ ÓñòÓñ¦ÓÑçÓñé",
    analytics: "ÓñÁÓñ+ÓñÂÓÑìÓñ¦ÓÑçÓñÀÓñú",
  },
  as: {
    appTitle: "NER Óª¡ÓºéÓª«Óª+Óª©ÓºìÓªûÓª¦Óª¿ Óª©ÓªñÓº¦ÓºìÓªòÓªñÓª¥ Óª¬ÓºìÓº¦ÓªúÓª¥Óª¦ÓºÇ",
    dashboard: "Óª¦ÓºïÓª«",
    map: "Óª«Óª¥Óª¿ÓªÜÓª+ÓªñÓºìÓº¦",
    alerts: "Óª©ÓªñÓº¦ÓºìÓªòÓªñÓª¥",
    sensors: "ÓªÜÓºçÓª¿ÓºìÓª©Óº¦",
    report: "Óº¦Óª+Óª¬ÓºïÓº¦ÓºìÓªƒ",
    activeWarning: "ÔÜá´©Å Óª©ÓªòÓºìÓº¦Óª+Óª»Óª+ Óª©ÓªñÓº¦ÓºìÓªòÓªñÓª¥",
    warningText: "Óª£Óª»Óª+Óª¿ÓºìÓªñÓª+Óª»Óª+Óª¥ Óª¬Óª¥Óª¦Óª¥Óº¦Óªñ Óª¡ÓºéÓª«Óª+Óª©ÓºìÓªûÓª¦Óª¿Óº¦ Óª¼Óª+Óª¬ÓªªÓÑñ 180Óª«Óª+Óª«Óª+/Óº¿Óº¬ÓªÿÓªúÓºìÓªƒÓª¥ÓÑñ",
    criticalZones: "Óª©ÓªéÓªòÓªƒÓª£Óª¿Óªò ÓªàÓª×ÓºìÓªÜÓª¦",
    liveSensors: "Óª¦Óª¥ÓªçÓª¡ ÓªÜÓºçÓª¿ÓºìÓª©Óº¦",
    aiConfidence: "AI ÓªåÓª©ÓºìÓªÑÓª¥",
    checkSafety: "­ƒôì Óª«ÓºïÓº¦ Óª©ÓºüÓº¦ÓªòÓºìÓªÀÓª¥ Óª¬Óº¦ÓºÇÓªòÓºìÓªÀÓª¥",
    checking: "­ƒôí Óª¬Óº¦ÓºÇÓªòÓºìÓªÀÓª¥ Óª¦Óºê ÓªåÓªøÓºç...",
    emergency: "­ƒÜ¿ Óª£Óº¦ÓºüÓº¦ÓºÇ",
    rainfall: "Óª¼Óº¦ÓªÀÓºüÓªú ÓªÜÓª+Óª«ÓºüÓª¦ÓºçÓªƒÓº¦",
    submitReport: "Óº¦Óª+Óª¬ÓºïÓº¦ÓºìÓªƒ ÓªªÓª¥ÓªûÓª+Óª¦ ÓªòÓº¦Óªò",
    analytics: "Óª¼Óª+ÓªÂÓºìÓª¦ÓºçÓªÀÓªú",
  },
  bn: { appTitle: "NER Óª¡ÓºéÓª«Óª+ÓªºÓª© Óª©ÓªñÓª¦ÓºìÓªòÓªñÓª¥ Óª¼ÓºìÓª»Óª¼Óª©ÓºìÓªÑÓª¥", dashboard:"Óª¦ÓºïÓª«", map:"Óª«Óª¥Óª¿ÓªÜÓª+ÓªñÓºìÓª¦", alerts:"Óª©ÓªñÓª¦ÓºìÓªòÓªñÓª¥", sensors:"Óª©ÓºçÓª¿ÓºìÓª©Óª¦", report:"Óª¦Óª+Óª¬ÓºïÓª¦ÓºìÓªƒ", activeWarning:"ÔÜá´©Å Óª©ÓªòÓºìÓª¦Óª+Óª»Óª+ Óª©ÓªñÓª¦ÓºìÓªòÓªñÓª¥", warningText:"Óª£Óª»Óª+Óª¿ÓºìÓªñÓª+Óª»Óª+Óª¥ Óª¦Óª+Óª¦Óª©Óºç Óª¡ÓºéÓª«Óª+ÓªºÓª©ÓºçÓª¦ ÓªØÓºüÓªüÓªòÓª+ÓÑñ ÓººÓº«ÓºªÓª«Óª+Óª«Óª+/Óº¿Óº¬ÓªÿÓªúÓºìÓªƒÓª¥ÓÑñ", criticalZones:"Óª©ÓªéÓªòÓªƒÓª¥Óª¬Óª¿ÓºìÓª¿ ÓªÅÓª¦Óª¥ÓªòÓª¥", liveSensors:"Óª¦Óª¥ÓªçÓª¡ Óª©ÓºçÓª¿ÓºìÓª©Óª¦", aiConfidence:"AI ÓªåÓª©ÓºìÓªÑÓª¥", checkSafety:"­ƒôì ÓªåÓª«Óª¥Óª¦ Óª¿Óª+Óª¦Óª¥Óª¬ÓªñÓºìÓªñÓª¥ Óª¬Óª¦ÓºÇÓªòÓºìÓªÀÓª¥", checking:"­ƒôí Óª¬Óª¦ÓºÇÓªòÓºìÓªÀÓª¥ Óª¦ÓªÜÓºìÓªøÓºç...", emergency:"­ƒÜ¿ Óª£Óª¦ÓºüÓª¦Óª+", rainfall:"Óª¼ÓºâÓªÀÓºìÓªƒÓª+ Óª©Óª+Óª«ÓºüÓª¦ÓºçÓªƒÓª¦", submitReport:"Óª¦Óª+Óª¬ÓºïÓª¦ÓºìÓªƒ Óª£Óª«Óª¥ ÓªªÓª+Óª¿", analytics:"Óª¼Óª+ÓªÂÓºìÓª¦ÓºçÓªÀÓªú" },
  mni: { appTitle: "NER Óª¦ÓºîÓªÑÓºïÓªòÓª¬Óª¥ ÓªÂÓºçÓª«ÓªùÓºÄ Óª¬ÓºìÓº¦ÓªúÓª¥Óª¦ÓºÇ", dashboard:"Óª¦ÓºïÓª«", map:"Óª«ÓºçÓª¬", alerts:"ÓªàÓª¦Óª¦ÓºìÓªƒ", sensors:"Óª©ÓºçÓª¿ÓºìÓª©Óª¦", report:"Óª¦Óª+Óª¬ÓºïÓª¦ÓºìÓªƒ", activeWarning:"ÔÜá´©Å Óª©ÓªòÓºìÓª¦Óª+Óª»Óª+ ÓªÂÓºçÓª«ÓªùÓºÄ", warningText:"Óª£Óª»Óª+Óª¿ÓºìÓªñÓª+Óª»Óª+Óª¥ Óª¦Óª+Óª¦Óª©ÓªªÓª¥ Óª¦ÓºîÓªÑÓºïÓªòÓª¬Óª¥ Óª«ÓªÑÓºîÓÑñ", criticalZones:"ÓªòÓºâÓªñÓª+ÓªòÓºçÓª¦ Óª£ÓºïÓª¿", liveSensors:"Óª¦Óª¥ÓªçÓª¡ Óª©ÓºçÓª¿ÓºìÓª©Óª¦", aiConfidence:"AI ÓªòÓª¿Óª½Óª+ÓªíÓºçÓª¿ÓºìÓª©", checkSafety:"­ƒôì Óª¿ÓºüÓªÖÓª¥ÓªçÓª¼Óª¥ ÓªÜÓºçÓªò ÓªòÓª¦", checking:"­ƒôí ÓªÜÓºçÓªò Óª¦ÓªÜÓºìÓªøÓºç...", emergency:"­ƒÜ¿ ÓªçÓª«Óª¥Óª¦ÓºìÓª£ÓºçÓª¿ÓºìÓª©Óª+", rainfall:"Óª¦ÓºçÓªçÓª¿Óª½Óª¦ Óª©Óª+Óª«ÓºüÓª¦ÓºçÓªƒÓª¦", submitReport:"Óª¦Óª+Óª¬ÓºïÓª¦ÓºìÓªƒ ÓªªÓª¦ÓºìÓª£ ÓªòÓª¦", analytics:"ÓªàÓºìÓª»Óª¥Óª¿Óª¥Óª¦Óª+ÓªƒÓª+ÓªòÓºìÓª©" },
  ne: { appTitle: "NER Óñ¬Óñ¦Óñ+Óñ¦ÓÑï ÓñÜÓÑçÓññÓñ¥ÓñÁÓñ¿ÓÑÇ Óñ¬ÓÑìÓñ¦ÓñúÓñ¥Óñ¦ÓÑÇ", dashboard:"Óñ¦ÓÑïÓñ«", map:"Óñ¿ÓñòÓÑìÓñ©Óñ¥", alerts:"ÓñàÓñ¦Óñ¦ÓÑìÓñƒ", sensors:"Óñ©ÓÑçÓñ¿ÓÑìÓñ©Óñ¦", report:"Óñ¦Óñ+Óñ¬ÓÑïÓñ¦ÓÑìÓñƒ", activeWarning:"ÔÜá´©Å Óñ©ÓñòÓÑìÓñ¦Óñ+Óñ» ÓñÜÓÑçÓññÓñ¥ÓñÁÓñ¿ÓÑÇ", warningText:"Óñ£Óñ»Óñ¿ÓÑìÓññÓñ+Óñ»Óñ¥ Óñ¦Óñ+Óñ¦ÓÑìÓñ©Óñ«Óñ¥ Óñ¬Óñ¦Óñ+Óñ¦ÓÑïÓñòÓÑï ÓñûÓññÓñ¦Óñ¥ÓÑñ ÓÑºÓÑ«ÓÑªÓñ«Óñ+Óñ«Óñ+/ÓÑ¿ÓÑ¬ÓñÿÓñúÓÑìÓñƒÓñ¥ÓÑñ", criticalZones:"ÓñùÓñ«ÓÑìÓñ¡ÓÑÇÓñ¦ ÓñòÓÑìÓñÀÓÑçÓññÓÑìÓñ¦", liveSensors:"Óñ¦Óñ¥ÓñçÓñ¡ Óñ©ÓÑçÓñ¿ÓÑìÓñ©Óñ¦", aiConfidence:"AI ÓñÁÓñ+ÓñÂÓÑìÓñÁÓñ¥Óñ©", checkSafety:"­ƒôì Óñ«ÓÑçÓñ¦ÓÑï Óñ©ÓÑüÓñ¦ÓñòÓÑìÓñÀÓñ¥ Óñ£Óñ¥ÓñüÓñÜÓÑìÓñ¿ÓÑüÓñ©ÓÑì", checking:"­ƒôí Óñ£Óñ¥ÓñüÓñÜ Óñ¡ÓñçÓñ¦Óñ¦ÓÑçÓñòÓÑï Óñø...", emergency:"­ƒÜ¿ ÓñåÓñ¬ÓññÓñòÓñ¥Óñ¦", rainfall:"ÓñÁÓñ¦ÓÑìÓñÀÓñ¥ Óñ©Óñ+Óñ«ÓÑüÓñ¦ÓÑçÓñƒÓñ¦", submitReport:"Óñ¦Óñ+Óñ¬ÓÑïÓñ¦ÓÑìÓñƒ Óñ¬ÓÑçÓñÂ ÓñùÓñ¦ÓÑìÓñ¿ÓÑüÓñ©ÓÑì", analytics:"ÓñÁÓñ+ÓñÂÓÑìÓñ¦ÓÑçÓñÀÓñú" },
}

function getRiskClass(risk) {
  const r = risk?.toLowerCase()
  if (r === "critical") return "critical"
  if (r === "high") return "high"
  if (r === "moderate") return "moderate"
  if (r === "low") return "low"
  return "safe"
}

function getRiskColor(score) {
  if (score >= 80) return "#e74c3c"
  if (score >= 65) return "#e67e22"
  if (score >= 45) return "#f1c40f"
  if (score >= 25) return "#2ecc71"
  return "#27ae60"
}

// ÔöÇÔöÇÔöÇ SPLASH SCREEN ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function SplashScreen({ onEnter }) {
  const [selectedLang, setSelectedLang] = useState("en")

  const particles = Array.from({ length: 12 }, (_, i) => ({
    size: Math.random() * 60 + 20,
    left: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }))

  return (
    <div className="splash-screen">
      <div className="splash-particles">
        {particles.map((p, i) => (
          <div key={i} className="splash-particle" style={{
            width: p.size, height: p.size,
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>

      <div className="splash-logo-wrap">
        <div className="splash-logo-ring" />
        <div className="splash-logo-ring2" />
        <img src="/logo.jpg" alt="AEGIS" className="splash-logo" />
      </div>

      <div className="splash-badge">TEAM AEGIS -À SIH 2026</div>

      <h1 className="splash-title">
        NER <span>Landslide</span><br />
        Warning System
      </h1>
      <p className="splash-subtitle">
        AI-Based Early Warning &amp; Risk Monitoring<br />
        Ministry of Development of North Eastern Region
      </p>

      <p className="splash-lang-title">Select your language / ÓñàÓñ¬Óñ¿ÓÑÇ Óñ¡Óñ¥ÓñÀÓñ¥ ÓñÜÓÑüÓñ¿ÓÑçÓñé</p>

      <div className="splash-lang-grid">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            className={`lang-btn ${selectedLang === lang.code ? "selected" : ""}`}
            onClick={() => setSelectedLang(lang.code)}
          >
            <span className="lang-flag">{lang.flag}</span>
            <span className="lang-native">{lang.native}</span>
            <span className="lang-english">{lang.english}</span>
          </button>
        ))}
      </div>

      <button className="splash-enter-btn" onClick={() => onEnter(selectedLang)}>
        <span>Enter App</span>
        <span>ÔåÆ</span>
      </button>

      <div className="splash-footer">
        Government of India -À MDoNER -À NDMA<br />
        NER-LEWS v2.0 -À Problem ID: SIH26001
      </div>
    </div>
  )
}

// ÔöÇÔöÇÔöÇ DASHBOARD TAB ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function DashboardTab({ t, lang }) {
  const [liveSoil, setLiveSoil] = useState(87)
  const [liveDisp, setLiveDisp] = useState(4.2)
  const [liveRain, setLiveRain] = useState(12)
  const [locLoading, setLocLoading] = useState(false)
  const [safetyResult, setSafetyResult] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [checks, setChecks] = useState({ sms: true, ndrf: true, highway: false, medical: true, push: true })
  const [toastMsg, setToastMsg] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSoil(v => Math.min(99, Math.max(60, v + (Math.random() - 0.45) * 2)))
      setLiveDisp(v => Math.min(8, Math.max(0.5, v + (Math.random() - 0.4) * 0.3)))
      setLiveRain(v => Math.min(25, Math.max(5, v + (Math.random() - 0.45) * 1.5)))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }

  const handleCheckSafety = async () => {
    setLocLoading(true)
    setSafetyResult(null)
    const process = async (lat, lng) => {
      const w = await getWeather(lat, lng)
      const dist = z => Math.sqrt((z.coords[0][0] - lat) ** 2 + (z.coords[0][1] - lng) ** 2)
      const nearest = ZONES.reduce((a, b) => dist(a) < dist(b) ? a : b)
      const rain = w.precipitation || 0
      const simScore = Math.min(Math.round(nearest.score * (rain > 30 ? 1.2 : rain > 15 ? 1.1 : 1.0)), 99)
      const status = simScore >= 80 ? "critical" : simScore >= 45 ? "caution" : "safe"
      setSafetyResult({
        status, score: simScore, zone: nearest.name,
        rain: rain.toFixed(1), temp: (w.temperature || 22).toFixed(1), wind: (w.wind || 8).toFixed(1),
        message: status === "critical"
          ? "Evacuate immediately. High slope failure probability."
          : status === "caution"
          ? "Stay alert. Avoid hillside roads and streams."
          : "Terrain is stable. Continue monitoring weather updates.",
        icon: status === "critical" ? "­ƒÜ¿" : status === "caution" ? "ÔÜá´©Å" : "Ô£à"
      })
      setLocLoading(false)
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => process(p.coords.latitude, p.coords.longitude),
        () => process(26.1445, 91.7362)
      )
    } else {
      process(26.1445, 91.7362)
    }
  }

  const handleEmergency = async () => {
    const channels = Object.entries(checks).filter(([, v]) => v).map(([k]) => k)
    const res = await broadcastAlert({ zone_name: "Jaintia Hills", severity: "CRITICAL", message: "Evacuate immediately.", channels })
    setShowModal(false)
    showToast("Ô£à Emergency dispatched -À ID: " + (res.dispatch_id || "AEGIS-EXEC"))
  }

  return (
    <div>
      {/* Warning Banner */}
      <div className="warning-banner">
        <div className="warning-banner-icon">­ƒÜ¿</div>
        <div className="warning-banner-text">
          <strong>{t.activeWarning}</strong>
          <span>{t.warningText}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card red">
          <div className="stat-label">{t.criticalZones}</div>
          <div className="stat-value">4</div>
          <div className="stat-sub">Ôåæ 2 since yesterday</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">{t.liveSensors}</div>
          <div className="stat-value">6/8</div>
          <div className="stat-sub">1 offline -À 1 degraded</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">{t.aiConfidence}</div>
          <div className="stat-value">87%</div>
          <div className="stat-sub">Model v2.4 -À GPT-SI</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-label">Population at Risk</div>
          <div className="stat-value">4.2L</div>
          <div className="stat-sub">3 evacuation zones</div>
        </div>
      </div>

      {/* Live Gauges */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-icon">­ƒôí</span> Live Sensor Feed</div>
          <span style={{ fontSize: 11, color: "#27ae60" }}>ÔùÅ LIVE</span>
        </div>
        <div className="card-body">
          <div className="gauge-row">
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">­ƒÆº Soil Moisture</span>
                <span className="gauge-value" style={{ color: liveSoil > 80 ? "#e74c3c" : "#f1c40f" }}>{liveSoil.toFixed(0)}%</span>
              </div>
              <div className="gauge-bar-bg">
                <div className="gauge-bar-fill" style={{ width: `${liveSoil}%`, background: liveSoil > 80 ? "#e74c3c" : "#f1c40f" }} />
              </div>
            </div>
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">­ƒôÅ Ground Displacement</span>
                <span className="gauge-value" style={{ color: liveDisp > 5 ? "#e74c3c" : "#e67e22" }}>{liveDisp.toFixed(1)} mm</span>
              </div>
              <div className="gauge-bar-bg">
                <div className="gauge-bar-fill" style={{ width: `${(liveDisp / 8) * 100}%`, background: liveDisp > 5 ? "#e74c3c" : "#e67e22" }} />
              </div>
            </div>
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">­ƒîº´©Å Rainfall Intensity</span>
                <span className="gauge-value">{liveRain.toFixed(1)} mm/hr</span>
              </div>
              <div className="gauge-bar-bg">
                <div className="gauge-bar-fill" style={{ width: `${(liveRain / 25) * 100}%`, background: "#2980b9" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Check */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-icon">­ƒøí´©Å</span> Personal Safety Check</div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
            Uses your GPS location to check nearby zone risk and real-time weather.
          </p>
          <button className="btn btn-primary" onClick={handleCheckSafety} disabled={locLoading}>
            {locLoading ? t.checking : t.checkSafety}
          </button>

          {safetyResult && (
            <div className={`safety-card ${safetyResult.status}`}>
              <div className="safety-icon">{safetyResult.icon}</div>
              <div className="safety-status" style={{ color: safetyResult.status === "critical" ? "#ff6b6b" : safetyResult.status === "caution" ? "#f39c12" : "#2ecc71" }}>
                {safetyResult.status.toUpperCase()} ÔÇö Score: {safetyResult.score}
              </div>
              <div className="safety-message">{safetyResult.zone} ÔÇö {safetyResult.message}</div>
              <div className="safety-stats">
                <div className="safety-stat">
                  <div className="safety-stat-value">­ƒîº´©Å {safetyResult.rain}mm</div>
                  <div className="safety-stat-label">Rainfall</div>
                </div>
                <div className="safety-stat">
                  <div className="safety-stat-value">­ƒîí´©Å {safetyResult.temp}-¦C</div>
                  <div className="safety-stat-label">Temp</div>
                </div>
                <div className="safety-stat">
                  <div className="safety-stat-value">­ƒÆ¿ {safetyResult.wind}m/s</div>
                  <div className="safety-stat-label">Wind</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency */}
      <button className="btn btn-danger" onClick={() => setShowModal(true)}>
        {t.emergency}
      </button>

      {/* Emergency Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">­ƒÜ¿ Emergency Dispatch</div>
            <div className="modal-subtitle">Select channels to notify. This will be broadcast immediately.</div>

            {[
              { key: "sms", icon: "­ƒô¦", label: "Send SMS to Zone Population" },
              { key: "ndrf", icon: "­ƒ¬û", label: "Notify NDRF & SDRF Teams" },
              { key: "highway", icon: "­ƒÜº", label: "Close NH-44 Highway Access" },
              { key: "medical", icon: "­ƒÅÑ", label: "Alert Medical Facilities" },
              { key: "push", icon: "­ƒöö", label: "Mobile Push Alert & Siren" },
            ].map(({ key, icon, label }) => (
              <div className="checkbox-row" key={key}>
                <span className="checkbox-icon">{icon}</span>
                <span className="checkbox-label">{label}</span>
                <div className={`toggle ${checks[key] ? "on" : "off"}`} onClick={() => setChecks(c => ({ ...c, [key]: !c[key] }))}>
                  <div className="toggle-knob" />
                </div>
              </div>
            ))}

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn btn-danger" onClick={handleEmergency}>­ƒÜ¿ BROADCAST EMERGENCY</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">Ô£à {toastMsg}</div>}
    </div>
  )
}

// ÔöÇÔöÇÔöÇ MAP TAB ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function MapTab({ t }) {
  const [mapType, setMapType] = useState("terrain")
  const [selectedZone, setSelectedZone] = useState(null)

  const sorted = [...ZONES].sort((a, b) => b.score - a.score)

  return (
    <div>
      <div className="page-title">Risk Map</div>
      <p className="page-subtitle">North Eastern Region -À 16 monitored zones</p>

      {/* Map */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div className="card-title">­ƒù¦´©Å Live Risk Map</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className={`btn btn-outline btn-sm ${mapType === "terrain" ? "active" : ""}`}
              style={mapType === "terrain" ? { borderColor: "var(--gold)", color: "var(--gold)" } : {}}
              onClick={() => setMapType("terrain")}>Terrain</button>
            <button className={`btn btn-outline btn-sm ${mapType === "satellite" ? "active" : ""}`}
              style={mapType === "satellite" ? { borderColor: "var(--gold)", color: "var(--gold)" } : {}}
              onClick={() => setMapType("satellite")}>Satellite</button>
          </div>
        </div>
        <div style={{ height: 260 }}>
          <MapContainer
            center={[25.5, 92.8]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
            maxBounds={[[6.0, 68.0], [38.0, 98.0]]}
            maxBoundsViscosity={1.0}
          >
            {mapType === "terrain" ? (
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
            ) : (
              <>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
              </>
            )}
            {ZONES.map(z => (
              <Polygon
                key={z.id}
                positions={z.coords}
                pathOptions={{ color: getRiskColor(z.score), fillColor: getRiskColor(z.score), fillOpacity: 0.45, weight: 2 }}
              >
                <Popup><strong>{z.name}</strong><br />{z.state}<br />Risk: {z.risk} ({z.score}%)<br />{z.desc}</Popup>
              </Polygon>
            ))}
            {SENSORS.map(s => (
              <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={6}
                pathOptions={{ color: s.status === "online" ? "#27ae60" : s.status === "degraded" ? "#e67e22" : "#e74c3c", fillColor: s.status === "online" ? "#27ae60" : s.status === "degraded" ? "#e67e22" : "#e74c3c", fillOpacity: 0.9, weight: 2 }}>
                <Popup>{s.id}<br />{s.name}<br />Status: {s.status}<br />{s.reading}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div style={{ padding: "10px 14px", display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
          {[["#e74c3c","Critical"],["#e67e22","High"],["#f1c40f","Moderate"],["#2ecc71","Low"],["#27ae60","Safe"]].map(([c, l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Zone List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">­ƒôï All Zones</div>
        </div>
        <div className="card-body" style={{ padding: "0 16px" }}>
          {sorted.map(z => (
            <div className="zone-item" key={z.id} onClick={() => setSelectedZone(selectedZone?.id === z.id ? null : z)}>
              <div className="zone-color-dot" style={{ background: getRiskColor(z.score) }} />
              <div className="zone-info">
                <div className="zone-name">{z.name}</div>
                <div className="zone-state">{z.state}</div>
                {selectedZone?.id === z.id && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.4 }}>{z.desc}</div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div className="zone-score" style={{ color: getRiskColor(z.score), fontSize: 18 }}>{z.score}</div>
                <span className={`risk-pill ${getRiskClass(z.risk)}`}>{z.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ÔöÇÔöÇÔöÇ ALERTS TAB ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function AlertsTab({ t }) {
  const [filter, setFilter] = useState("ALL")

  const alerts = [
    { id:1, zone:"Jaintia Hills, Meghalaya", severity:"CRITICAL", message:"180mm/24hr recorded. Debris flow imminent. 3 villages under evacuation order.", time:"12 mins ago", confidence: 87 },
    { id:2, zone:"North Sikkim", severity:"CRITICAL", message:"Glacial lake outburst risk elevated. MCT fault activity detected.", time:"45 mins ago", confidence: 91 },
    { id:3, zone:"Tawang District, Arunachal Pradesh", severity:"CRITICAL", message:"Permafrost degradation accelerating. Road NH-13 closure advisory.", time:"2 hrs ago", confidence: 83 },
    { id:4, zone:"Aizawl East, Mizoram", severity:"HIGH", message:"Urban slope saturation at 88%. Residential zone monitoring active.", time:"3 hrs ago", confidence: 76 },
    { id:5, zone:"Kohima District, Nagaland", severity:"HIGH", message:"NH-29 corridor slope displacement: 3.1mm. Monitoring elevated.", time:"5 hrs ago", confidence: 71 },
    { id:6, zone:"Sohra / Cherrapunji", severity:"HIGH", message:"Sustained heavy rainfall. Limestone escarpment at risk.", time:"6 hrs ago", confidence: 74 },
    { id:7, zone:"Senapati District, Manipur", severity:"MODERATE", message:"Sensor offline. Last reading showed elevated soil moisture.", time:"8 hrs ago", confidence: 55 },
  ]

  const severities = ["ALL", "CRITICAL", "HIGH", "MODERATE"]
  const filtered = filter === "ALL" ? alerts : alerts.filter(a => a.severity === filter)

  return (
    <div>
      <div className="page-title">Active Alerts</div>
      <p className="page-subtitle">AI-generated -À Real-time monitoring</p>

      <div className="scroll-row" style={{ marginBottom: 14 }}>
        {severities.map(s => (
          <button key={s} className={`scroll-chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s === "CRITICAL" ? "­ƒö¦ " : s === "HIGH" ? "­ƒƒá " : s === "MODERATE" ? "­ƒƒí " : ""}{s}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {filtered.map(a => (
            <div className="alert-item" key={a.id}>
              <div className={`alert-severity-bar ${a.severity.toLowerCase()}`} />
              <div className="alert-content">
                <div className="alert-zone">{a.zone}</div>
                <div className="alert-message">{a.message}</div>
                <div className="alert-meta">
                  <span className={`risk-pill ${getRiskClass(a.severity)}`} style={{ fontSize: 10, padding: "2px 8px" }}>{a.severity}</span>
                  <span>AI: {a.confidence}%</span>
                  <span>{a.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ÔöÇÔöÇÔöÇ SENSORS TAB ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function SensorsTab({ t }) {
  const [filter, setFilter] = useState("ALL")
  const filters = ["ALL", "online", "degraded", "offline"]
  const filtered = filter === "ALL" ? SENSORS : SENSORS.filter(s => s.status === filter)

  return (
    <div>
      <div className="page-title">Sensor Network</div>
      <p className="page-subtitle">8 stations across NER</p>

      {/* Summary row */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card green">
          <div className="stat-label">Online</div>
          <div className="stat-value">6</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Degraded</div>
          <div className="stat-value">1</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Offline</div>
          <div className="stat-value">1</div>
        </div>
      </div>

      <div className="scroll-row" style={{ marginBottom: 14 }}>
        {filters.map(f => (
          <button key={f} className={`scroll-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {filtered.map(s => (
            <div className="sensor-item" key={s.id}>
              <div className={`sensor-status-dot ${s.status}`} />
              <div className="sensor-info">
                <div className="sensor-name">{s.id} -À {s.name}</div>
                <div className="sensor-reading">{s.reading}</div>
              </div>
              <div className={`sensor-status-label ${s.status}`}>{s.status.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ÔöÇÔöÇÔöÇ REPORT TAB ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function ReportTab({ t }) {
  const [reports, setReports] = useState([
    { id:1, type:"Crack", loc:"Dawki Road, Meghalaya", desc:"Large cracks appeared after rainfall.", time:"2 hrs ago", status:"pending" },
    { id:2, type:"Subsidence", loc:"Kohima Bypass, Nagaland", desc:"30cm dip in road surface.", time:"5 hrs ago", status:"verified" },
    { id:3, type:"Debris", loc:"Senapati, Manipur", desc:"Small debris flow blocked irrigation channel.", time:"Yesterday", status:"verified" },
  ])
  const [type, setType] = useState("crack")
  const [loc, setLoc] = useState("")
  const [desc, setDesc] = useState("")
  const [toast, setToast] = useState("")

  const submit = (e) => {
    e.preventDefault()
    if (!loc.trim()) { setToast("ÔÜá´©Å Please enter a location"); setTimeout(() => setToast(""), 3000); return }
    setReports(r => [{ id: Date.now(), type: type, loc, desc: desc || "Reported by citizen.", time: "Just now", status: "pending" }, ...r])
    setLoc(""); setDesc("")
    setToast("Ô£à Report submitted. Field team notified.")
    setTimeout(() => setToast(""), 3500)
  }

  return (
    <div>
      <div className="page-title">Citizen Reports</div>
      <p className="page-subtitle">Report suspicious ground activity</p>

      <div className="card">
        <div className="card-header">
          <div className="card-title">­ƒôØ New Report</div>
        </div>
        <div className="card-body">
          <form onSubmit={submit}>
            <div className="form-field">
              <label className="form-label">Incident Type</label>
              <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                <option value="crack">Ground Crack / Fissure</option>
                <option value="subsidence">Road Subsidence</option>
                <option value="debris">Debris Flow / Mudslide</option>
                <option value="seepage">Water Seepage</option>
                <option value="tree_fall">Unusual Tree Tilt</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="e.g. Dawki Road, Jowai, Meghalaya" value={loc} onChange={e => setLoc(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-input" rows={3} style={{ resize: "none" }} placeholder="Describe what you observed..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">{t.submitReport}</button>
          </form>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Recent Reports</div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {reports.map(r => (
            <div className="alert-item" key={r.id}>
              <div className={`alert-severity-bar ${r.status === "verified" ? "moderate" : "high"}`} />
              <div className="alert-content">
                <div className="alert-zone">{r.type.toUpperCase()}: {r.loc}</div>
                <div className="alert-message">{r.desc}</div>
                <div className="alert-meta">
                  <span className={`risk-pill ${r.status === "verified" ? "low" : "moderate"}`}>{r.status}</span>
                  <span>{r.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ÔöÇÔöÇÔöÇ MAIN APP ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export default function AppMobile() {
  const [showSplash, setShowSplash] = useState(true)
  const [lang, setLang] = useState("en")
  const [activeTab, setActiveTab] = useState("home")
  const [istTime, setIstTime] = useState("")

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en

  useEffect(() => {
    const update = () => setIstTime(new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", hour12: false,
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleEnter = (selectedLang) => {
    setLang(selectedLang)
    setShowSplash(false)
  }

  const NAV_ITEMS = [
    { id: "home", icon: "­ƒÅá", label: t.dashboard },
    { id: "map", icon: "­ƒù¦´©Å", label: t.map },
    { id: "alerts", icon: "­ƒöö", label: t.alerts, badge: 7 },
    { id: "sensors", icon: "­ƒôí", label: t.sensors },
    { id: "report", icon: "­ƒôØ", label: t.report },
  ]

  if (showSplash) return <SplashScreen onEnter={handleEnter} />

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="app-header">
        <img src="/logo.jpg" alt="AEGIS" className="app-header-logo" />
        <div className="app-header-text">
          <div className="app-header-title">NER-LEWS</div>
          <div className="app-header-sub">MDoNER -À Govt. of India</div>
        </div>
        <span className="app-header-badge">AEGIS</span>
        <div className="app-header-live">
          <div className="live-dot" />
          <span className="live-label">{istTime}</span>
        </div>
      </div>

      {/* Content */}
      <div className="app-content">
        {activeTab === "home" && <DashboardTab t={t} lang={lang} />}
        {activeTab === "map" && <MapTab t={t} />}
        {activeTab === "alerts" && <AlertsTab t={t} />}
        {activeTab === "sensors" && <SensorsTab t={t} />}
        {activeTab === "report" && <ReportTab t={t} />}
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.badge && <span className="nav-badge">{item.badge}</span>}
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

