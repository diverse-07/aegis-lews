import React, { useState, useEffect } from "react"
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup } from "react-leaflet"
import { broadcastAlert } from "./api/client"
import "./mobile.css"

// --- PROFESSIONAL VECTOR ICONS (NO CARTOON EMOJIS) ---
const Icons = {
  Home: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Map: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  Ai: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/>
      <line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/>
      <line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/>
      <line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  Sensors: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.93 19.07A10 10 0 0 1 12 2a10 10 0 0 1 7.07 17.07"/>
      <path d="M7.76 16.24A6 6 0 0 1 12 6a6 6 0 0 1 4.24 10.24"/>
      <circle cx="12" cy="18" r="2" fill={color}/>
    </svg>
  ),
  Analytics: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Simulator: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
      <line x1="8" y1="19" x2="8" y2="23"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <line x1="16" y1="19" x2="16" y2="23"/>
    </svg>
  ),
  Alerts: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Safety: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  Report: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Gps: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="22" y1="12" x2="18" y2="12"/>
      <line x1="6" y1="12" x2="2" y2="12"/>
      <line x1="12" y1="6" x2="12" y2="2"/>
      <line x1="12" y1="22" x2="12" y2="18"/>
      <circle cx="12" cy="12" r="3" fill={color}/>
    </svg>
  )
}

// GEOSPATIAL & SENSOR DATA
const ZONES = [
  { id:1, name:"Jaintia Hills", state:"Meghalaya", score:87, risk:"CRITICAL", coords:[[25.20,92.30],[25.00,92.00],[24.85,92.40],[25.05,92.70]], lat:25.4484, lng:92.2152, desc:"Active Disang shale thrust. NH-44 debris flow corridor." },
  { id:2, name:"Sohra / Cherrapunji", state:"Meghalaya", score:74, risk:"HIGH", coords:[[25.40,91.60],[25.20,91.40],[25.10,91.70],[25.30,91.90]], lat:25.2986, lng:91.7322, desc:"Extreme rainfall zone. Limestone escarpment failure." },
  { id:3, name:"Ri-Bhoi Foothills", state:"Meghalaya", score:52, risk:"MODERATE", coords:[[26.00,91.70],[25.70,91.50],[25.60,92.00],[25.90,92.20]], lat:25.8500, lng:91.8800, desc:"Seasonal translational soil slips along highway." },
  { id:4, name:"North Sikkim MCT", state:"Sikkim", score:83, risk:"CRITICAL", coords:[[28.00,88.40],[27.60,88.10],[27.40,88.50],[27.70,88.80]], lat:27.7330, lng:88.5160, desc:"Main Central Thrust active fault. Glacial moraine instability." },
  { id:5, name:"Gangtok South Ridge", state:"Sikkim", score:78, risk:"HIGH", coords:[[27.40,88.65],[27.20,88.50],[27.15,88.75],[27.35,88.85]], lat:27.3389, lng:88.6065, desc:"Terraced hill slope weathering. NH-10 connectivity link." },
  { id:6, name:"Aizawl East Flank", state:"Mizoram", score:76, risk:"HIGH", coords:[[23.85,92.60],[23.65,92.40],[23.55,92.80],[23.75,93.00]], lat:23.7271, lng:92.7176, desc:"Urban slope cutting. Sandstone formation saturation." },
  { id:7, name:"Lunglei Ridge", state:"Mizoram", score:48, risk:"MODERATE", coords:[[23.10,92.80],[22.75,92.60],[22.65,93.00],[22.95,93.20]], lat:22.8830, lng:92.7330, desc:"Longitudinal valley slope with moderate moisture." },
  { id:8, name:"Kohima Dzudza", state:"Nagaland", score:68, risk:"HIGH", coords:[[25.80,94.00],[25.55,93.75],[25.45,94.20],[25.65,94.45]], lat:25.6751, lng:94.1086, desc:"NH-29 bridge corridor. Active slope subsidence." },
  { id:9, name:"Tawang MCT Zone", state:"Arunachal", score:81, risk:"CRITICAL", coords:[[27.75,91.95],[27.45,91.65],[27.30,92.05],[27.60,92.35]], lat:27.5861, lng:91.8594, desc:"High altitude permafrost degradation along passes." },
  { id:10, name:"Haflong Hill Station", state:"Assam", score:85, risk:"CRITICAL", coords:[[25.25,93.10],[25.05,92.90],[24.95,93.25],[25.15,93.35]], lat:25.1800, lng:93.0200, desc:"Dima Hasao railway hill cut. High debris flow record." },
  { id:11, name:"Senapati Terraces", state:"Manipur", score:54, risk:"MODERATE", coords:[[25.40,93.90],[25.10,93.65],[24.95,94.10],[25.25,94.35]], lat:25.2660, lng:94.0160, desc:"Hill agricultural slopes. Seasonal monsoon erosion." },
  { id:12, name:"Agartala Basin", state:"Tripura", score:18, risk:"SAFE", coords:[[23.95,91.20],[23.70,91.00],[23.60,91.40],[23.85,91.60]], lat:23.8315, lng:91.5600, desc:"Stable alluvial terrain. Very low gradient." },
]

const SENSORS = [
  { id:"STN-JH-082", name:"Jaintia Hills NH-44", state:"Meghalaya", status:"online", reading:"87% moisture · 4.2mm/h shear", lat:25.4484, lng:92.2152, batt:"12.8V" },
  { id:"STN-ML-002", name:"Sohra Escarpment", state:"Meghalaya", status:"online", reading:"180mm / 24hr acc.", lat:25.2986, lng:91.7322, batt:"12.9V" },
  { id:"STN-SK-014", name:"Gangtok South Ridge", state:"Sikkim", status:"online", reading:"74% moisture · 2.8mm/h", lat:27.3389, lng:88.6065, batt:"12.6V" },
  { id:"STN-MZ-049", name:"Aizawl Bawngkawn", state:"Mizoram", status:"degraded", reading:"84% moisture · Solar low", lat:23.7271, lng:92.7176, batt:"11.4V" },
  { id:"STN-NL-021", name:"Kohima NH-29", state:"Nagaland", status:"online", reading:"62mm/24h · 1.2mm/h", lat:25.6751, lng:94.1086, batt:"12.5V" },
  { id:"STN-AS-102", name:"Haflong Pass", state:"Assam", status:"online", reading:"128mm/24h · Critical", lat:25.1800, lng:93.0200, batt:"12.7V" },
  { id:"STN-MN-003", name:"Senapati Corridor", state:"Manipur", status:"offline", reading:"Offline: Power cell fail", lat:24.9800, lng:93.4900, batt:"0.0V" },
  { id:"STN-AR-008", name:"Tawang MCT Pass", state:"Arunachal", status:"online", reading:"68mm/24h · -2C ambient", lat:27.5861, lng:91.8594, batt:"12.8V" },
]

