const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'demo-evidence');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Zero Datum Display
const svgZero = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="480" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="480" fill="#f8fafc"/>
  <rect x="40" y="40" width="720" height="400" rx="24" fill="url(#bezel)" stroke="#334155" stroke-width="4"/>
  <!-- Brand & Model Header -->
  <text x="75" y="85" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" letter-spacing="2">APEX METROLOGY INSTRUMENTS</text>
  <text x="725" y="85" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="end">MODEL: Precision-Bench-B6</text>
  <line x1="75" y1="100" x2="725" y2="100" stroke="#334155" stroke-width="1.5"/>
  <!-- Metrological Legend -->
  <text x="75" y="125" fill="#64748b" font-family="monospace" font-size="12">Class II • Max 6.000 kg • Min 0.050 kg • e = 0.001 kg • d = 0.0002 kg</text>
  <text x="725" y="125" fill="#10b981" font-family="monospace" font-size="12" text-anchor="end">STATUS: CALIBRATED / LEVEL OK</text>
  <!-- LCD Display Screen -->
  <rect x="75" y="145" width="650" height="230" rx="12" fill="url(#lcd)" stroke="#047857" stroke-width="3"/>
  <!-- Status Annunciators -->
  <rect x="100" y="165" width="70" height="26" rx="4" fill="#047857"/>
  <text x="135" y="183" fill="#6ee7b7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">STABLE</text>
  <rect x="180" y="165" width="60" height="26" rx="4" fill="#047857"/>
  <text x="210" y="183" fill="#6ee7b7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">&gt;0&lt; ZERO</text>
  <!-- Main Digital Weight Readout -->
  <text x="590" y="315" fill="#34d399" font-family="'Courier New', Courier, monospace" font-size="110" font-weight="900" text-anchor="end" letter-spacing="4">0.0000</text>
  <text x="615" y="310" fill="#a7f3d0" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="700">kg</text>
  <!-- Footer Bar -->
  <text x="75" y="415" fill="#64748b" font-family="monospace" font-size="11">SN: SN-BS-26001 • Test: Clause A.4.4.1 Zero Datum • Temp: 21.4 °C • RH: 48%</text>
</svg>`;

// 2. 3.0000 kg Load Display (Midpoint)
const svg3kg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="480" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bezel2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="lcd2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="480" fill="#f8fafc"/>
  <rect x="40" y="40" width="720" height="400" rx="24" fill="url(#bezel2)" stroke="#334155" stroke-width="4"/>
  <text x="75" y="85" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" letter-spacing="2">APEX METROLOGY INSTRUMENTS</text>
  <text x="725" y="85" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="end">MODEL: Precision-Bench-B6</text>
  <line x1="75" y1="100" x2="725" y2="100" stroke="#334155" stroke-width="1.5"/>
  <text x="75" y="125" fill="#64748b" font-family="monospace" font-size="12">Class II • Max 6.000 kg • Min 0.050 kg • e = 0.001 kg • d = 0.0002 kg</text>
  <text x="725" y="125" fill="#10b981" font-family="monospace" font-size="12" text-anchor="end">APPLIED TEST LOAD: 3.000 kg</text>
  <rect x="75" y="145" width="650" height="230" rx="12" fill="url(#lcd2)" stroke="#047857" stroke-width="3"/>
  <rect x="100" y="165" width="70" height="26" rx="4" fill="#047857"/>
  <text x="135" y="183" fill="#6ee7b7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">STABLE</text>
  <rect x="180" y="165" width="55" height="26" rx="4" fill="#047857"/>
  <text x="207" y="183" fill="#6ee7b7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">NET</text>
  <text x="590" y="315" fill="#34d399" font-family="'Courier New', Courier, monospace" font-size="110" font-weight="900" text-anchor="end" letter-spacing="4">3.0000</text>
  <text x="615" y="310" fill="#a7f3d0" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="700">kg</text>
  <text x="75" y="415" fill="#64748b" font-family="monospace" font-size="11">SN: SN-BS-26001 • Test: Clause A.4.4.2 Weighing Performance (L=3kg) • Verified Standard F1</text>
</svg>`;

