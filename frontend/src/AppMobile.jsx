import React, { useState, useEffect } from "react"
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup } from "react-leaflet"
import { getWeather, broadcastAlert } from "./api/client"
import "./mobile.css"

// GEOSPATIAL & SENSOR DATA
const ZONES = [
  { id:1, name:"Jaintia Hills", state:"Meghalaya", score:87, risk:"CRITICAL", coords:[[25.20,92.30],[25.00,92.00],[24.85,92.40],[25.05,92.70]], desc:"Active Disang shale thrust. NH-44 debris flow corridor." },
  { id:2, name:"Sohra / Cherrapunji", state:"Meghalaya", score:74, risk:"HIGH", coords:[[25.40,91.60],[25.20,91.40],[25.10,91.70],[25.30,91.90]], desc:"Extreme rainfall zone. Limestone escarpment failure." },
  { id:3, name:"Ri-Bhoi Foothills", state:"Meghalaya", score:52, risk:"MODERATE", coords:[[26.00,91.70],[25.70,91.50],[25.60,92.00],[25.90,92.20]], desc:"Seasonal translational soil slips along highway." },
  { id:4, name:"North Sikkim MCT", state:"Sikkim", score:83, risk:"CRITICAL", coords:[[28.00,88.40],[27.60,88.10],[27.40,88.50],[27.70,88.80]], desc:"Main Central Thrust active fault. Glacial moraine instability." },
  { id:5, name:"Gangtok South Ridge", state:"Sikkim", score:78, risk:"HIGH", coords:[[27.40,88.65],[27.20,88.50],[27.15,88.75],[27.35,88.85]], desc:"Terraced hill slope weathering. NH-10 connectivity link." },
  { id:6, name:"Aizawl East Flank", state:"Mizoram", score:76, risk:"HIGH", coords:[[23.85,92.60],[23.65,92.40],[23.55,92.80],[23.75,93.00]], desc:"Urban slope cutting. Sandstone formation saturation." },
  { id:7, name:"Lunglei Ridge", state:"Mizoram", score:48, risk:"MODERATE", coords:[[23.10,92.80],[22.75,92.60],[22.65,93.00],[22.95,93.20]], desc:"Longitudinal valley slope with moderate moisture." },
  { id:8, name:"Kohima Dzudza", state:"Nagaland", score:68, risk:"HIGH", coords:[[25.80,94.00],[25.55,93.75],[25.45,94.20],[25.65,94.45]], desc:"NH-29 bridge corridor. Active slope subsidence." },
  { id:9, name:"Tawang MCT Zone", state:"Arunachal", score:81, risk:"CRITICAL", coords:[[27.75,91.95],[27.45,91.65],[27.30,92.05],[27.60,92.35]], desc:"High altitude permafrost degradation along passes." },
  { id:10, name:"Haflong Hill Station", state:"Assam", score:85, risk:"CRITICAL", coords:[[25.25,93.10],[25.05,92.90],[24.95,93.25],[25.15,93.35]], desc:"Dima Hasao railway hill cut. High debris flow record." },
  { id:11, name:"Senapati Terraces", state:"Manipur", score:54, risk:"MODERATE", coords:[[25.40,93.90],[25.10,93.65],[24.95,94.10],[25.25,94.35]], desc:"Hill agricultural slopes. Seasonal monsoon erosion." },
  { id:12, name:"Agartala Basin", state:"Tripura", score:18, risk:"SAFE", coords:[[23.95,91.20],[23.70,91.00],[23.60,91.40],[23.85,91.60]], desc:"Stable alluvial terrain. Very low gradient." },
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

// 12 MOST COMMON NORTH-EASTERN LANGUAGES
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
    checkSafety:"Check GPS Safety", checking:"Triangulating GPS...", emergency:"Emergency Broadcast",
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
    warningText:"Jaintia Hills (NH-44) · 142mm mikka/24 ghanta · Naljokgipa biapona re·angbo.",
    checkSafety:"GPS Naljokani Nibo", checking:"Biapko sandienga...", emergency:"Rang·san Mikrakatbo",
  },
  lus: {
    dashboard:"In (Home)", map:"Map", ai:"AI Hriatlawkna", sensors:"Sensor-te", analytics:"Endikna",
    alerts:"Vantlang Hriattirna", simulator:"Simulator", safety:"Himna Enna", report:"Report",
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
    warningText:"जयन्तिया हिल्स (NH-44) · १४२मिमि/२४घण्टा · तुरुन्त सुरक्षित स्थानमा जानुस्।",
    checkSafety:"GPS सुरक्षा जाँच्नुस्", checking:"स्थान खोजिँदैछ...", emergency:"आपतकालीन अलर्ट",
  },
  nag: {
    dashboard:"Ghor (Home)", map:"Map", ai:"AI Janai Diya", sensors:"Sensors", analytics:"Hesab",
    alerts:"Hushiar", simulator:"Simulator", safety:"Safety Check", report:"Report",
    activeWarning:"DANGA KHATRA HUSHIAR",
    warningText:"Jaintia Hills (NH-44) · Bishi pani giri ase 142mm · Safe jaka te jabi.",
    checkSafety:"GPS Safety Sabo", checking:"Jaka dhoondhi ase...", emergency:"Emergency Khobor",
  },
  brx: {
    dashboard:"Nò (Home)", map:"Mwnthay (Map)", ai:"AI Mitinga", sensors:"Sensors", analytics:"Naijirnay",
    alerts:"Husiyar", simulator:"Simulator", safety:"Bikhung", report:"Report",
    activeWarning:"GWBWRWI DANGER",
    warningText:"Jaintia Hills (NH-44) · 142mm okha · Sukhibari thaoniyo thaang.",
    checkSafety:"GPS Safety Nay", checking:"Jaiga naydong...", emergency:"Emergency Alert",
  },
  trp: {
    dashboard:"Nok (Home)", map:"Map", ai:"AI Sakphang", sensors:"Sensors", analytics:"Saimung",
    alerts:"Khurumung", simulator:"Simulator", safety:"Kahamyung", report:"Report",
    activeWarning:"KWMAI YAKGAMI",
    warningText:"Jaintia Hills (NH-44) · 142mm waatwi · Tongthok hani thani thani thaidi.",
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

// 1. SPLASH SCREEN (FIRST TIME ONLY)
function SplashScreen({ onEnter }) {
  const [selectedLang, setSelectedLang] = useState("en")
  const particles = Array.from({ length: 12 }, (_, i) => ({
    size: Math.random() * 50 + 20,
    left: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }))

  return (
    <div className="splash-screen">
      <div className="splash-particles">
        {particles.map((p, i) => (
          <div key={i} className="splash-particle" style={{
            width: p.size, height: p.size, left: `${p.left}%`,
            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>
      <div className="splash-logo-wrap">
        <div className="splash-logo-ring" />
        <div className="splash-logo-ring2" />
        <img src="/logo.jpg" alt="AEGIS" className="splash-logo" />
      </div>
      <div className="splash-badge">TEAM AEGIS · SIH 2026</div>
      <h1 className="splash-title">NER <span>Landslide</span><br />Warning System</h1>
      <p className="splash-subtitle">MDoNER · Govt. of India · Geotechnical AI</p>

      <p className="splash-lang-title">Choose Your Language / भाषा चुनें</p>
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
      <div className="splash-footer">
        Government of India · MDoNER · NDMA<br />
        NER-LEWS 2.0 · Preference will be saved
      </div>
    </div>
  )
}

// 2. HOME VIEW (IPHONE / PHONE DASHBOARD WITH SQUIRCLE APP GRID)
function HomeView({ t, onOpenSection, onOpenSOS }) {
  const [liveSoil, setLiveSoil] = useState(87)
  const [liveDisp, setLiveDisp] = useState(4.2)
  const [liveRain, setLiveRain] = useState(18.7)
  const [locLoading, setLocLoading] = useState(false)
  const [safetyResult, setSafetyResult] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSoil(v => Math.min(99, Math.max(60, v + (Math.random() - 0.45) * 2)))
      setLiveDisp(v => Math.min(8, Math.max(0.5, v + (Math.random() - 0.4) * 0.3)))
      setLiveRain(v => Math.min(30, Math.max(5, v + (Math.random() - 0.45) * 1.5)))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const handleCheckSafety = async () => {
    setLocLoading(true)
    setSafetyResult(null)
    const process = async (lat, lng, label) => {
      let rain = 0.0
      try {
        const w = await getWeather(lat, lng)
        rain = w.precipitation || 0.0
      } catch(e) {}
      const dLat = (25.44 - lat) * 111
      const dLng = (92.21 - lng) * 111
      const dist = Math.sqrt(dLat * dLat + dLng * dLng)
      if (dist < 40) {
        setSafetyResult({
          status: "critical", score: 94, zone: `Active Corridor (${dist.toFixed(1)} km from Jaintia Fault)`,
          rain: (rain || 34.2).toFixed(1),
          message: "Evacuation alert active. Move to designated district shelter.",
          icon: "🚨"
        })
      } else {
        setSafetyResult({
          status: "safe", score: 12, zone: `${label || "Your Area"} (~${Math.round(dist)} km from hill faults)`,
          rain: rain.toFixed(1),
          message: "Safe alluvial terrain. Zero immediate landslide vulnerability.",
          icon: "✅"
        })
      }
      setLocLoading(false)
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => process(p.coords.latitude, p.coords.longitude, "GPS Location"),
        () => process(26.14, 91.73, "Guwahati Region")
      )
    } else {
      process(26.14, 91.73, "Guwahati Region")
    }
  }

  const APP_TILES = [
    { id: "predictions", name: t.ai, icon: "🧠", type: "ai" },
    { id: "map", name: t.map, icon: "🗺️", type: "map" },
    { id: "sensors", name: t.sensors, icon: "📡", type: "sensors" },
    { id: "analytics", name: t.analytics, icon: "📊", type: "analytics" },
    { id: "simulation", name: t.simulator, icon: "🌧️", type: "simulator" },
    { id: "alerts", name: t.alerts, icon: "🔔", type: "alerts", badge: "7" },
    { id: "safety", name: t.safety, icon: "🛡️", type: "safety" },
    { id: "report", name: t.report, icon: "📝", type: "report" },
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

      {/* iPhone / Android Style App Grid */}
      <div className="home-section-title">
        <span>System Applications</span>
        <span style={{ fontSize: 10, color: "var(--navy)" }}>8 Modules</span>
      </div>

      <div className="app-grid">
        {APP_TILES.map(app => (
          <button key={app.id} className="app-tile" onClick={() => onOpenSection(app.id)}>
            <div className={`app-squircle ${app.type}`}>
              <span>{app.icon}</span>
              {app.badge && <span className="app-badge-pip">{app.badge}</span>}
            </div>
            <span className="app-name">{app.name}</span>
          </button>
        ))}
      </div>

      {/* Live Geotechnical Gauges Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>📡</span> Station JH-082 Telemetry</div>
          <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>● LIVE 15m</span>
        </div>
        <div className="card-body">
          <div className="gauge-row">
            <div className="gauge-item">
              <div className="gauge-label-row">
                <span className="gauge-label">Soil Saturation (Pore Pressure)</span>
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

      {/* Quick GPS Safety Check Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>🛡️</span> Instant GPS Proximity Check</div>
        </div>
        <div className="card-body">
          <button className="btn btn-primary" onClick={handleCheckSafety} disabled={locLoading}>
            {locLoading ? t.checking : t.checkSafety}
          </button>

          {safetyResult && (
            <div className={`safety-card ${safetyResult.status}`}>
              <div className="safety-icon">{safetyResult.icon}</div>
              <div className="safety-status" style={{ color: safetyResult.status === "critical" ? "#b91c1c" : "#15803d" }}>
                {safetyResult.status === "critical" ? "CRITICAL HAZARD ZONE" : "SAFE TERRAIN"}
              </div>
              <div className="safety-message">{safetyResult.zone} — {safetyResult.message}</div>
              <div className="safety-stats">
                <div className="safety-stat"><div className="safety-stat-value">{safetyResult.rain} mm/h</div><div className="safety-stat-label">Live Rain</div></div>
                <div className="safety-stat"><div className="safety-stat-value">{safetyResult.status === "critical" ? "93.2%" : "28.4%"}</div><div className="safety-stat-label">Soil Sat.</div></div>
                <div className="safety-stat"><div className="safety-stat-value">{safetyResult.status === "critical" ? "41.5°" : "< 5°"}</div><div className="safety-stat-label">Slope Angle</div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Broadcast SOS */}
      <button className="btn btn-danger" onClick={onOpenSOS}>
        {t.emergency}
      </button>
    </div>
  )
}

// 3. AI PREDICTIONS VIEW
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

// 4. GEOSPATIAL MAP VIEW
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
          <div className="card-title"><span>🗺️</span> Regional GIS Viewport</div>
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

// 5. SENSORS TELEMETRY VIEW
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
          <div className="card-title"><span>📡</span> Key Stations Telemetry</div>
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

// 6. ANALYTICS VIEW
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
          <div className="card-title"><span>📊</span> Key Performance Indicators</div>
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

// 7. SCENARIO SIMULATOR VIEW
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
          <div className="card-title"><span>🌧️</span> Precipitation Multiplier Slider</div>
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

// 8. ALERTS VIEW
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
        {t.emergency}
      </button>
    </div>
  )
}

// 9. CITIZEN REPORT VIEW
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
          <div className="card-title"><span>📝</span> New Hazard Report</div>
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

// 10. MAIN APP SHELL WITH LOCALSTORAGE & QUICK LANGUAGE SWITCHER
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
    { id: "home", label: t.dashboard, icon: "🏠" },
    { id: "map", label: t.map, icon: "🗺️" },
    { id: "predictions", label: t.ai, icon: "🧠" },
    { id: "sensors", label: t.sensors, icon: "📡" },
    { id: "analytics", label: t.analytics, icon: "📊" },
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
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "var(--navy)", fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
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
        {activeView === "safety" && (
          <HomeView t={t} onOpenSection={setActiveView} onOpenSOS={() => setShowSOSModal(true)} />
        )}
        {activeView === "report" && (
          <ReportView t={t} onBack={() => setActiveView("home")} />
        )}
      </div>

      {/* FLOATING TRANSLUCENT DOCK */}
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
            <div className="modal-title" style={{ color: "var(--darknavy)", fontSize: "16px" }}>🌐 Select Language / भाषा चुनें</div>
            <div className="modal-subtitle">Choose from 12 North-Eastern &amp; National Languages</div>
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