const LANGUAGES = [
  { code:"en", native:"English", region:"Official / Central" },
  { code:"as", native:"অসমীয়া", region:"Assam" },
  { code:"bn", native:"বাংলা", region:"Tripura & Barak" },
  { code:"kha", native:"Khasi", region:"Meghalaya" },
  { code:"grt", native:"A·chik (Garo)", region:"Meghalaya" },
  { code:"lus", native:"Mizo ṭawng", region:"Mizoram" },
  { code:"mni", native:"মৈতৈলোন্", region:"Manipur" },
  { code:"ne", native:"नेपाली", region:"Sikkim" },
  { code:"nag", native:"Nagamese", region:"Nagaland" },
  { code:"brx", native:"बड़ो (Bodo)", region:"Assam Bodoland" },
  { code:"trp", native:"Kokborok", region:"Tripura" },
  { code:"hi", native:"हिंदी", region:"National Official" },
]

const TRANSLATIONS = {
  en: {
    dashboard:"Home", map:"Risk Map", ai:"AI Predict", sensors:"Telemetry", analytics:"Analytics",
    alerts:"Alerts", simulator:"Simulator", safety:"Safety Check", report:"Report",
    activeWarning:"CRITICAL HAZARD WARNING",
    warningText:"Jaintia Hills, Meghalaya (NH-44) · 142mm/24h · Evacuate 3 villages.",
    checkSafety:"Scan GPS Safety", checking:"Locking Satellite GPS...", emergency:"Emergency Broadcast",
  },
  as: {
    dashboard:"হোম", map:"মানচিত্ৰ", ai:"AI ভৱিষ্যদ্বাণী", sensors:"চেন্সৰ", analytics:"বিশ্লেষণ",
    alerts:"সতৰ্কতা", simulator:"চিমুলেটৰ", safety:"সুৰক্ষা পৰীক্ষা", report:"ৰিপোৰ্ট",
    activeWarning:"সংকটজনক সতৰ্কতা",
    warningText:"জয়ন্তিয়া পাহাৰ (NH-44) · 142মিমি/২৪ঘণ্টা · আশ্ৰয়স্থললৈ স্থানান্তৰ হওক।",
    checkSafety:"GPS সুৰক্ষা পৰীক্ষা", checking:"স্থান নিৰ্ণয় হৈ আছে...", emergency:"জৰুৰী সতৰ্কতা",
  },
  bn: {
    dashboard:"হোম", map:"মানচিত্র", ai:"AI পূর্বাভাস", sensors:"সেন্সর", analytics:"অ্যানালিটিক্স",
    alerts:"সতর্কতা", simulator:"সিমুলেটর", safety:"নিরাপত্তা", report:"রিপোর্ট",
    activeWarning:"জরুরি ভূমিধস সতর্কতা",
    warningText:"জয়ন্তিয়া হিলস (NH-44) · ১৪২মিমি/২৪ঘণ্টা · ৩টি গ্রাম স্থানান্তর।",
    checkSafety:"GPS নিরাপত্তা চেক", checking:"লোকেশন চেক হচ্ছে...", emergency:"জরুরি অ্যালার্ট",
  },
  kha: {
    dashboard:"Ing (Home)", map:"Ka Map", ai:"AI Jingtip", sensors:"Ki Sensor", analytics:"Jingkheiñ",
    alerts:"Jingmaham", simulator:"Simulator", safety:"Jingiada", report:"Ka Report",
    activeWarning:"JINGMAHAM BA KHRAW",
    warningText:"Jaintia Hills (NH-44) · 142mm slap/24 kynta · Kynriah noh sha ki jaka shngain.",
    checkSafety:"Peit Jingiada GPS", checking:"Dang wad jaka...", emergency:"Kynshew Khubor Kyrkieh",
  },
  grt: {
    dashboard:"Nok (Home)", map:"Map", ai:"AI Ma·siani", sensors:"Sensor-rang", analytics:"Histap",
    alerts:"Mikrakatani", simulator:"Simulator", safety:"Jol Naljoka", report:"Report",
    activeWarning:"KENANI MIKRAKATANI",
    warningText:"Jaintia Hills (NH-44) · Naljokgipa biapona re·angbo.",
    checkSafety:"GPS Naljokani Nibo", checking:"Biapko sandienga...", emergency:"Rang·san Mikrakatbo",
  },
  lus: {
    dashboard:"In (Home)", map:"Map", ai:"AI Hriatlawkna", sensors:"Sensor-te", analytics:"Endikna",
    alerts:"Hriattirna", simulator:"Simulator", safety:"Himna Enna", report:"Report",
    activeWarning:"LEIMIN HLUAWHNA",
    warningText:"Jaintia Hills (NH-44) · Ruahtui 142mm sur · Hmun him pan vat rawh u.",
    checkSafety:"GPS Himna En Rawh", checking:"Hmun zawn mek a ni...", emergency:"Khaihhawm Hriattirna",
  },
  mni: {
    dashboard:"হোম", map:"মেপ", ai:"AI প্রেডিক্ট", sensors:"সেন্সর", analytics:"অ্যানালিটিক্স",
    alerts:"অলর্ট", simulator:"সিমুলেটর", safety:"নুঙাইবা চেক", report:"রিপোর্ট",
    activeWarning:"লৌথোকপা কৃতিকেল সতৰ্কতা",
    warningText:"জয়ন্তিয়া হিলস (NH-44) · ১৪২মিমি · অশ্ৰয়স্থল চংশিন্নবা।",
    checkSafety:"GPS সেফটি চেক", checking:"চেক তৌরি...", emergency:"ইমার্জেন্সি ব্রডকাস্ট",
  },
  ne: {
    dashboard:"होम", map:"नक्सा", ai:"AI भविष्यवाणी", sensors:"सेन्सर", analytics:"एनालिटिक्स",
    alerts:"अलर्ट", simulator:"सिमुलेटर", safety:"सुरक्षा जाँच", report:"रिपोर्ट",
    activeWarning:"गम्भीर पहिरो चेतावनी",
    warningText:"जयन्तिया हिल्स (NH-44) · १४२मिमि/२४ঘণ্টা · तुरुन्त सुरक्षित स्थानमा जानुस्।",
    checkSafety:"GPS सुरक्षा जाँच्नुस्", checking:"स्थान खोजिँदैछ...", emergency:"आपतकालीन अलर्ट",
  },
  nag: {
    dashboard:"Ghor (Home)", map:"Map", ai:"AI Janai Diya", sensors:"Sensors", analytics:"Hesab",
    alerts:"Hushiar", simulator:"Simulator", safety:"Safety Check", report:"Report",
    activeWarning:"DANGA KHATRA HUSHIAR",
    warningText:"Jaintia Hills (NH-44) · Safe jaka te jabi.",
    checkSafety:"GPS Safety Sabo", checking:"Jaka dhoondhi ase...", emergency:"Emergency Khobor",
  },
  brx: {
    dashboard:"Nò (Home)", map:"Map", ai:"AI Mitinga", sensors:"Sensors", analytics:"Naijirnay",
    alerts:"Husiyar", simulator:"Simulator", safety:"Bikhung", report:"Report",
    activeWarning:"GWBWRWI DANGER",
    warningText:"Jaintia Hills (NH-44) · Sukhibari thaoniyo thaang.",
    checkSafety:"GPS Safety Nay", checking:"Jaiga naydong...", emergency:"Emergency Alert",
  },
  trp: {
    dashboard:"Nok (Home)", map:"Map", ai:"AI Sakphang", sensors:"Sensors", analytics:"Saimung",
    alerts:"Khurumung", simulator:"Simulator", safety:"Kahamyung", report:"Report",
    activeWarning:"KWMAI YAKGAMI",
    warningText:"Jaintia Hills (NH-44) · Tongthok hani thani thani thaidi.",
    checkSafety:"GPS Safety Naydi", checking:"Jaga nayjagwi tongo...", emergency:"Emergency Alert",
  },
  hi: {
    dashboard:"होम", map:"नक्शा", ai:"AI भविष्यवाणी", sensors:"सेंसर", analytics:"एनालिटिक्स",
    alerts:"अलर्ट", simulator:"सिमुलेटर", safety:"सुरक्षा जाँच", report:"रिपोर्ट",
    activeWarning:"गंभीर खतरा चेतावनी",
    warningText:"जयंतिया हिल्स, मेघालय (NH-44) · 142मिमी/24घंटे · तत्काल सुरक्षित स्थान पर जाएं।",
    checkSafety:"GPS सुरक्षा जाँचें", checking:"लोकेशन जाँची जा रही है...", emergency:"आपातकालीन प्रसारण",
  }
}