// 3. 6.0002 kg Load Display (Capacity Max)
const svg6kg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="480" viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bezel3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="lcd3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="480" fill="#f8fafc"/>
  <rect x="40" y="40" width="720" height="400" rx="24" fill="url(#bezel3)" stroke="#334155" stroke-width="4"/>
  <text x="75" y="85" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" letter-spacing="2">APEX METROLOGY INSTRUMENTS</text>
  <text x="725" y="85" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="end">MODEL: Precision-Bench-B6</text>
  <line x1="75" y1="100" x2="725" y2="100" stroke="#334155" stroke-width="1.5"/>
  <text x="75" y="125" fill="#64748b" font-family="monospace" font-size="12">Class II • Max 6.000 kg • Min 0.050 kg • e = 0.001 kg • d = 0.0002 kg</text>
  <text x="725" y="125" fill="#38bdf8" font-family="monospace" font-size="12" text-anchor="end">APPLIED TEST LOAD: 6.000 kg (Max)</text>
  <rect x="75" y="145" width="650" height="230" rx="12" fill="url(#lcd3)" stroke="#047857" stroke-width="3"/>
  <rect x="100" y="165" width="70" height="26" rx="4" fill="#047857"/>
  <text x="135" y="183" fill="#6ee7b7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">STABLE</text>
  <text x="590" y="315" fill="#34d399" font-family="'Courier New', Courier, monospace" font-size="110" font-weight="900" text-anchor="end" letter-spacing="4">6.0002</text>
  <text x="615" y="310" fill="#a7f3d0" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="700">kg</text>
  <text x="75" y="415" fill="#64748b" font-family="monospace" font-size="11">SN: SN-BS-26001 • Test: Clause A.4.4.2 Max Capacity • Error E = +0.2g (Within MPE ±1.0g)</text>
</svg>`;

// 4. Pan Eccentricity Quadrants Setup
const svgPan = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="520" fill="#f8fafc"/>
  <rect x="30" y="30" width="740" height="460" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="60" y="70" fill="#1e293b" font-family="system-ui, sans-serif" font-size="18" font-weight="800">OIML R 76-1 CLAUSE A.4.7.1 — ECCENTRIC LOAD RECEPTOR SETUP</text>
  <text x="60" y="95" fill="#64748b" font-family="system-ui, sans-serif" font-size="13">Standard Pan Geometry: Quadrant Partitioning (Load: 1/3 Max = 2.0 kg)</text>
  
  <!-- Outer Pan -->
  <rect x="230" y="130" width="340" height="300" rx="30" fill="#f1f5f9" stroke="#0284c7" stroke-width="3" stroke-dasharray="6,4"/>
  <!-- Center Mark -->
  <circle cx="400" cy="280" r="32" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <text x="400" y="285" fill="#0369a1" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">CTR (1)</text>

  <!-- Quadrants -->
  <!-- Q1: Top-Left -->
  <rect x="260" y="160" width="90" height="75" rx="12" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="305" y="195" fill="#15803d" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Q1 (2)</text>
  <text x="305" y="215" fill="#166534" font-family="monospace" font-size="10" text-anchor="middle">Top-Left</text>

  <!-- Q2: Top-Right -->
  <rect x="450" y="160" width="90" height="75" rx="12" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
  <text x="495" y="195" fill="#854d0e" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Q2 (3)</text>
  <text x="495" y="215" fill="#713f12" font-family="monospace" font-size="10" text-anchor="middle">Top-Right</text>

  <!-- Q3: Bottom-Right -->
  <rect x="450" y="325" width="90" height="75" rx="12" fill="#f3e8ff" stroke="#9333ea" stroke-width="2"/>
  <text x="495" y="360" fill="#6b21a8" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Q3 (4)</text>
  <text x="495" y="380" fill="#581c87" font-family="monospace" font-size="10" text-anchor="middle">Btm-Right</text>

  <!-- Q4: Bottom-Left -->
  <rect x="260" y="325" width="90" height="75" rx="12" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <text x="305" y="360" fill="#b91c1c" font-family="system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">Q4 (5)</text>
  <text x="305" y="380" fill="#991b1b" font-family="monospace" font-size="10" text-anchor="middle">Btm-Left</text>

  <!-- Side Explanations -->
  <text x="600" y="200" fill="#334155" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Clause A.4.7 Rules:</text>
  <text x="600" y="225" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">• Test load = 1/3 Max (2 kg)</text>
  <text x="600" y="245" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">• Center + 4 quadrants</text>
  <text x="600" y="265" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">• Inter-position diff ≤ MPE</text>
  <text x="600" y="285" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">• Zero checked between runs</text>
  
  <text x="60" y="465" fill="#94a3b8" font-family="monospace" font-size="11">Specimen: Precision-Bench-B6 • Pan Diameter: 240mm Stainless 304 • Certified Setup</text>
</svg>`;

// 5. Mass Standard Calibration Certificate Artifact
const svgCert = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="520" fill="#f8fafc"/>
  <rect x="40" y="30" width="720" height="460" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <!-- Header with Coat of Arms style badge -->
  <rect x="42" y="32" width="716" height="70" fill="#0f172a" rx="6"/>
  <text x="400" y="65" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle" letter-spacing="1">REGIONAL REFERENCE STANDARDS LABORATORY (RRSL)</text>
  <text x="400" y="85" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Department of Consumer Affairs • Legal Metrology Division, Govt. of India</text>
  
  <!-- Certificate Title -->
  <text x="400" y="135" fill="#0f172a" font-family="system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">CERTIFICATE OF CALIBRATION — REFERENCE MASS STANDARDS</text>
  <text x="400" y="155" fill="#0284c7" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">CERTIFICATE NO: RRSL-CAL-2026-F1-0842</text>
  
  <line x1="80" y1="175" x2="720" y2="175" stroke="#e2e8f0" stroke-width="1.5"/>
  
  <!-- Metadata Grid -->
  <text x="80" y="200" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">Standard Set:</text>
  <text x="180" y="200" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" font-weight="700">Class F1 Stainless Weights (1mg - 10kg)</text>
  <text x="440" y="200" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">Traceability ID:</text>
  <text x="540" y="200" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" font-weight="700">NPL/MASS/2025/1190</text>
  
  <text x="80" y="225" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">Date of Calibration:</text>
  <text x="180" y="225" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" font-weight="700">12 January 2026</text>
  <text x="440" y="225" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">Valid Until:</text>
  <text x="540" y="225" fill="#16a34a" font-family="system-ui, sans-serif" font-size="11" font-weight="700">11 January 2028 (ACTIVE)</text>
  
  <!-- Table of Calibration Values -->
  <rect x="80" y="245" width="640" height="150" fill="#f8fafc" stroke="#e2e8f0"/>
  <rect x="80" y="245" width="640" height="26" fill="#f1f5f9"/>
  <text x="100" y="262" fill="#475569" font-family="system-ui, sans-serif" font-size="10" font-weight="700">Nominal Mass</text>
  <text x="240" y="262" fill="#475569" font-family="system-ui, sans-serif" font-size="10" font-weight="700">True Conventional Mass</text>
  <text x="420" y="262" fill="#475569" font-family="system-ui, sans-serif" font-size="10" font-weight="700">Expanded Uncertainty (U, k=2)</text>
  <text x="630" y="262" fill="#475569" font-family="system-ui, sans-serif" font-size="10" font-weight="700">OIML Class</text>
  
  <text x="100" y="295" fill="#1e293b" font-family="monospace" font-size="11">1.000 kg</text>
  <text x="240" y="295" fill="#1e293b" font-family="monospace" font-size="11">1.000 002 kg</text>
  <text x="420" y="295" fill="#1e293b" font-family="monospace" font-size="11">± 0.05 mg (0.00005 g)</text>
  <text x="630" y="295" fill="#16a34a" font-family="system-ui, sans-serif" font-size="11" font-weight="700">F1 PASS</text>
  
  <text x="100" y="325" fill="#1e293b" font-family="monospace" font-size="11">2.000 kg</text>
  <text x="240" y="325" fill="#1e293b" font-family="monospace" font-size="11">2.000 005 kg</text>
  <text x="420" y="325" fill="#1e293b" font-family="monospace" font-size="11">± 0.10 mg (0.00010 g)</text>
  <text x="630" y="325" fill="#16a34a" font-family="system-ui, sans-serif" font-size="11" font-weight="700">F1 PASS</text>

  <text x="100" y="355" fill="#1e293b" font-family="monospace" font-size="11">3.000 kg (Combined)</text>
  <text x="240" y="355" fill="#1e293b" font-family="monospace" font-size="11">3.000 007 kg</text>
  <text x="420" y="355" fill="#1e293b" font-family="monospace" font-size="11">± 0.15 mg (0.00015 g)</text>
  <text x="630" y="355" fill="#16a34a" font-family="system-ui, sans-serif" font-size="11" font-weight="700">F1 PASS</text>
  
  <!-- Compliance Declaration -->
  <text x="80" y="425" fill="#0f172a" font-family="system-ui, sans-serif" font-size="11" font-weight="600">OIML R 76-1 Clause 3.7.1 Compliance Statement:</text>
  <text x="80" y="445" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">The combined expanded measurement uncertainty (U) does not exceed 1/3 of the applicable maximum permissible error (MPE)</text>
  <text x="80" y="460" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">of the verified Non-Automatic Weighing Instrument under test across all operational evaluation ranges.</text>
  
  <!-- Stamp / Signature -->
  <rect x="580" y="415" width="140" height="55" rx="4" fill="#f8fafc" stroke="#0284c7" stroke-dasharray="4,2"/>
  <text x="650" y="435" fill="#0284c7" font-family="system-ui, sans-serif" font-size="10" font-weight="800" text-anchor="middle">RRSL ACCREDITED</text>
  <text x="650" y="455" fill="#0369a1" font-family="monospace" font-size="9" text-anchor="middle">DIGITALLY SEALED</text>
</svg>`;

fs.writeFileSync(path.join(targetDir, 'display_0kg_datum.svg'), svgZero);
fs.writeFileSync(path.join(targetDir, 'display_3kg_midpoint.svg'), svg3kg);
fs.writeFileSync(path.join(targetDir, 'display_6kg_max.svg'), svg6kg);
fs.writeFileSync(path.join(targetDir, 'pan_eccentricity_setup.svg'), svgPan);
fs.writeFileSync(path.join(targetDir, 'mass_calibration_certificate.svg'), svgCert);

console.log('Successfully generated 5 demo evidence artifacts in public/demo-evidence/');