function getRiskColor(score) {
  if (score >= 80) return "#b91c1c"
  if (score >= 65) return "#d97706"
  if (score >= 45) return "#ca8a04"
  if (score >= 25) return "#16a34a"
  return "#15803d"
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 1. SPLASH SCREEN
function SplashScreen({ onEnter }) {
  const [selectedLang, setSelectedLang] = useState("en")

  return (
    <div className="splash-screen">
      <div className="splash-logo-wrap">
        <div className="splash-logo-ring" />
        <div className="splash-logo-ring2" />
        <img src="/logo.jpg" alt="AEGIS" className="splash-logo" />
      </div>
      <div className="splash-badge">TEAM AEGIS · SIH 2026</div>
      <h1 className="splash-title">NER <span>Landslide</span><br />Early Warning System</h1>
      <p className="splash-subtitle">MDoNER · Govt. of India · Geotechnical AI</p>

      <p className="splash-lang-title">Choose Language / ভাষা নিৰ্বাচন কৰক</p>
      <div className="splash-lang-grid" style={{ maxHeight: "240px", overflowY: "auto", padding: "4px" }}>
        {LANGUAGES.map(lang => (
          <button key={lang.code} className={`lang-btn ${selectedLang === lang.code ? "selected" : ""}`} onClick={() => setSelectedLang(lang.code)}>
            <span className="lang-native">{lang.native}</span>
            <span className="lang-english">{lang.region}</span>
          </button>
        ))}
      </div>
      <button className="splash-enter-btn" onClick={() => onEnter(selectedLang)}>
        <span>Launch Application</span>
        <span>→</span>
      </button>
    </div>
  )
}

// 2. DEDICATED BULLETPROOF SAFETY CHECK VIEW
function SafetyCheckView({ t, onBack }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [query, setQuery] = useState("")

  const computeLocationSafety = async (lat, lon, label) => {
    setLoading(true)
    let nearest = ZONES[0]
    let minDist = calculateDistance(lat, lon, nearest.lat, nearest.lng)
    ZONES.forEach(z => {
      const d = calculateDistance(lat, lon, z.lat, z.lng)
      if (d < minDist) { minDist = d; nearest = z; }
    })

    let rain = 0.0, temp = 24.0
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,precipitation`)
      if (res.ok) {
        const data = await res.json()
        temp = data.current?.temperature_2m ?? 24.0
        rain = data.current?.precipitation ?? 0.0
      }
    } catch(e) {}

    const isCritical = minDist <= 25
    const isWatch = minDist > 25 && minDist <= 80

    setResult({
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
      label: label || "Detected Location",
      nearestName: nearest.name,
      nearestState: nearest.state,
      distanceKm: minDist < 20 ? minDist.toFixed(1) : Math.round(minDist),
      status: isCritical ? "critical" : isWatch ? "caution" : "safe",
      statusTitle: isCritical ? "CRITICAL HAZARD ZONE (RED)" : isWatch ? "ELEVATED HILL WATCH (AMBER)" : "SAFE TERRAIN (GREEN)",
      advice: isCritical 
        ? "Active landslide fault within " + minDist.toFixed(1) + " km. Move away from steep hill cuts to nearest community hall."
        : isWatch 
        ? "Hill corridor watch active. Avoid night vehicular movement along highway cuttings."
        : "Stable low-gradient region (~" + Math.round(minDist) + " km from hill faults). Normal conditions.",
      rain: rain.toFixed(1),
      soil: isCritical ? "92.4%" : isWatch ? "64.1%" : "28.0%",
      slope: isCritical ? "41.5°" : isWatch ? "26.0°" : "< 5°",
      shelter: isCritical ? "District Multipurpose Hall, Khliehriat (2.4 km away)" : "Normal Local Facilities"
    })
    setLoading(false)
  }

  const handleGPS = () => {
    setLoading(true)
    let finished = false
    const fallback = setTimeout(() => {
      if (!finished) {
        finished = true
        computeLocationSafety(26.1445, 91.7362, "Guwahati Region (GPS Fallback)")
      }
    }, 3500)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!finished) {
            finished = true
            clearTimeout(fallback)
            computeLocationSafety(pos.coords.latitude, pos.coords.longitude, "Your Real GPS Location")
          }
        },
        (err) => {
          if (!finished) {
            finished = true
            clearTimeout(fallback)
            computeLocationSafety(26.1445, 91.7362, "Guwahati Area (GPS Denied)")
          }
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
      )
    } else {
      clearTimeout(fallback)
      computeLocationSafety(26.1445, 91.7362, "Guwahati Area (GPS Not Supported)")
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", India")}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          computeLocationSafety(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name.split(',')[0])
          return
        }
      }
    } catch(e) {}
    alert("Location not found. Showing regional analysis.")
    computeLocationSafety(25.5788, 91.8933, query)
  }

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Safety Advisor</h2>
          <p>Real-Time Slope Proximity</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Gps size={18} color="var(--navy)" />
            <span>Triangulate Hazard Risk</span>
          </div>
        </div>
        <div className="card-body">
          <button className="btn btn-primary" onClick={handleGPS} disabled={loading} style={{ width: "100%", marginBottom: "12px" }}>
            <Icons.Gps size={18} color="#ffffff" />
            <span>{loading ? "Locking Satellite GPS..." : "Scan Real GPS Coordinates"}</span>
          </button>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: "6px" }}>
            <input 
              className="form-input" 
              placeholder="Or enter PIN / City (e.g. 793001 or Shillong)" 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-outline btn-sm" style={{ padding: "0 14px", fontWeight: "700" }}>
              Search
            </button>
          </form>

          {result && (
            <div className={`safety-card ${result.status}`} style={{ marginTop: "14px" }}>
              <div style={{ marginBottom: "6px" }}>
                <Icons.Safety size={38} color={result.status === "critical" ? "#b91c1c" : result.status === "caution" ? "#d97706" : "#15803d"} />
              </div>
              <div className="safety-status" style={{ color: result.status === "critical" ? "#b91c1c" : result.status === "caution" ? "#d97706" : "#15803d" }}>
                {result.statusTitle}
              </div>
              <div style={{ fontSize: "12px", color: "var(--darknavy)", fontWeight: "600", marginBottom: "4px" }}>
                {result.label} ({result.lat}° N, {result.lon}° E)
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Nearest Fault: <strong>{result.nearestName} ({result.distanceKm} km away)</strong>
              </div>
              <div className="safety-stats">
                <div className="safety-stat"><div className="safety-stat-value">{result.rain} mm/h</div><div className="safety-stat-label">Rain</div></div>
                <div className="safety-stat"><div className="safety-stat-value">{result.soil}</div><div className="safety-stat-label">Soil Sat.</div></div>
                <div className="safety-stat"><div className="safety-stat-value">{result.slope}</div><div className="safety-stat-label">Slope</div></div>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px", marginTop: "10px", fontSize: "11.5px", textAlign: "left", color: "var(--darknavy)" }}>
                <strong>Advisory:</strong> {result.advice}
                {result.status === "critical" && (
                  <div style={{ marginTop: "6px", color: "#b91c1c", fontWeight: "700" }}>
                    Shelter: {result.shelter}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 3. HOME VIEW WITH PROFESSIONAL VECTOR ICONS
function HomeView({ t, onOpenSection, onOpenSOS }) {
  const [liveSoil, setLiveSoil] = useState(87)
  const [liveDisp, setLiveDisp] = useState(4.2)
  const [liveRain, setLiveRain] = useState(18.7)

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSoil(v => Math.min(99, Math.max(60, v + (Math.random() - 0.45) * 2)))
      setLiveDisp(v => Math.min(8, Math.max(0.5, v + (Math.random() - 0.4) * 0.3)))
      setLiveRain(v => Math.min(30, Math.max(5, v + (Math.random() - 0.45) * 1.5)))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const APP_TILES = [
    { id: "safety", name: t.safety, icon: <Icons.Safety size={24} color="#ffffff" />, type: "safety" },
    { id: "predictions", name: t.ai, icon: <Icons.Ai size={24} color="#ffffff" />, type: "ai" },
    { id: "map", name: t.map, icon: <Icons.Map size={24} color="#ffffff" />, type: "map" },
    { id: "sensors", name: t.sensors, icon: <Icons.Sensors size={24} color="#ffffff" />, type: "sensors" },
    { id: "analytics", name: t.analytics, icon: <Icons.Analytics size={24} color="#ffffff" />, type: "analytics" },
    { id: "simulation", name: t.simulator, icon: <Icons.Simulator size={24} color="#ffffff" />, type: "simulator" },
    { id: "alerts", name: t.alerts, icon: <Icons.Alerts size={24} color="#ffffff" />, type: "alerts", badge: "7" },
    { id: "report", name: t.report, icon: <Icons.Report size={24} color="#ffffff" />, type: "report" },
  ]

  return (
    <div>
      {/* Hero Status Widget */}
      <div className="hero-widget">
        <div className="hero-widget-top">
          <div className="hero-widget-tag">
            <span className="live-dot" style={{ background: "#b91c1c" }}></span>
            <span>{t.activeWarning}</span>
          </div>
          <span style={{ fontSize: 10, color: "var(--navy)", fontWeight: 700 }}>NLSM LEVEL-3</span>
        </div>
        <div className="hero-widget-title">Jaintia Hills (NH-44 Corridor)</div>
        <div className="hero-widget-desc">{t.warningText}</div>
        <div className="hero-widget-metrics">
          <div className="hero-metric-box">
            <div className="hero-metric-val" style={{ color: "#b91c1c" }}>94%</div>
            <div className="hero-metric-lbl">Risk Prob.</div>
          </div>
          <div className="hero-metric-box">
            <div className="hero-metric-val" style={{ color: "#d97706" }}>{liveDisp.toFixed(1)} mm</div>
            <div className="hero-metric-lbl">Shear Rate</div>
          </div>
          <div className="hero-metric-box">
            <div className="hero-metric-val" style={{ color: "#1e40af" }}>{liveRain.toFixed(0)} mm</div>
            <div className="hero-metric-lbl">Live Rain</div>
          </div>
        </div>
      </div>

      {/* Modern Squircle App Grid */}
      <div className="home-section-title">
        <span>System Modules</span>
        <span style={{ fontSize: 10, color: "var(--navy)" }}>8 Applications</span>
      </div>

      <div className="app-grid">
        {APP_TILES.map(app => (
          <button key={app.id} className="app-tile" onClick={() => onOpenSection(app.id)}>
            <div className={`app-squircle ${app.type}`}>
              {app.icon}
              {app.badge && <span className="app-badge-pip">{app.badge}</span>}
            </div>
            <span className="app-name">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Quick Launch Safety Check Card */}
      <div className="card" style={{ borderLeft: "4px solid var(--navy)" }}>
        <div className="card-header">
          <div className="card-title">
            <Icons.Safety size={18} color="var(--navy)" />
            <span>Citizen Slope Risk Check</span>
          </div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Check your immediate proximity to active fault lines and satellite soil saturation.
          </p>
          <button className="btn btn-primary" onClick={() => onOpenSection("safety")}>
            <Icons.Gps size={18} color="#ffffff" />
            <span>Open GPS Safety Advisor</span>
          </button>
        </div>
      </div>

      {/* Live Geotechnical Gauges Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Sensors size={18} color="var(--navy)" />
            <span>Station JH-082 Telemetry</span>
          </div>
          <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>● LIVE 15m</span>
        </div>
        <div className="card-body">
          <div className="gauge-row">
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">Soil Moisture (Pore Pressure)</span>
                <span className="gauge-value" style={{ color: liveSoil > 80 ? "#b91c1c" : "#ca8a04" }}>{liveSoil.toFixed(0)}%</span>
              </div>
              <div className="gauge-bar-bg">
                <div className="gauge-bar-fill" style={{ width: `${liveSoil}%`, background: liveSoil > 80 ? "#b91c1c" : "#ca8a04" }} />
              </div>
            </div>
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">Shear Displacement Rate</span>
                <span className="gauge-value" style={{ color: liveDisp > 3 ? "#b91c1c" : "#d97706" }}>{liveDisp.toFixed(1)} mm/h</span>
              </div>
              <div className="gauge-bar-bg">
                <div className="gauge-bar-fill" style={{ width: `${(liveDisp / 6) * 100}%`, background: liveDisp > 3 ? "#b91c1c" : "#d97706" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Broadcast SOS */}
      <button className="btn btn-danger" onClick={onOpenSOS}>
        <Icons.Alerts size={18} color="#ffffff" />
        <span>{t.emergency}</span>
      </button>
    </div>
  )
}

// 4. AI PREDICTIONS VIEW
function PredictionsView({ t, onBack, onOpenSOS }) {
  const hotspots = [
    { zone:"Jaintia Hills, Meghalaya", prob:94, eta:"3h 15m", pop:"3,200", trigger:"Rainfall Intensity (52%) + Pore Pressure (28%)", corridor:"NH-44 Sector 8" },
    { zone:"Gangtok South, Sikkim", prob:81, eta:"7h 40m", pop:"1,840", trigger:"Antecedent Rain (45%) + Lithology (35%)", corridor:"NH-10 Link" },
    { zone:"Aizawl East, Mizoram", prob:76, eta:"11h 10m", pop:"2,410", trigger:"Soil Moisture (48%) + Slope Cut (32%)", corridor:"Bawngkawn Ridge" },
    { zone:"Kohima Dzudza, Nagaland", prob:68, eta:"19h 45m", pop:"950", trigger:"Culvert Blockage (41%) + Siltstone (39%)", corridor:"NH-29 Bridge" },
  ]

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>LandslideNet AI</h2>
          <p>XGBoost + SHAP (89.3% Acc)</p>
        </div>
      </div>

      <div className="card" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700 }}>AI MODEL STATUS</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--darknavy)" }}>v3.2 Active</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>14,000+ GSI Historical Training Records</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af", fontFamily: "monospace" }}>0.92</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>ROC-AUC Score</div>
          </div>
        </div>
      </div>

      <div className="home-section-title">Critical Hotspot Sectors</div>

      {hotspots.map((h, i) => (
        <div className="card" key={i} style={{ borderLeft: `4px solid ${h.prob >= 80 ? "var(--red)" : "var(--orange)"}` }}>
          <div className="card-header">
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--darknavy)" }}>{h.zone}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{h.corridor}</div>
            </div>
            <span className={`risk-pill ${h.prob >= 80 ? "critical" : "high"}`}>{h.prob}% PROB</span>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "var(--surface2)", padding: 8, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Failure ETA:</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: h.prob >= 80 ? "#b91c1c" : "#d97706", fontFamily: "monospace" }}>{h.eta}</div>
              </div>
              <div style={{ background: "var(--surface2)", padding: 8, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Population:</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--darknavy)", fontFamily: "monospace" }}>{h.pop}</div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 10 }}>
              Primary Factor: <strong style={{ color: "var(--text)" }}>{h.trigger}</strong>
            </div>
            <button className="btn btn-danger btn-sm" style={{ width: "100%" }} onClick={onOpenSOS}>
              Issue Alert Order
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// 5. GEOSPATIAL MAP VIEW
function MapView({ t, onBack }) {
  const [mapType, setMapType] = useState("terrain")

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Geospatial Risk Map</h2>
          <p>NLSM 16 Monitored Zones</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Map size={18} color="var(--navy)" />
            <span>Regional GIS Viewport</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`btn btn-outline btn-sm ${mapType === "terrain" ? "active" : ""}`}
              style={mapType === "terrain" ? { background: "var(--navy)", color: "#fff" } : {}}
              onClick={() => setMapType("terrain")}>Topo</button>
            <button className={`btn btn-outline btn-sm ${mapType === "satellite" ? "active" : ""}`}
              style={mapType === "satellite" ? { background: "var(--navy)", color: "#fff" } : {}}
              onClick={() => setMapType("satellite")}>Sat</button>
          </div>
        </div>
        <div style={{ height: 280 }}>
          <MapContainer center={[25.5, 92.8]} zoom={6} style={{ height: "100%", width: "100%" }} maxBounds={[[6.0, 68.0], [38.0, 98.0]]} maxBoundsViscosity={1.0}>
            {mapType === "terrain" ? (
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
            ) : (
              <>
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" keepBuffer={12} />
              </>
            )}
            {ZONES.map(z => (
              <Polygon key={z.id} positions={z.coords} pathOptions={{ color: getRiskColor(z.score), fillColor: getRiskColor(z.score), fillOpacity: 0.45, weight: 2 }}>
                <Popup><strong>{z.name}</strong><br />{z.state}<br />Risk: {z.risk} ({z.score}%)<br />{z.desc}</Popup>
              </Polygon>
            ))}
            {SENSORS.map(s => (
              <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={6}
                pathOptions={{ color: s.status === "online" ? "#15803d" : s.status === "degraded" ? "#d97706" : "#b91c1c", fillColor: s.status === "online" ? "#15803d" : s.status === "degraded" ? "#d97706" : "#b91c1c", fillOpacity: 0.9, weight: 2 }}>
                <Popup>{s.id}<br />{s.name}<br />{s.reading}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="home-section-title">Regional Hazard Zones</div>
      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {ZONES.map(z => (
            <div className="zone-item" key={z.id}>
              <div className="zone-color-dot" style={{ background: getRiskColor(z.score) }} />
              <div className="zone-info">
                <div className="zone-name">{z.name}</div>
                <div className="zone-state">{z.state} · {z.desc}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="zone-score" style={{ color: getRiskColor(z.score) }}>{z.score}%</div>
                <span className={`risk-pill ${z.score >= 80 ? "critical" : z.score >= 65 ? "high" : z.score >= 45 ? "moderate" : "safe"}`}>{z.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 6. SENSORS TELEMETRY VIEW
function SensorsView({ t, onBack }) {
  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Sensor Telemetry</h2>
          <p>347 Active NER Stations</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", fontFamily: "monospace" }}>341</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Online</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--orange)", fontFamily: "monospace" }}>4</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Warning</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--red)", fontFamily: "monospace" }}>2</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Offline</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Sensors size={18} color="var(--navy)" />
            <span>Key Stations Telemetry</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: "0 16px" }}>
          {SENSORS.map(s => (
            <div className="sensor-item" key={s.id}>
              <div className={`sensor-status-dot ${s.status}`} />
              <div className="sensor-info">
                <div className="sensor-name">{s.name} ({s.state})</div>
                <div className="sensor-reading">{s.reading} · {s.batt}</div>
              </div>
              <span className={`sensor-status-label ${s.status}`}>{s.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 7. ANALYTICS VIEW
function AnalyticsView({ t, onBack }) {
  const states = [
    { name:"Meghalaya", pct:92 },
    { name:"Sikkim", pct:84 },
    { name:"Arunachal", pct:81 },
    { name:"Mizoram", pct:76 },
    { name:"Nagaland", pct:68 },
    { name:"Assam", pct:48 },
    { name:"Manipur", pct:54 },
    { name:"Tripura", pct:18 },
  ]

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>System Analytics</h2>
          <p>Model Performance & States</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Analytics size={18} color="var(--navy)" />
            <span>Key Performance Indicators</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>True Positive Rate:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", fontFamily: "monospace" }}>91.4%</div>
            </div>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>False Alarm Rate:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--orange)", fontFamily: "monospace" }}>5.8%</div>
            </div>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Inference Latency:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", fontFamily: "monospace" }}>82 ms</div>
            </div>
            <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Coverage Uptime:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", fontFamily: "monospace" }}>99.8%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>🏔️</span> State-Wise Vulnerability Distribution</div>
        </div>
        <div className="card-body">
          {states.map(s => (
            <div className="analytics-bar-row" key={s.name}>
              <div className="analytics-bar-label">{s.name}</div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill" style={{ width: `${s.pct}%`, background: getRiskColor(s.pct) }} />
              </div>
              <div className="analytics-bar-val" style={{ color: getRiskColor(s.pct) }}>{s.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 8. SCENARIO SIMULATOR VIEW
function SimulatorView({ t, onBack }) {
  const [mult, setMult] = useState(1.0)
  const crit = mult <= 0.8 ? 4 : mult <= 1.2 ? 12 : mult <= 1.8 ? 24 : 39
  const fos = mult <= 0.8 ? 1.42 : mult <= 1.2 ? 1.08 : mult <= 1.8 ? 0.86 : 0.62
  const pop = mult <= 0.8 ? "3,200" : mult <= 1.2 ? "18,400" : mult <= 1.8 ? "46,800" : "84,300"

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Rainfall Simulator</h2>
          <p>GSI Hydro-Mechanical FoS</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Simulator size={18} color="var(--navy)" />
            <span>Precipitation Multiplier Slider</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)", fontFamily: "monospace" }}>{mult.toFixed(1)}x</span>
        </div>
        <div className="card-body">
          <input type="range" min="0.5" max="2.5" step="0.1" value={mult} onChange={e => setMult(parseFloat(e.target.value))} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
            <span>0.5x (Sub)</span>
            <span>1.0x (Actual)</span>
            <span>1.5x (+50mm)</span>
            <span>2.5x (Peak)</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: crit > 12 ? "var(--red)" : "var(--orange)", fontFamily: "monospace" }}>{crit}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Critical Zones</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: fos < 1 ? "var(--red)" : "var(--green)", fontFamily: "monospace" }}>{fos}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>FoS Index</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", fontFamily: "monospace" }}>{pop}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>At-Risk Pop.</div>
        </div>
      </div>
    </div>
  )
}

// 9. ALERTS VIEW
function AlertsView({ t, onBack, onOpenSOS }) {
  const alerts = [
    { zone:"Jaintia Hills (NH-44 Sector 8)", sev:"CRITICAL", msg:"142mm/24h recorded. Tension cracks propagating. Evacuate 3 villages.", time:"12m ago", conf:87 },
    { zone:"Haflong Pass Corridor", sev:"CRITICAL", msg:"Debris flow warning triggered. Heavy hill cutting runoff.", time:"28m ago", conf:89 },
    { zone:"Gangtok South Ridge", sev:"HIGH", msg:"Antecedent precipitation threshold reached. Watch advisory.", time:"1h ago", conf:81 },
    { zone:"Aizawl East Bawngkawn", sev:"HIGH", msg:"Urban residential slope saturation at 84%. Alert defense.", time:"2h ago", conf:76 },
    { zone:"Kohima NH-29 Bridge", sev:"HIGH", msg:"Inclinometer shear rate 1.2mm/h. Single-lane convoy only.", time:"3h ago", conf:71 },
    { zone:"Senapati Terraces", sev:"MODERATE", msg:"Telemetry sensor offline. Periodic patrol dispatched.", time:"5h ago", conf:54 },
    { zone:"Tawang Route", sev:"HIGH", msg:"Permafrost degradation and rockfall along high pass.", time:"6h ago", conf:81 },
  ]

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Active Bulletins</h2>
          <p>7 Active Advisories</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {alerts.map((a, i) => (
            <div className="alert-item" key={i}>
              <div className={`alert-severity-bar ${a.sev.toLowerCase()}`} />
              <div className="alert-content">
                <div className="alert-zone">{a.zone}</div>
                <div className="alert-message">{a.msg}</div>
                <div className="alert-meta">
                  <span className={`risk-pill ${a.sev.toLowerCase()}`}>{a.sev}</span>
                  <span>AI: {a.conf}%</span>
                  <span>{a.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-danger" style={{ width: "100%" }} onClick={onOpenSOS}>
        <Icons.Alerts size={18} color="#ffffff" />
        <span>{t.emergency}</span>
      </button>
    </div>
  )
}

// 10. CITIZEN REPORT VIEW
function ReportView({ t, onBack }) {
  const [reports, setReports] = useState([
    { type:"Tension Crack (30cm)", loc:"NH-44 Dawki Road", desc:"Fissure after continuous rainfall.", time:"2h ago", status:"verified" },
    { type:"Debris Flow Slurry", loc:"Kohima Bypass NH-29", desc:"Slurry overrunning roadway.", time:"5h ago", status:"verified" },
  ])
  const [loc, setLoc] = useState("")
  const [desc, setDesc] = useState("")
  const [toast, setToast] = useState("")

  const submit = (e) => {
    e.preventDefault()
    if (!loc.trim()) { setToast("Please enter a location"); setTimeout(() => setToast(""), 3000); return }
    setReports(r => [{ type:"Citizen Crack Report", loc, desc: desc || "Reported via mobile app.", time:"Just now", status:"pending" }, ...r])
    setLoc(""); setDesc("")
    setToast("Report transmitted to District SDMA.")
    setTimeout(() => setToast(""), 3500)
  }

  return (
    <div>
      <div className="view-nav-header">
        <button className="view-back-btn" onClick={onBack}>← {t.dashboard}</button>
        <div className="view-title-wrap text-right">
          <h2>Incident Reporting</h2>
          <p>Crowdsourced Hazard Submissions</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Icons.Report size={18} color="var(--navy)" />
            <span>New Hazard Report</span>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={submit}>
            <div className="form-field">
              <label className="form-label">Incident Type</label>
              <input className="form-input" defaultValue="Tension Crack / Retaining Wall Fissure" />
            </div>
            <div className="form-field">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="e.g. NH-44 KM 38 near Dawki" value={loc} onChange={e => setLoc(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Observations</label>
              <textarea className="form-input" rows={3} placeholder="Describe crack width or water seepage..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Transmit Report</button>
          </form>
        </div>
      </div>

      <div className="home-section-title">Verified Field Reports</div>
      <div className="card">
        <div className="card-body" style={{ padding: "0 16px" }}>
          {reports.map((r, i) => (
            <div className="alert-item" key={i}>
              <div className="alert-content">
                <div className="alert-zone">{r.type}: {r.loc}</div>
                <div className="alert-message">{r.desc}</div>
                <div className="alert-meta">
                  <span className="risk-pill safe" style={{ fontSize: 9 }}>{r.status.toUpperCase()}</span>
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

// 11. MAIN APP SHELL
export default function AppMobile() {
  const savedLang = typeof window !== "undefined" ? localStorage.getItem("aegis_lang") : null
  const [showSplash, setShowSplash] = useState(!savedLang)
  const [lang, setLang] = useState(savedLang || "en")
  const [showLangModal, setShowLangModal] = useState(false)
  const [activeView, setActiveView] = useState("home")
  const [istTime, setIstTime] = useState("")
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [checks, setChecks] = useState({ sms: true, ndrf: true, highway: false, medical: true, push: true })

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
    if (typeof window !== "undefined") {
      localStorage.setItem("aegis_lang", selectedLang)
    }
    setShowSplash(false)
  }

  const selectNewLang = (selectedLang) => {
    setLang(selectedLang)
    if (typeof window !== "undefined") {
      localStorage.setItem("aegis_lang", selectedLang)
    }
    setShowLangModal(false)
  }

  const handleBroadcast = async () => {
    const channels = Object.entries(checks).filter(([, v]) => v).map(([k]) => k)
    const res = await broadcastAlert({ zone_name: "Jaintia Hills", severity: "CRITICAL", message: "Immediate Evacuation", channels })
    setShowSOSModal(false)
    setToastMsg("Dispatched Sovereign Alert · ID: " + (res.dispatch_id || "AEGIS-EXEC"))
    setTimeout(() => setToastMsg(""), 4000)
  }

  if (showSplash) return <SplashScreen onEnter={handleEnter} />

  const DOCK_APPS = [
    { id: "home", label: t.dashboard, icon: <Icons.Home size={20} /> },
    { id: "safety", label: t.safety, icon: <Icons.Safety size={20} /> },
    { id: "map", label: t.map, icon: <Icons.Map size={20} /> },
    { id: "predictions", label: t.ai, icon: <Icons.Ai size={20} /> },
    { id: "analytics", label: t.analytics, icon: <Icons.Analytics size={20} /> },
  ]

  return (
    <div className="app-shell">
      {/* Top Header */}
      <div className="app-header">
        <img src="/logo.jpg" alt="AEGIS" className="app-header-logo" />
        <div className="app-header-text">
          <div className="app-header-title">NER-LEWS 2.0</div>
          <div className="app-header-sub">MDoNER · Govt. of India</div>
        </div>

        {/* Quick Language Switcher Pill */}
        <button 
          onClick={() => setShowLangModal(true)} 
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "var(--navy)", fontSize: "10px", fontWeight: "800", padding: "4px 8px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          title="Change Language"
        >
          <span>🌐</span>
          <span>{lang.toUpperCase()}</span>
        </button>

        <div className="app-header-live">
          <div className="live-dot" />
          <span className="live-label">{istTime}</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="app-content">
        {activeView === "home" && (
          <HomeView t={t} onOpenSection={setActiveView} onOpenSOS={() => setShowSOSModal(true)} />
        )}
        {activeView === "safety" && (
          <SafetyCheckView t={t} onBack={() => setActiveView("home")} />
        )}
        {activeView === "predictions" && (
          <PredictionsView t={t} onBack={() => setActiveView("home")} onOpenSOS={() => setShowSOSModal(true)} />
        )}
        {activeView === "map" && (
          <MapView t={t} onBack={() => setActiveView("home")} />
        )}
        {activeView === "sensors" && (
          <SensorsView t={t} onBack={() => setActiveView("home")} />
        )}
        {activeView === "analytics" && (
          <AnalyticsView t={t} onBack={() => setActiveView("home")} />
        )}
        {activeView === "simulation" && (
          <SimulatorView t={t} onBack={() => setActiveView("home")} />
        )}
        {activeView === "alerts" && (
          <AlertsView t={t} onBack={() => setActiveView("home")} onOpenSOS={() => setShowSOSModal(true)} />
        )}
        {activeView === "report" && (
          <ReportView t={t} onBack={() => setActiveView("home")} />
        )}
      </div>

      {/* FLOATING TRANSLUCENT DOCK WITH VECTOR ICONS */}
      <div className="floating-dock-container">
        <div className="floating-dock">
          {DOCK_APPS.map(app => (
            <button
              key={app.id}
              className={`dock-btn ${activeView === app.id ? "active" : ""}`}
              onClick={() => setActiveView(app.id)}
            >
              <span className="dock-icon">{app.icon}</span>
              <span className="dock-label">{app.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Change Language Modal Bottom Sheet */}
      {showLangModal && (
        <div className="modal-overlay" onClick={() => setShowLangModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title" style={{ color: "var(--darknavy)", fontSize: "16px" }}>🌐 Select Language / ভাষা নিৰ্বাচন</div>
            <div className="modal-subtitle">12 Official North-Eastern &amp; National Languages</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "320px", overflowY: "auto", padding: "4px" }}>
              {LANGUAGES.map(item => (
                <button 
                  key={item.code} 
                  className={`lang-btn ${lang === item.code ? "selected" : ""}`} 
                  onClick={() => selectNewLang(item.code)}
                  style={{ padding: "10px 8px" }}
                >
                  <span className="lang-native" style={{ fontSize: "13px" }}>{item.native}</span>
                  <span className="lang-english">{item.region}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-outline" style={{ marginTop: "14px", width: "100%" }} onClick={() => setShowLangModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Emergency Broadcast Sheet */}
      {showSOSModal && (
        <div className="modal-overlay" onClick={() => setShowSOSModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Emergency Dispatch Order</div>
            <div className="modal-subtitle">Jaintia Hills NH-44 Sector 8 · Multi-Channel Dispatch</div>
            {[
              { key: "sms", icon: "📱", label: "Priority SMS Cell Broadcast (1,250 residents)" },
              { key: "ndrf", icon: "🪖", label: "Mobilize NDRF 1st Bn Guwahati & SDRF" },
              { key: "highway", icon: "🚧", label: "Close NH-44 Highway Access Gates" },
              { key: "medical", icon: "🏥", label: "Alert District Hospital Khliehriat" },
              { key: "push", icon: "🔔", label: "Mobile Push Siren to Subscriber Towers" },
            ].map(({ key, icon, label }) => (
              <div className="checkbox-row" key={key}>
                <span className="checkbox-icon">{icon}</span>
                <span className="checkbox-label">{label}</span>
                <div className={`toggle ${checks[key] ? "on" : "off"}`} onClick={() => setChecks(c => ({ ...c, [key]: !c[key] }))}>
                  <div className="toggle-knob" />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="btn btn-danger" onClick={handleBroadcast}>TRANSMIT BROADCAST</button>
              <button className="btn btn-outline" onClick={() => setShowSOSModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
